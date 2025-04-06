"use client";
import { FFmpeg } from "@ffmpeg/ffmpeg";
import { fetchFile } from "@ffmpeg/util";
import React, { useEffect, useRef, useState } from "react";
import roboto from "../fonts/Roboto-Regular.ttf";
import robotoBold from "../fonts/Roboto-Bold.ttf";
import { Button } from "@/components/ui/button";
import { DummyAssSubtileKaroke } from "@/lib/DummyData";

function toFFmpegColor(rgb) {
  const bgr = rgb.slice(5, 7) + rgb.slice(3, 5) + rgb.slice(1, 3);
  return "&H" + bgr + "&";
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
  const [videoFile, setVideoFile] = React.useState<File | null>(null);
  const [videoUrl, setVideoUrl] = React.useState<string | null>(null);
  const [subtitles, setSubtitles] = React.useState<Array<{
    start: number;
    end: number;
    text: string;
  }> | null>(null);

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
        subtitleContent += `Dialogue: 0,${formatAssTime(
          sub.start
        )},${formatAssTime(sub.end)},Default,,0,0,0,,${sub.text}\n`;
      });

      console.log("subtitle in export: ", {
        subtitleFilename,
        subtitleContent,
      });
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

          <button
            onClick={exportVideoWithSubtitles}
            disabled={!videoFile || !subtitles || !isFFmpegLoaded}
            className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2"
          >
            {isFFmpegLoaded
              ? "Export Video with Subtitles"
              : "Loading FFmpeg..."}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Test;
