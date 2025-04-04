"use client";
import { FFmpeg } from "@ffmpeg/ffmpeg";
import { fetchFile } from "@ffmpeg/util";
import React, { useEffect, useRef, useState } from "react";
import roboto from "../fonts/Roboto-Regular.ttf";
import robotoBold from "../fonts/Roboto-Bold.ttf";

function toFFmpegColor(rgb) {
  const bgr = rgb.slice(5, 7) + rgb.slice(3, 5) + rgb.slice(1, 3);
  return "&H" + bgr + "&";
}

const Test = () => {
  const ffmpegRef = useRef(new FFmpeg());
  const [isFFmpegLoaded, setIsFFmpegLoaded] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const messageRef = useRef<HTMLParagraphElement | null>(null);
  const [videoFile, setVideoFile] = React.useState<File | null>(null);
  const [videoUrl, setVideoUrl] = React.useState<string | null>(null);
  const [subtitles, setSubtitles] = React.useState<Array<{
    start: number;
    end: number;
    text: string;
  }> | null>(null);
  const [fontFile, setFontFile] = React.useState<File | null>(null);
  const [primaryColor, setPrimaryColor] = useState("#FFFFFF");
  const [outlineColor, setOutlineColor] = useState("#000000");
  const [useAssFormat, setUseAssFormat] = useState(false);

  console.log("subtitles: ", subtitles);

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
        await ffmpeg.writeFile("/tmp/roboto.ttf", await fetchFile(roboto));
        await ffmpeg.writeFile(
          "/tmp/roboto-bold.ttf",
          await fetchFile(robotoBold)
        );

        setIsFFmpegLoaded(true);
      } catch (error) {
        console.error("Error loading FFmpeg:", error);
      }
    };
    loadFFmpeg();
  }, []);

  const parseSRT = (content: string) => {
    const subtitles: Array<{ start: number; end: number; text: string }> = [];
    const blocks = content.split(/\n\n/).filter(Boolean);

    blocks.forEach(block => {
      const lines = block.split(/\n/);
      if (lines.length >= 2) {
        const timeMatch = lines[1].match(
          /(\d{2}):(\d{2}):(\d{2}),(\d{3}) --> (\d{2}):(\d{2}):(\d{2}),(\d{3})/
        );
        if (timeMatch) {
          const start =
            (+timeMatch[1] * 3600 + +timeMatch[2] * 60 + +timeMatch[3]) * 1000 +
            +timeMatch[4];
          const end =
            (+timeMatch[5] * 3600 + +timeMatch[6] * 60 + +timeMatch[7]) * 1000 +
            +timeMatch[8];
          const text = lines.slice(2).join(" ");
          subtitles.push({ start, end, text });
        }
      }
    });

    return subtitles;
  };

  const handleSubtitleChange = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    try {
      const file = e.target.files?.[0];
      if (file) {
        const content = await file.text();
        const parsedSubtitles = parseSRT(content);
        setSubtitles(parsedSubtitles);
      }
    } catch (error) {
      console.error("Error handling subtitle change:", error);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    try {
      const file = e.target.files?.[0];
      setVideoFile(file);
      if (file) {
        const url = URL.createObjectURL(file);
        setVideoUrl(url);
        // setSubtitles([]);
      }
    } catch (error) {
      console.error("Error handling file change:", error);
    }
  };
  const exportVideoWithSubtitles = async () => {
    if (!videoFile || !subtitles) return;

    try {
      const ffmpeg = ffmpegRef.current;
      const inputName = "input.mp4";
      const outputName = "output.mp4";

      // Write video file to FFmpeg's virtual file system
      await ffmpeg.writeFile(inputName, await fetchFile(videoFile));

      // Create subtitles file in SRT or ASS format
      let subtitleContent = "";
      let subtitleFilename = "subs.srt";

      // TikTok-style ASS format
      if (useAssFormat) {
        subtitleFilename = "subs.ass";
        subtitleContent =
          "[Script Info]\nScriptType: v4.00+\nPlayResX: 384\nPlayResY: 288\n\n[V4+ Styles]\nFormat: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding\nStyle: Default,Roboto Bold,36,&H00FFFFFF,&H000000FF,&H00000000,&H00000000,0,0,0,0,100,100,0,0,1,1,0,2,10,10,70,0\n\n[Events]\nFormat: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text\n";

        subtitles.forEach((sub, index) => {
          subtitleContent += `Dialogue: 0,${formatAssTime(
            sub.start
          )},${formatAssTime(sub.end)},Default,,0,0,0,,${sub.text}\n`;
        });
      } else {
        // Original SRT format
        subtitles.forEach((sub, index) => {
          subtitleContent += `${index + 1}\n`;
          subtitleContent += `${formatTime(sub.start)} --> ${formatTime(
            sub.end
          )}\n`;
          subtitleContent += `${sub.text}\n\n`;
        });
      }

      await ffmpeg.writeFile(subtitleFilename, subtitleContent);

      console.log("subtitle in export: ", {
        subtitleFilename,
        subtitleContent,
      });

      await ffmpeg.exec([
        "-i",
        inputName,
        "-preset",
        "ultrafast",
        "-to",
        "00:00:03", // till only 3 seconds
        "-vf",
        // prettier-ignore
        `subtitles=${subtitleFilename}:fontsdir=/tmp`,
        // `subtitles=${subtitleFilename}:fontsdir=/tmp:force_style='Fontname=Roboto Bold,FontSize=30,MarginV=70,PrimaryColour=${toFFmpegColor(primaryColor)},OutlineColour=${toFFmpegColor(outlineColor)}'`,
        outputName,
      ]);

      // old command

      // await ffmpeg.exec([
      //   "-i",
      //   inputName,
      //   "-vf",
      //   fontFile
      //     ? "subtitles=subtitles.srt:fontsdir=./:force_style='FontName=font.ttf'"
      //     : "subtitles=subtitles.srt",
      //   "-s",
      //   "854x480", // 480p resolution
      //   "-r",
      //   "24", // 24fps
      //   "-c:a",
      //   "copy",
      //   outputName,
      // ]);

      // Read and download the result
      const data = await ffmpeg.readFile(outputName);
      const url = URL.createObjectURL(
        new Blob([data.buffer], { type: "video/mp4" })
      );

      const a = document.createElement("a");
      a.href = url;
      a.download = "video_with_subtitles.mp4";
      a.click();
    } catch (error) {
      console.error("Error exporting video:", error);
      if (messageRef.current) {
        messageRef.current.textContent =
          "Error exporting video: " + error?.message;
      }
    }
  };

  const formatTime = (ms: number) => {
    const date = new Date(ms);
    const hours = date.getUTCHours().toString().padStart(2, "0");
    const minutes = date.getUTCMinutes().toString().padStart(2, "0");
    const seconds = date.getUTCSeconds().toString().padStart(2, "0");
    const milliseconds = date.getUTCMilliseconds().toString().padStart(3, "0");
    return `${hours}:${minutes}:${seconds},${milliseconds}`;
  };

  const formatAssTime = (ms: number) => {
    const date = new Date(ms);
    const hours = date.getUTCHours().toString().padStart(1, "0");
    const minutes = date.getUTCMinutes().toString().padStart(2, "0");
    const seconds = date.getUTCSeconds().toString().padStart(2, "0");
    const centiseconds = Math.floor(date.getUTCMilliseconds() / 10)
      .toString()
      .padStart(2, "0");
    return `${hours}:${minutes}:${seconds}.${centiseconds}`;
  };

  return (
    <div>
      <input type="file" accept="video/*" onChange={handleFileChange} />
      <input type="file" accept=".srt" onChange={handleSubtitleChange} />
      <input
        type="file"
        accept=".ttf,.otf"
        onChange={e => setFontFile(e.target.files?.[0] || null)}
      />
      <div className="flex items-center gap-2 mt-4">
        <label className="block text-sm font-medium">Subtitle Format:</label>
        <label className="relative inline-flex items-center cursor-pointer">
          <input
            type="checkbox"
            className="sr-only peer"
            checked={useAssFormat}
            onChange={() => setUseAssFormat(!useAssFormat)}
          />
          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
          <span className="ml-3 text-sm font-medium">
            {useAssFormat ? "ASS (TikTok Style)" : "SRT"}
          </span>
        </label>
      </div>
      <div className="flex gap-4 mt-4">
        <div>
          <label className="block text-sm font-medium mb-1">
            Primary Color
          </label>
          <input
            type="color"
            value={primaryColor}
            onChange={e => setPrimaryColor(e.target.value)}
            className="w-12 h-12"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">
            Outline Color
          </label>
          <input
            type="color"
            value={outlineColor}
            onChange={e => setOutlineColor(e.target.value)}
            className="w-12 h-12"
          />
        </div>
      </div>
      <video ref={videoRef} src={videoUrl || ""} controls />
      <p ref={messageRef}></p>
      <button
        onClick={exportVideoWithSubtitles}
        disabled={!videoFile || !subtitles}
        className="bg-blue-500 hover:bg-blue-700 text-white py-2 px-4 rounded mt-4"
      >
        Export with {useAssFormat ? "ASS (TikTok Style)" : "SRT"} Subtitles
        (480p 24fps)
      </button>
    </div>
  );
};

export default Test;
