"use client";
import { FFmpeg } from "@ffmpeg/ffmpeg";
import { fetchFile } from "@ffmpeg/util";
import React, { useEffect, useRef, useState } from "react";
import roboto from "../fonts/Roboto-Regular.ttf";
import robotoBold from "../fonts/Roboto-Bold.ttf";
import { Button } from "@/components/ui/button";
import { DummyAssSubtileKaroke } from "@/lib/DummyData";
import { Muxer, ArrayBufferTarget } from "webm-muxer";

function toFFmpegColor(rgb) {
  const bgr = rgb.slice(5, 7) + rgb.slice(3, 5) + rgb.slice(1, 3);
  return "&H" + bgr + "&";
}

// New function for FFmpeg drawtext filter color format
function toDrawTextColor(rgb) {
  // Convert hex color (#RRGGBB) to 0xRRGGBB format for FFmpeg drawtext filter
  return rgb.replace("#", "0x");
}

// Predefined subtitle style presets
const subtitleStyles = {
  tiktok: {
    primaryColor: "#FFFFFF",
    outlineColor: "#000000",
    backgroundColor: "#000000",
    backgroundOpacity: 0.5,
    fontSize: 36,
    marginV: 70,
    outlineWidth: 1,
    bold: 0,
    italic: 0,
    underline: 0,
    strikeOut: 0,
    scaleX: 100,
    scaleY: 100,
    spacing: 0,
    angle: 0,
    borderStyle: 4, // 1=outline, 3=opaque box, 4=shadow
    shadow: 0,
    alignment: 2, // 2=bottom center
    marginL: 10,
    marginR: 10,
  },
};

const Test = () => {
  const ffmpegRef = useRef(new FFmpeg());
  const [isFFmpegLoaded, setIsFFmpegLoaded] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const messageRef = useRef<HTMLParagraphElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [videoFile, setVideoFile] = React.useState<File | null>(null);
  const [videoUrl, setVideoUrl] = React.useState<string | null>(null);
  const [subtitles, setSubtitles] = React.useState<Array<{
    start: number;
    end: number;
    text: string;
  }> | null>(null);
  const [videoInfo, setVideoInfo] = React.useState<{
    width: number;
    height: number;
    duration: number;
    fps: number;
  } | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);

  // Style preset selection
  const [selectedStyle, setSelectedStyle] =
    useState<keyof typeof subtitleStyles>("tiktok");

  // Basic style properties
  const [primaryColor, setPrimaryColor] = useState(
    subtitleStyles.tiktok.primaryColor
  );
  const [outlineColor, setOutlineColor] = useState(
    subtitleStyles.tiktok.outlineColor
  );
  const [backgroundColor, setBackgroundColor] = useState(
    subtitleStyles.tiktok.backgroundColor
  );
  const [backgroundOpacity, setBackgroundOpacity] = useState(
    subtitleStyles.tiktok.backgroundOpacity
  );
  const [fontSize, setFontSize] = useState(subtitleStyles.tiktok.fontSize);
  const [marginV, setMarginV] = useState(subtitleStyles.tiktok.marginV);
  const [outlineWidth, setOutlineWidth] = useState(
    subtitleStyles.tiktok.outlineWidth
  );

  // Advanced style properties
  const [bold, setBold] = useState(subtitleStyles.tiktok.bold);
  const [italic, setItalic] = useState(subtitleStyles.tiktok.italic);
  const [underline, setUnderline] = useState(subtitleStyles.tiktok.underline);
  const [strikeOut, setStrikeOut] = useState(subtitleStyles.tiktok.strikeOut);
  const [scaleX, setScaleX] = useState(subtitleStyles.tiktok.scaleX);
  const [scaleY, setScaleY] = useState(subtitleStyles.tiktok.scaleY);
  const [spacing, setSpacing] = useState(subtitleStyles.tiktok.spacing);
  const [angle, setAngle] = useState(subtitleStyles.tiktok.angle);
  const [borderStyle, setBorderStyle] = useState(
    subtitleStyles.tiktok.borderStyle
  );
  const [shadow, setShadow] = useState(subtitleStyles.tiktok.shadow);
  const [alignment, setAlignment] = useState(subtitleStyles.tiktok.alignment);
  const [marginL, setMarginL] = useState(subtitleStyles.tiktok.marginL);
  const [marginR, setMarginR] = useState(subtitleStyles.tiktok.marginR);

  const [useAssFormat, setUseAssFormat] = useState(true);
  const [currentSubtitle, setCurrentSubtitle] = useState("");
  const previewRef = useRef<HTMLDivElement>(null);

  console.log("subtitles: ", subtitles);
  console.log("videoUrl: ", videoUrl);
  console.log("videoFile: ", videoFile);

  useEffect(() => {
    const updatePreview = () => {
      if (videoRef.current && previewRef.current && subtitles) {
        const time = videoRef.current.currentTime * 1000;
        const currentSub = subtitles.find(
          sub => time >= sub.start && time <= sub.end
        );
        setCurrentSubtitle(currentSub?.text || "");
      }
    };

    const video = videoRef.current;
    if (video) {
      video.addEventListener("timeupdate", updatePreview);
      return () => video.removeEventListener("timeupdate", updatePreview);
    }
  }, [subtitles]);

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

        // Get video information when a file is loaded
        const video = document.createElement("video");
        video.onloadedmetadata = () => {
          setVideoInfo({
            width: video.videoWidth,
            height: video.videoHeight,
            duration: video.duration,
            fps: 30, // Assuming 30fps as default
          });
        };
        video.src = url;
      }
    } catch (error) {
      console.error("Error handling file change:", error);
    }
  };
  // Render a subtitle frame to canvas
  const renderSubtitleToCanvas = (canvas, subtitle, timestamp) => {
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Clear the canvas with transparent background
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Find subtitle that should be displayed at this timestamp
    const currentSub = subtitle
      ? subtitles?.find(sub => timestamp >= sub.start && timestamp <= sub.end)
      : null;

    if (!currentSub) return; // No subtitle to display at this time

    // Set text style based on user settings
    ctx.font = `${bold ? "bold" : ""} ${
      italic ? "italic" : ""
    } ${fontSize}px 'Roboto'`;
    ctx.textAlign = "center";
    ctx.textBaseline = "bottom";

    // Calculate text position
    const x = canvas.width / 2;
    const y = canvas.height - marginV;

    // Apply text styling based on borderStyle
    if (borderStyle === 3) {
      // Opaque box
      // Measure text to create background box
      const metrics = ctx.measureText(currentSub.text);
      const textHeight = fontSize * 1.2; // Approximate height based on font size
      const padding = 8;

      // Draw background box
      ctx.fillStyle = `${backgroundColor}${Math.round(backgroundOpacity * 255)
        .toString(16)
        .padStart(2, "0")}`;
      ctx.fillRect(
        x - metrics.width / 2 - padding,
        y - textHeight - padding,
        metrics.width + padding * 2,
        textHeight + padding * 2
      );
    }

    // Draw text outline/shadow if needed
    if (borderStyle === 1 || borderStyle === 4) {
      // Outline or shadow
      ctx.strokeStyle = outlineColor;
      ctx.lineWidth = outlineWidth * 2;
      ctx.lineJoin = "round";
      ctx.strokeText(currentSub.text, x, y);

      if (borderStyle === 4 && shadow > 0) {
        // Shadow
        ctx.shadowColor = outlineColor;
        ctx.shadowBlur = shadow * 4;
        ctx.shadowOffsetX = outlineWidth;
        ctx.shadowOffsetY = outlineWidth;
      }
    }

    // Draw the main text
    ctx.fillStyle = primaryColor;
    ctx.shadowColor = "transparent"; // Reset shadow for main text
    ctx.fillText(currentSub.text, x, y);
  };

  // Create a subtitle-only video using WebCodecs and webm-muxer
  const createSubtitleOnlyVideo = async () => {
    if (!videoInfo || !subtitles || !subtitles.length) {
      throw new Error("Video info or subtitles not available");
    }

    if (!("VideoEncoder" in window)) {
      throw new Error("WebCodecs API not supported in this browser");
    }

    try {
      // Create an offscreen canvas for rendering subtitles
      const canvas = document.createElement("canvas");
      canvas.width = videoInfo.width;
      canvas.height = videoInfo.height;

      // Calculate total frames based on video duration and fps
      const totalFrames = Math.ceil(videoInfo.duration * videoInfo.fps);
      const frameDuration = 1000 / videoInfo.fps; // ms per frame

      // Setup WebM muxer with ArrayBufferTarget for VP9 video with alpha channel
      const target = new ArrayBufferTarget();
      const muxer = new Muxer({
        target: target,
        video: {
          codec: "V_VP9",
          width: canvas.width,
          height: canvas.height,
          frameRate: videoInfo.fps,
          alpha: true, // Enable alpha channel for transparency
        },
      });

      // Create VideoEncoder
      const videoEncoder = new VideoEncoder({
        output: (chunk, meta) => muxer.addVideoChunk(chunk, meta),
        error: e => {
          console.error("Encoder error:", e);
        },
      });

      // Configure the encoder
      videoEncoder.configure({
        codec: "vp09.00.10.08",
        width: canvas.width,
        height: canvas.height,
        bitrate: 1e6,
      });

      // Process each frame
      for (let frameIndex = 0; frameIndex < totalFrames; frameIndex++) {
        const timestamp = frameIndex * frameDuration;

        // Update progress
        setExportProgress(Math.round((frameIndex / totalFrames) * 50)); // First half of progress

        // Render subtitle for this frame
        renderSubtitleToCanvas(canvas, subtitles, timestamp);

        // Create a VideoFrame from the canvas
        const frame = new VideoFrame(canvas, {
          timestamp: timestamp * 1000, // microseconds
          duration: frameDuration * 1000, // microseconds
        });

        // Encode the frame
        videoEncoder.encode(frame, { keyFrame: frameIndex % 150 === 0 });
        frame.close();

        // Allow UI to update by yielding execution
        if (frameIndex % 10 === 0) {
          await new Promise(resolve => setTimeout(resolve, 0));
        }
      }

      // Finish encoding
      await videoEncoder.flush();
      videoEncoder.close();

      // Finalize the WebM file
      muxer.finalize();
      const { buffer } = target;
      const webmBlob = new Blob([buffer], { type: "video/webm" });
      return webmBlob;
    } catch (error) {
      console.error("Error creating subtitle video:", error);
      throw error;
    }
  };

  const exportVideoWithSubtitles = async () => {
    if (!videoFile || !subtitles || !videoInfo) return;

    try {
      setIsExporting(true);
      setExportProgress(0);

      // Step 1: Create subtitle-only video with transparent background using WebCodecs
      if (messageRef.current) {
        messageRef.current.textContent = "Creating subtitle overlay...";
      }

      const subtitleVideoBlob = await createSubtitleOnlyVideo();

      // Step 2: Use ffmpeg.wasm to overlay the subtitle video on the original video
      if (messageRef.current) {
        messageRef.current.textContent = "Overlaying subtitles on video...";
      }

      const ffmpeg = ffmpegRef.current;
      const inputName = "input.mp4";
      const subtitleName = "subtitles.webm";
      const outputName = "output.mp4";

      // Write both videos to FFmpeg's virtual file system
      await ffmpeg.writeFile(inputName, await fetchFile(videoFile));
      await ffmpeg.writeFile(subtitleName, await fetchFile(subtitleVideoBlob));

      // Use FFmpeg's overlay filter to combine the videos
      await ffmpeg.exec([
        "-i",
        inputName,
        "-i",
        subtitleName,
        "-filter_complex",
        "[0:v][1:v]overlay=format=auto",
        "-c:a",
        "copy",
        "-to",
        "00:00:05", // Limit to 10 seconds for testing
        "-preset",
        "ultrafast",
        outputName,
      ]);

      setExportProgress(90);

      // Read and download the output file
      const data = await ffmpeg.readFile(outputName);
      const url = URL.createObjectURL(
        new Blob([data.buffer], { type: "video/mp4" })
      );

      setExportProgress(100);

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
    } finally {
      setIsExporting(false);
    }
  };

  // Legacy export function using only ffmpeg.wasm with drawtext filters
  const exportVideoWithSubtitlesLegacy = async () => {
    if (!videoFile || !subtitles) return;

    try {
      const ffmpeg = ffmpegRef.current;
      const inputName = "input.mp4";
      const outputName = "output.mp4";

      // Write video file to FFmpeg's virtual file system
      await ffmpeg.writeFile(inputName, await fetchFile(videoFile));

      // Helper: Convert milliseconds to seconds (as a number)
      const msToSeconds = ms => ms / 1000;

      // Helper: Escape special characters for FFmpeg drawtext filter
      const escapeFFmpegText = text => {
        return text
          .replace(/\\/g, "\\\\") // escape backslashes
          .replace(/:/g, "\\:") // escape colons
          .replace(/'/g, "\\'"); // escape single quotes
      };

      // Build drawtext filter chain for each subtitle item.
      const drawtextFilters = subtitles
        .map(sub => {
          const startSec = msToSeconds(sub.start);
          const endSec = msToSeconds(sub.end);
          return `drawtext=fontfile=/tmp/roboto.ttf:text='${escapeFFmpegText(
            sub.text
          )}':fontsize=${fontSize}:fontcolor=${toDrawTextColor(
            primaryColor
          )}:box=1:boxcolor=${toDrawTextColor(
            backgroundColor
          )}@${backgroundOpacity}:boxborderw=${outlineWidth}:x=(w-text_w)/2:y=h-th-${marginV}:enable='between(t,${startSec},${endSec})'`;
        })
        .join(",");

      // Execute FFmpeg command with drawtext filters to burn in the subtitles
      await ffmpeg.exec([
        "-i",
        inputName,
        "-to",
        "00:00:03", // till only 3 seconds
        "-vf",
        drawtextFilters,
        "-preset",
        "ultrafast",
        outputName,
      ]);

      // Read and download the output file
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

  // Apply style preset
  const applyStylePreset = (presetKey: keyof typeof subtitleStyles) => {
    const preset = subtitleStyles[presetKey];
    setSelectedStyle(presetKey);
    setPrimaryColor(preset.primaryColor);
    setOutlineColor(preset.outlineColor);
    setBackgroundColor(preset.backgroundColor);
    setBackgroundOpacity(preset.backgroundOpacity);
    setFontSize(preset.fontSize);
    setMarginV(preset.marginV);
    setOutlineWidth(preset.outlineWidth);
    setBold(preset.bold);
    setItalic(preset.italic);
    setUnderline(preset.underline);
    setStrikeOut(preset.strikeOut);
    setScaleX(preset.scaleX);
    setScaleY(preset.scaleY);
    setSpacing(preset.spacing);
    setAngle(preset.angle);
    setBorderStyle(preset.borderStyle);
    setShadow(preset.shadow);
    setAlignment(preset.alignment);
    setMarginL(preset.marginL);
    setMarginR(preset.marginR);
  };

  const downloadSubtitleOnlyVideo = async () => {
    if (!videoInfo || !subtitles) return;

    try {
      setIsExporting(true);
      setExportProgress(0);

      if (messageRef.current) {
        messageRef.current.textContent = "Creating subtitle video...";
      }

      const subtitleVideoBlob = await createSubtitleOnlyVideo();
      const url = URL.createObjectURL(subtitleVideoBlob);

      setExportProgress(100);

      const a = document.createElement("a");
      a.href = url;
      a.download = "subtitles.webm";
      a.click();
    } catch (error) {
      console.error("Error creating subtitle video:", error);
      if (messageRef.current) {
        messageRef.current.textContent =
          "Error creating subtitle video: " + error?.message;
      }
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="container mx-auto min-h-screen p-4 max-w-[1600px]">
      <div className="grid md:grid-cols-2 lg:grid-cols-[400px,1fr] gap-6 h-[90vh]">
        {/* Left Column - Controls */}
        <div className="flex flex-col gap-4 sticky top-4 overflow-y-auto">
          <div className="flex flex-col gap-4">
            <div className="grid gap-2">
              <label className="text-sm font-medium">Video File</label>
              <input
                type="file"
                accept="video/*"
                onChange={handleFileChange}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              />
            </div>
            <div className="grid gap-2">
              <label className="text-sm font-medium">Subtitle File (SRT)</label>
              <input
                type="file"
                accept=".srt"
                onChange={handleSubtitleChange}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              />
            </div>

            <div className="bg-card p-6 rounded-lg border shadow-sm">
              <h2 className="text-xl font-semibold mb-6">
                Subtitle Style Customization
              </h2>

              {/* Style Preset Selector */}
              <div className="mb-6">
                <label className="text-sm font-medium mb-2 block">
                  Style Preset
                </label>
                <select
                  value={selectedStyle}
                  onChange={e =>
                    applyStylePreset(
                      e.target.value as keyof typeof subtitleStyles
                    )
                  }
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                >
                  <option value="tiktok">TikTok Style</option>
                </select>
              </div>

              {/* Basic Settings */}
              <div className="mb-6">
                <h3 className="text-lg font-medium mb-4">Basic Settings</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Primary Color</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={primaryColor}
                        onChange={e => setPrimaryColor(e.target.value)}
                        className="w-10 h-10 rounded border"
                      />
                      <input
                        type="text"
                        value={primaryColor}
                        onChange={e => setPrimaryColor(e.target.value)}
                        className="flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 w-24"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Outline Color</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={outlineColor}
                        onChange={e => setOutlineColor(e.target.value)}
                        className="w-10 h-10 rounded border"
                      />
                      <input
                        type="text"
                        value={outlineColor}
                        onChange={e => setOutlineColor(e.target.value)}
                        className="flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 w-24"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">
                      Background Color
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={backgroundColor}
                        onChange={e => setBackgroundColor(e.target.value)}
                        className="w-10 h-10 rounded border"
                      />
                      <input
                        type="text"
                        value={backgroundColor}
                        onChange={e => setBackgroundColor(e.target.value)}
                        className="flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 w-24"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">
                      Background Opacity
                    </label>
                    <div className="flex items-center gap-4">
                      <input
                        type="range"
                        value={backgroundOpacity}
                        onChange={e =>
                          setBackgroundOpacity(Number(e.target.value))
                        }
                        min="0"
                        max="1"
                        step="0.1"
                        className="flex-1 h-2 rounded-lg appearance-none cursor-pointer bg-gray-200"
                      />
                      <span className="text-sm font-medium w-12 text-right">
                        {Math.round(backgroundOpacity * 100)}%
                      </span>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Font Size</label>
                    <input
                      type="number"
                      value={fontSize}
                      onChange={e => setFontSize(Number(e.target.value))}
                      min="12"
                      max="72"
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Outline Width</label>
                    <input
                      type="number"
                      value={outlineWidth}
                      onChange={e => setOutlineWidth(Number(e.target.value))}
                      min="0"
                      max="4"
                      step="0.1"
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                    />
                  </div>
                </div>
              </div>

              {/* Advanced Settings - Collapsible */}
              <details className="mb-6 [&_summary::-webkit-details-marker]:hidden">
                <summary className="text-lg font-medium mb-4 cursor-pointer inline-flex items-center hover:text-primary">
                  Advanced Settings
                  <svg
                    className="h-4 w-4 ml-2 transition-transform duration-200"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </summary>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 p-4 bg-card rounded-lg border mt-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">
                      Text Alignment
                    </label>
                    <select
                      value={alignment}
                      onChange={e => setAlignment(Number(e.target.value))}
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                    >
                      <option value="1">Bottom Left</option>
                      <option value="2">Bottom Center</option>
                      <option value="3">Bottom Right</option>
                      <option value="4">Middle Left</option>
                      <option value="5">Middle Center</option>
                      <option value="6">Middle Right</option>
                      <option value="7">Top Left</option>
                      <option value="8">Top Center</option>
                      <option value="9">Top Right</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Border Style</label>
                    <select
                      value={borderStyle}
                      onChange={e => setBorderStyle(Number(e.target.value))}
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                    >
                      <option value="1">Outline</option>
                      <option value="3">Opaque Box</option>
                      <option value="4">Shadow</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">
                      Shadow Distance
                    </label>
                    <div className="flex items-center gap-4">
                      <input
                        type="range"
                        value={shadow}
                        onChange={e => setShadow(Number(e.target.value))}
                        min="0"
                        max="4"
                        step="0.5"
                        className="flex-1 h-2 rounded-lg appearance-none cursor-pointer bg-gray-200"
                      />
                      <input
                        type="number"
                        value={shadow}
                        onChange={e => setShadow(Number(e.target.value))}
                        min="0"
                        max="4"
                        step="0.5"
                        className="flex h-10 w-20 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">
                      Vertical Margin
                    </label>
                    <div className="flex items-center gap-4">
                      <input
                        type="range"
                        value={marginV}
                        onChange={e => setMarginV(Number(e.target.value))}
                        min="0"
                        max="200"
                        className="flex-1 h-2 rounded-lg appearance-none cursor-pointer bg-gray-200"
                      />
                      <input
                        type="number"
                        value={marginV}
                        onChange={e => setMarginV(Number(e.target.value))}
                        min="0"
                        max="200"
                        className="flex h-10 w-20 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      Left Margin
                    </label>
                    <input
                      type="number"
                      value={marginL}
                      onChange={e => setMarginL(Number(e.target.value))}
                      min="0"
                      max="200"
                      className="w-20 px-2 py-1 border rounded"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      Right Margin
                    </label>
                    <input
                      type="number"
                      value={marginR}
                      onChange={e => setMarginR(Number(e.target.value))}
                      min="0"
                      max="200"
                      className="w-20 px-2 py-1 border rounded"
                    />
                  </div>
                </div>
              </details>
            </div>
          </div>
        </div>
        {/* Right Column - Video Player and Preview */}
        <div className="flex flex-col gap-4 h-[50vh]">
          <div className="relative w-full aspect-video bg-black rounded-lg overflow-hidden">
            {videoUrl && (
              <>
                <video
                  ref={videoRef}
                  src={videoUrl}
                  controls={false}
                  className="w-full h-full object-contain"
                />
                <div
                  ref={previewRef}
                  className="absolute left-0 right-0 flex items-center justify-center pointer-events-none"
                  style={{
                    bottom: `${marginV}px`,
                    padding: "4px",
                  }}
                >
                  <div
                    className="subtitle-preview text-center px-4 py-2 rounded"
                    style={{
                      color: primaryColor,
                      fontSize: `${fontSize}px`,
                      fontWeight: bold ? "bold" : "normal",
                      fontStyle: italic ? "italic" : "normal",
                      textDecoration: `${underline ? "underline" : ""} ${
                        strikeOut ? "line-through" : ""
                      }`,
                      letterSpacing: `${spacing}px`,
                      transform: `scale(${scaleX / 100}, ${
                        scaleY / 100
                      }) rotate(${angle}deg)`,
                      ...(borderStyle === 3 && {
                        backgroundColor: `${backgroundColor}${Math.round(
                          backgroundOpacity * 255
                        )
                          .toString(16)
                          .padStart(2, "0")}`,
                        padding: "4px 8px",
                        borderRadius: "4px",
                      }),
                      ...(borderStyle === 1 && {
                        textShadow:
                          outlineWidth > 0
                            ? `
                            -${outlineWidth}px -${outlineWidth}px 0 ${outlineColor},
                            ${outlineWidth}px -${outlineWidth}px 0 ${outlineColor},
                            -${outlineWidth}px ${outlineWidth}px 0 ${outlineColor},
                            ${outlineWidth}px ${outlineWidth}px 0 ${outlineColor}
                          `
                            : "none",
                      }),
                      ...(borderStyle === 4 && {
                        textShadow: `
                          ${outlineWidth}px ${outlineWidth}px ${
                          shadow * 2
                        }px ${outlineColor},
                          ${
                            shadow > 0
                              ? `0 0 ${shadow * 2}px ${backgroundColor}`
                              : ""
                          }
                        `,
                        WebkitTextStroke: `${outlineWidth}px ${outlineColor}`,
                      }),
                      marginLeft: `${marginL}px`,
                      marginRight: `${marginR}px`,
                      marginBottom: `${marginV}px`,
                    }}
                  >
                    {currentSubtitle}
                  </div>
                </div>
              </>
            )}
          </div>
          <p
            ref={messageRef}
            className="text-sm text-gray-600 min-h-[1.5rem]"
          ></p>
          {/* Hidden canvas for rendering subtitles during export */}
          <canvas
            ref={canvasRef}
            style={{ display: "none" }}
            width="1280"
            height="720"
          ></canvas>
          <div className="flex items-center justify-center gap-x-10">
            <Button
              onClick={() => {
                videoRef.current?.play();
              }}
            >
              Play
            </Button>
            <Button
              onClick={() => {
                videoRef.current?.pause();
              }}
            >
              Pause
            </Button>
          </div>

          <div className="space-y-4">
            {/* Export method selector */}
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="useWebCodecs"
                checked={useAssFormat}
                onChange={e => setUseAssFormat(!e.target.checked)}
                className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
              />
              <label htmlFor="useWebCodecs" className="text-sm font-medium">
                Use WebCodecs API (TikTok style)
              </label>
            </div>

            {/* Export buttons with progress */}
            <div className="flex gap-2">
              <button
                onClick={() => {
                  exportVideoWithSubtitles();
                }}
                disabled={
                  !videoFile || !subtitles || !isFFmpegLoaded || isExporting
                }
                className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2 flex-1"
              >
                {!isFFmpegLoaded
                  ? "Loading FFmpeg..."
                  : isExporting
                  ? `Exporting... ${exportProgress}%`
                  : "Export Video with Subtitles"}
              </button>

              <button
                onClick={downloadSubtitleOnlyVideo}
                disabled={!subtitles || !videoInfo || isExporting}
                className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2 flex-1"
              >
                {isExporting
                  ? `Exporting... ${exportProgress}%`
                  : "Download Subtitles Only"}
              </button>
            </div>

            {isExporting && (
              <div className="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700">
                <div
                  className="bg-blue-600 h-2.5 rounded-full transition-all duration-300"
                  style={{ width: `${exportProgress}%` }}
                ></div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Test;
