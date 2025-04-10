"use client";
import { FFmpeg } from "@ffmpeg/ffmpeg";
import { fetchFile } from "@ffmpeg/util";
import React, { useEffect, useRef, useState } from "react";
// @ts-ignore
import roboto from "../fonts/Roboto-Regular.ttf";
// @ts-ignore
import robotoBold from "../fonts/Roboto-Bold.ttf";
import { Button } from "@/components/ui/button";
import { formatAssTime, toFFmpegColor } from "@/lib/VideoPlayerUtils";
import { useSubtitles } from "@/hooks/sub/useSubtitles";
import { useSubtitleStyles } from "@/hooks/sub/useSubtitleStyles";

const Test = () => {
  const ffmpegRef = useRef(new FFmpeg());
  const [isFFmpegLoaded, setIsFFmpegLoaded] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const messageRef = useRef<HTMLParagraphElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [videoFile, setVideoFile] = React.useState<File | null>(null);
  const [videoUrl, setVideoUrl] = React.useState<string | null>(null);
  const [videoInfo, setVideoInfo] = React.useState<{
    width: number;
    height: number;
    duration: number;
    fps: number;
  } | null>(null);

  const [currentSubtitle, setCurrentSubtitle] = useState("");
  const previewRef = useRef<HTMLDivElement>(null);
  const [isWebCodecsSupported, setIsWebCodecsSupported] = useState(false);

  const { handleSubtitleChange, subtitles } = useSubtitles();
  const {
    selectedStyle,
    primaryColor,
    outlineColor,
    backgroundColor,
    backgroundOpacity,
    fontSize,
    marginV,
    outlineWidth,
    bold,
    italic,
    underline,
    strikeOut,
    scaleX,
    scaleY,
    spacing,
    angle,
    borderStyle,
    shadow,
    alignment,
    marginL,
    marginR,
    setPrimaryColor,
    setOutlineColor,
    setBackgroundColor,
    setBackgroundOpacity,
    setFontSize,
    setMarginV,
    setOutlineWidth,
    setBold,
    setItalic,
    setUnderline,
    setStrikeOut,
    setScaleX,
    setScaleY,
    setSpacing,
    setAngle,
    setBorderStyle,
    setShadow,
    setAlignment,
    setMarginL,
    setMarginR,
    applyStylePreset,
  } = useSubtitleStyles();

  // Preset styles
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

  // Load FFmpeg.wasm when the component mounts
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
    if (!("VideoEncoder" in window)) {
      setIsWebCodecsSupported(false);
      // throw new Error("WebCodecs API not supported in this browser");
    } else {
      setIsWebCodecsSupported(true);
    }
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    try {
      const file = e.target.files?.[0];
      setVideoFile(file!);
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

  // Legacy export function using only ffmpeg.wasm with drawtext filters
  const exportVideoWithSubtitles = async () => {
    if (!videoFile || !subtitles) return;

    try {
      const ffmpeg = ffmpegRef.current;
      const inputName = "input.mp4";
      const outputName = "output.mp4";

      // Write video file to FFmpeg's virtual file system
      await ffmpeg.writeFile(inputName, await fetchFile(videoFile));

      // Create subtitles file in ASS format
      let subtitleContent = "";
      const subtitleFilename = "subs.ass";

      // Generate background color with opacity
      const bgColorWithOpacity = `${toFFmpegColor(backgroundColor)}${Math.round(
        backgroundOpacity * 255
      )
        .toString(16)
        .padStart(2, "0")}`;

      // ASS format with all customizable properties
      subtitleContent = `[Script Info]
ScriptType: v4.00+
PlayResX: 384
PlayResY: 288

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: Default,Roboto Bold,${fontSize},${toFFmpegColor(
        primaryColor
      )},&H000000FF,${toFFmpegColor(
        outlineColor
      )},${bgColorWithOpacity},${bold},${italic},${underline},${strikeOut},${scaleX},${scaleY},${spacing},${angle},${borderStyle},${outlineWidth},${shadow},${alignment},${marginL},${marginR},${marginV},0

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
`;

      subtitles.forEach((sub, index) => {
        // Add \k40 before each word
        const karaokeText = sub.text
          .split(/\s+/)
          .map(word => `{\\k35}${word}`)
          .join(" ");

        subtitleContent += `Dialogue: 0,${formatAssTime(
          sub.start
        )},${formatAssTime(sub.end)},Default,,0,0,0,,${karaokeText}\n`;
      });
      // subtitleContent = DummyAssSubtileKaroke;

      console.log("subtitle in export: ", {
        subtitleFilename,
        subtitleContent,
      });
      // return;
      await ffmpeg.writeFile(subtitleFilename, subtitleContent);

      // Use the ASS file directly without force_style since all styles are in the file
      await ffmpeg.exec([
        "-i",
        inputName,
        "-preset",
        "ultrafast",
        "-to",
        "00:00:03", // till only 3 seconds
        "-vf",
        `subtitles=${subtitleFilename}:fontsdir=/tmp`,
        outputName,
      ]);

      // Read and download the result
      const data: any = await ffmpeg.readFile(outputName);
      const url = URL.createObjectURL(
        new Blob([data.buffer], { type: "video/mp4" })
      );

      const a = document.createElement("a");
      a.href = url;
      a.download = "video_with_subtitles.mp4";
      a.click();
    } catch (error: any) {
      console.error("Error exporting video:", error);
      if (messageRef.current) {
        messageRef.current.textContent =
          "Error exporting video: " + error?.message;
      }
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
              <h1>{!isWebCodecsSupported && "Web codec not supported"}</h1>
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
                  // @ts-ignore
                  onChange={e => applyStylePreset(e.target.value)}
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
                    <label className="text-sm font-medium">
                      {borderStyle === 1
                        ? "Outline Color"
                        : "Background Colosr"}
                    </label>
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
                      // @ts-ignore
                      onChange={e => setBorderStyle(Number(e.target.value))}
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                    >
                      <option value="1">Outline</option>
                      <option value="3">Opaque Box</option>
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
                        backgroundColor: `${outlineColor}${Math.round(
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
            {/* Export buttons with progress */}
            <div className="flex gap-2">
              <button
                onClick={() => {
                  exportVideoWithSubtitles();
                }}
                disabled={!videoFile || !subtitles || !isFFmpegLoaded}
                className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2 flex-1"
              >
                {!isFFmpegLoaded
                  ? "Loading FFmpeg..."
                  : "Export Video with Subtitles"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Test;
