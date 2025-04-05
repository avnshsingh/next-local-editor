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
  youtube: {
    primaryColor: "#FFFFFF",
    outlineColor: "#000000",
    backgroundColor: "#000000",
    backgroundOpacity: 0.7,
    fontSize: 28,
    marginV: 50,
    outlineWidth: 1.5,
    bold: 1,
    italic: 0,
    underline: 0,
    strikeOut: 0,
    scaleX: 100,
    scaleY: 100,
    spacing: 0,
    angle: 0,
    borderStyle: 1, // outline only
    shadow: 2,
    alignment: 2,
    marginL: 20,
    marginR: 20,
  },
  netflix: {
    primaryColor: "#FFFFFF",
    outlineColor: "#000000",
    backgroundColor: "#000000",
    backgroundOpacity: 0,
    fontSize: 32,
    marginV: 60,
    outlineWidth: 0.5,
    bold: 0,
    italic: 0,
    underline: 0,
    strikeOut: 0,
    scaleX: 100,
    scaleY: 100,
    spacing: 0,
    angle: 0,
    borderStyle: 1,
    shadow: 1,
    alignment: 2,
    marginL: 15,
    marginR: 15,
  },
  modern: {
    primaryColor: "#FFFFFF",
    outlineColor: "#333333",
    backgroundColor: "#000000",
    backgroundOpacity: 0.3,
    fontSize: 40,
    marginV: 80,
    outlineWidth: 0.8,
    bold: 1,
    italic: 0,
    underline: 0,
    strikeOut: 0,
    scaleX: 110,
    scaleY: 110,
    spacing: 1,
    angle: 0,
    borderStyle: 4,
    shadow: 2,
    alignment: 2,
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

      await ffmpeg.writeFile(subtitleFilename, subtitleContent);

      console.log("subtitle in export: ", {
        subtitleFilename,
        subtitleContent,
      });

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
    <div>
      <div className="flex flex-col gap-4">
        <div className="flex gap-4">
          <input type="file" accept="video/*" onChange={handleFileChange} />
          <input type="file" accept=".srt" onChange={handleSubtitleChange} />
        </div>

        <div className="bg-gray-100 p-4 rounded-lg">
          <h2 className="text-lg font-semibold mb-4">
            Subtitle Style Customization
          </h2>

          {/* Style Preset Selector */}
          <div className="mb-4">
            <label className="block text-sm font-medium mb-1">
              Style Preset
            </label>
            <select
              value={selectedStyle}
              onChange={e =>
                applyStylePreset(e.target.value as keyof typeof subtitleStyles)
              }
              className="w-full px-3 py-2 border rounded-md"
            >
              <option value="tiktok">TikTok Style</option>
              <option value="youtube">YouTube Style</option>
              <option value="netflix">Netflix Style</option>
              <option value="modern">Modern Style</option>
            </select>
          </div>

          {/* Basic Settings */}
          <div className="mb-4">
            <h3 className="text-md font-medium mb-2">Basic Settings</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
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
              <div>
                <label className="block text-sm font-medium mb-1">
                  Background Color
                </label>
                <input
                  type="color"
                  value={backgroundColor}
                  onChange={e => setBackgroundColor(e.target.value)}
                  className="w-12 h-12"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">
                  Background Opacity
                </label>
                <input
                  type="range"
                  value={backgroundOpacity}
                  onChange={e => setBackgroundOpacity(Number(e.target.value))}
                  min="0"
                  max="1"
                  step="0.1"
                  className="w-full"
                />
                <span className="text-xs">
                  {Math.round(backgroundOpacity * 100)}%
                </span>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">
                  Font Size
                </label>
                <input
                  type="number"
                  value={fontSize}
                  onChange={e => setFontSize(Number(e.target.value))}
                  min="12"
                  max="72"
                  className="w-20 px-2 py-1 border rounded"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">
                  Outline Width
                </label>
                <input
                  type="number"
                  value={outlineWidth}
                  onChange={e => setOutlineWidth(Number(e.target.value))}
                  min="0"
                  max="4"
                  step="0.1"
                  className="w-20 px-2 py-1 border rounded"
                />
              </div>
            </div>
          </div>

          {/* Advanced Settings - Collapsible */}
          <details className="mb-4">
            <summary className="text-md font-medium mb-2 cursor-pointer">
              Advanced Settings
            </summary>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 p-4 bg-gray-50 rounded">
              <div>
                <label className="block text-sm font-medium mb-1">
                  Text Alignment
                </label>
                <select
                  value={alignment}
                  onChange={e => setAlignment(Number(e.target.value))}
                  className="w-full px-2 py-1 border rounded"
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
              <div>
                <label className="block text-sm font-medium mb-1">
                  Border Style
                </label>
                <select
                  value={borderStyle}
                  onChange={e => setBorderStyle(Number(e.target.value))}
                  className="w-full px-2 py-1 border rounded"
                >
                  <option value="1">Outline</option>
                  <option value="3">Opaque Box</option>
                  <option value="4">Shadow</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">
                  Shadow Distance
                </label>
                <input
                  type="number"
                  value={shadow}
                  onChange={e => setShadow(Number(e.target.value))}
                  min="0"
                  max="4"
                  step="0.5"
                  className="w-20 px-2 py-1 border rounded"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">
                  Vertical Margin
                </label>
                <input
                  type="number"
                  value={marginV}
                  onChange={e => setMarginV(Number(e.target.value))}
                  min="0"
                  max="200"
                  className="w-20 px-2 py-1 border rounded"
                />
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
              <div>
                <label className="block text-sm font-medium mb-1">
                  Text Formatting
                </label>
                <div className="flex gap-2">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={bold === 1}
                      onChange={e => setBold(e.target.checked ? 1 : 0)}
                      className="mr-1"
                    />
                    <span className="text-xs font-bold">B</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={italic === 1}
                      onChange={e => setItalic(e.target.checked ? 1 : 0)}
                      className="mr-1"
                    />
                    <span className="text-xs italic">I</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={underline === 1}
                      onChange={e => setUnderline(e.target.checked ? 1 : 0)}
                      className="mr-1"
                    />
                    <span className="text-xs underline">U</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={strikeOut === 1}
                      onChange={e => setStrikeOut(e.target.checked ? 1 : 0)}
                      className="mr-1"
                    />
                    <span className="text-xs line-through">S</span>
                  </label>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">
                  Scale X (%)
                </label>
                <input
                  type="number"
                  value={scaleX}
                  onChange={e => setScaleX(Number(e.target.value))}
                  min="50"
                  max="200"
                  className="w-20 px-2 py-1 border rounded"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">
                  Scale Y (%)
                </label>
                <input
                  type="number"
                  value={scaleY}
                  onChange={e => setScaleY(Number(e.target.value))}
                  min="50"
                  max="200"
                  className="w-20 px-2 py-1 border rounded"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">
                  Letter Spacing
                </label>
                <input
                  type="number"
                  value={spacing}
                  onChange={e => setSpacing(Number(e.target.value))}
                  min="0"
                  max="10"
                  step="0.5"
                  className="w-20 px-2 py-1 border rounded"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">
                  Rotation Angle
                </label>
                <input
                  type="number"
                  value={angle}
                  onChange={e => setAngle(Number(e.target.value))}
                  min="0"
                  max="360"
                  className="w-20 px-2 py-1 border rounded"
                />
              </div>
            </div>
          </details>
        </div>

        {/* Video Preview with Subtitle Overlay */}
        <div className="relative mt-4">
          <video
            ref={videoRef}
            src={videoUrl || ""}
            controls
            className="w-full"
          />
          <div
            ref={previewRef}
            className="absolute p-4 text-center"
            style={{
              color: primaryColor,
              textShadow:
                borderStyle === 4
                  ? `${outlineWidth}px ${outlineWidth}px ${shadow}px ${outlineColor}`
                  : "none",
              fontSize: `${fontSize}px`,
              fontFamily: '"Roboto Bold", sans-serif',
              fontWeight: bold === 1 ? "bold" : "normal",
              fontStyle: italic === 1 ? "italic" : "normal",
              textDecoration: `${underline === 1 ? "underline" : ""} ${
                strikeOut === 1 ? "line-through" : ""
              }`,
              WebkitTextStroke:
                borderStyle === 1
                  ? `${outlineWidth}px ${outlineColor}`
                  : "none",
              backgroundColor:
                borderStyle === 3
                  ? `${backgroundColor}${Math.round(backgroundOpacity * 255)
                      .toString(16)
                      .padStart(2, "0")}`
                  : "transparent",
              padding: "8px",
              borderRadius: "4px",
              display: "inline-block",
              maxWidth: "80%",
              transform: `translateX(-50%) scale(${scaleX / 100}, ${
                scaleY / 100
              }) rotate(${angle}deg)`,
              letterSpacing: `${spacing}px`,
              // Position based on alignment
              ...(alignment <= 3 ? { bottom: `${marginV}px` } : {}),
              ...(alignment >= 7 ? { top: `${marginV}px` } : {}),
              ...(alignment % 3 === 1
                ? {
                    left: `${marginL}px`,
                    transform: `scale(${scaleX / 100}, ${
                      scaleY / 100
                    }) rotate(${angle}deg)`,
                  }
                : {}),
              ...(alignment % 3 === 0
                ? {
                    right: `${marginR}px`,
                    transform: `scale(${scaleX / 100}, ${
                      scaleY / 100
                    }) rotate(${angle}deg)`,
                  }
                : {}),
              ...(alignment % 3 === 2 ? { left: "50%" } : {}),
              ...(alignment >= 4 && alignment <= 6
                ? {
                    top: "50%",
                    transform: `translate(-50%, -50%) scale(${scaleX / 100}, ${
                      scaleY / 100
                    }) rotate(${angle}deg)`,
                  }
                : {}),
            }}
          >
            {currentSubtitle}
          </div>
        </div>

        <p ref={messageRef} className="text-red-500 mt-2"></p>

        <button
          onClick={exportVideoWithSubtitles}
          disabled={!videoFile || !subtitles}
          className="bg-blue-500 hover:bg-blue-700 text-white py-2 px-4 rounded mt-4 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Export with ASS Subtitles
        </button>
      </div>
    </div>
  );
};

export default Test;
