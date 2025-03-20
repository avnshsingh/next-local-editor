import { useState, useEffect, useCallback } from "react";
import { pipeline, type Pipeline } from "@xenova/transformers";
import { ProgressItemTransformer } from "@/lib/types";

export function useWhisperMini() {
  const [loading, setLoading] = useState(false);
  const [modelProgress, setModelProgress] = useState(0);
  const [isModelDownloaded, setIsModelDownloaded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [transcriber, setTranscriber] = useState<Pipeline | null>(null);

  const loadModels = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const transcriberPipeline: Pipeline = await pipeline(
        "automatic-speech-recognition",
        "distil-whisper/distil-small.en",
        {
          quantized: true,
          progress_callback: (progress: ProgressItemTransformer) => {
            console.log("Progress:", progress);
            if (progress.status === "progress") {
              const percentage = Math.round(
                (progress.loaded / progress.total) * 100
              );
              setModelProgress(Math.floor(percentage));
            } else if (progress.status === "done") {
              setIsModelDownloaded(true);
            }
          },
        }
      );
      setTranscriber(transcriberPipeline);
      setModelProgress(100);
    } catch (err) {
      console.error("Model loading error:", err);
      setError("Error loading models");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadModels();
  }, [loadModels]);

  return {
    loading,
    modelProgress,
    isModelDownloaded,
    error,
    transcriber,
  };
}
