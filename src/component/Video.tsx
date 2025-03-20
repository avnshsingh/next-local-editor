import { FFmpeg } from "@ffmpeg/ffmpeg";
import { fetchFile } from "@ffmpeg/util";
import React, { useEffect, useRef, useState } from "react";

const Video = () => {
  const ffmpegRef = useRef(new FFmpeg());
  const [isFFmpegLoaded, setIsFFmpegLoaded] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const messageRef = useRef<HTMLParagraphElement | null>(null);
  const [gifUrl, setGifUrl] = useState<string>("");

  useEffect(() => {
    const loadFFmpeg = async () => {
      try {
        const baseURL = "https://unpkg.com/@ffmpeg/core@0.12.10/dist/umd";
        const ffmpeg = ffmpegRef.current;
        ffmpeg.on("log", ({ message }) => {
          console.log("on ffmpeg: ", message);
          if (messageRef.current) {
            messageRef.current.innerHTML = message;
          }
        });
        await ffmpeg.load({
          coreURL: `${baseURL}/ffmpeg-core.js`,
          wasmURL: `${baseURL}/ffmpeg-core.wasm`,
          workerURL: `${baseURL}/ffmpeg-core.worker.js`,
        });
        setIsFFmpegLoaded(true);
      } catch (error) {
        console.error("Error loading FFmpeg:", error);
      }
    };
    loadFFmpeg();
  }, []);

  console.log("isFFmpegLoaded: ", isFFmpegLoaded);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (videoRef.current) {
      videoRef.current.src = URL.createObjectURL(file);
    }
  };

  const convertToGif = async () => {
    if (!videoRef.current?.src) return console.error("No video source");

    const ffmpeg = ffmpegRef.current;
    try {
      // Write the video file to FFmpeg's virtual file system
      await ffmpeg.writeFile(
        "input.mp4",
        await fetchFile(videoRef.current.src)
      );

      // Run FFmpeg command to convert video to GIF
      await ffmpeg.exec([
        "-i",
        "input.mp4",
        "-vf",
        "fps=10,scale=320:-1:flags=lanczos",
        "output.gif",
      ]);

      // Read the resulting GIF file
      const data = await ffmpeg.readFile("output.gif");
      const gifBlob = new Blob([data], { type: "image/gif" });
      const gifUrl = URL.createObjectURL(gifBlob);
      setGifUrl(gifUrl);
    } catch (error) {
      console.error("Error converting to GIF:", error);
    }
  };

  return (
    <div className="flex flex-col items-center gap-4 p-4">
      <input
        type="file"
        accept="video/*"
        onChange={handleFileChange}
        className="mb-4"
      />
      <video ref={videoRef} controls className="max-w-md" />
      <button
        onClick={convertToGif}
        disabled={!isFFmpegLoaded || !videoRef.current}
        className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded disabled:opacity-50"
      >
        Convert to GIF
      </button>
      <p ref={messageRef} className="text-gray-600"></p>
      {gifUrl && (
        <div className="mt-4">
          <h3 className="text-lg font-semibold mb-2">Converted GIF:</h3>
          <img src={gifUrl} alt="Converted GIF" className="max-w-md" />
        </div>
      )}
    </div>
  );
};

export default Video;
