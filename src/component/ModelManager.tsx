"use client";

import { useEffect, useState } from "react";
import { env } from "@xenova/transformers";

interface ModelInfo {
  name: string;
  size: string;
  path: string;
}

export default function ModelManager() {
  const [models, setModels] = useState<ModelInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadModels();
  }, []);
  const loadModels = async () => {
    try {
      setLoading(true);
      setError(null);

      const cache = await caches.open("transformers-cache");
      const keys = await cache.keys();
      const modelInfos: ModelInfo[] = [];

      for (const key of keys) {
        const response = await cache.match(key);
        if (response) {
          const size = parseInt(response.headers.get("content-length") || "0");
          const pathParts = key.url.split("/");
          const name = pathParts[pathParts.length - 2] || "unknown";

          modelInfos.push({
            name,
            size: formatBytes(size),
            path: key.url,
          });
        }
      }

      setModels(modelInfos);
    } catch (err) {
      setError("Failed to load models: " + (err as Error).message);
    } finally {
      setLoading(false);
    }
  };
  console.log("models", models);

  const deleteModel = async (modelPath: string) => {
    try {
      const cache = await caches.open("transformers-cache");
      await cache.delete(modelPath);
      await loadModels(); // Refresh the list
    } catch (err) {
      setError("Failed to delete model: " + (err as Error).message);
    }
  };

  const deleteAllModels = async () => {
    try {
      const cache = await caches.open("transformers-cache");
      for (const model of models) {
        await cache.delete(model.path);
      }
      await loadModels(); // Refresh the list
    } catch (err) {
      setError("Failed to delete all models: " + (err as Error).message);
    }
  };

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  if (loading) {
    return <div className="p-4">Loading models...</div>;
  }

  if (error) {
    return <div className="p-4 text-red-500">{error}</div>;
  }

  return (
    <div className="p-4">
      <h2 className="text-2xl font-bold mb-4">Cached Models</h2>
      {models.length === 0 ? (
        <p>No models found in cache directory.</p>
      ) : (
        <div>
          <button
            onClick={deleteAllModels}
            className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded mb-4"
          >
            Delete All Models
          </button>
          <div className="grid gap-4">
            {models.map(model => (
              <div
                key={model.path}
                className="border rounded-lg p-4 flex justify-between items-center"
              >
                <div>
                  <h3 className="font-semibold">{model.name}</h3>
                  <p className="text-sm text-gray-600">Path: {model.path}</p>
                  <p className="text-sm text-gray-600">Size: {model.size}</p>
                </div>
                <button
                  onClick={() => deleteModel(model.path)}
                  className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded"
                >
                  Delete
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
