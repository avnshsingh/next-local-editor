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
import SubStyle from "@/components/sub-editor/SubStyle";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AspectRatio } from "@/components/ui/aspect-ratio";

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
  const [cropSettings, setCropSettings] = useState({
    aspectRatio: "16:9",
    filter: "crop=ih*16/9:ih",
  });
  const [exportSettings, setExportSettings] = useState({
    resolution: "1080p",
    filter: "scale=1920:1080",
  });

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
          // console.log("on ffmpeg: ", message);
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
Style: Default,Roboto,${fontSize},${toFFmpegColor(
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
      console.warn({ cropSettings, exportSettings });

      const command = [
        "-i",
        inputName,
        "-preset",
        "ultrafast",
        "-to",
        "00:00:03", // till only 3 seconds
        "-vf",
        `${cropSettings.filter},${exportSettings.filter},subtitles=${subtitleFilename}:fontsdir=/tmp`,
        outputName,
      ];
      console.log("command: ", command);
      // Execute the FFmpeg command with the provided optio
      await ffmpeg.exec(command);

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
          <Tabs defaultValue="upload" className="w-full">
            <TabsList>
              <TabsTrigger value="upload">Upload</TabsTrigger>
              <TabsTrigger value="subtitle">Subtitle</TabsTrigger>
              <TabsTrigger value="crop">Crop</TabsTrigger>
              <TabsTrigger value="export">Export</TabsTrigger>
            </TabsList>
            {/* UPLOAD TAB */}
            <TabsContent value="upload">
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
                  <label className="text-sm font-medium">
                    Subtitle File (SRT)
                  </label>
                  <input
                    type="file"
                    accept=".srt"
                    onChange={handleSubtitleChange}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  />
                </div>
              </div>
            </TabsContent>
            <TabsContent value="crop">
              <div className="flex flex-col gap-4">
                <div className="grid gap-2">
                  <label className="text-sm font-medium">
                    Aspect Ratio Presets
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <Button
                      variant="outline"
                      onClick={() => {
                        setCropSettings({
                          aspectRatio: "16:9",
                          filter: "crop=ih*16/9:ih",
                        });
                      }}
                    >
                      Landscape (16:9)
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setCropSettings({
                          aspectRatio: "9:16",
                          filter: "crop=ih*9/16:ih",
                        });
                      }}
                    >
                      Portrait (9:16)
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setCropSettings({
                          aspectRatio: "1:1",
                          filter: "crop=ih:ih",
                        });
                      }}
                    >
                      Square (1:1)
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setCropSettings({
                          aspectRatio: "4:5",
                          filter: "crop=ih*4/5:ih",
                        });
                      }}
                    >
                      Instagram (4:5)
                    </Button>
                  </div>
                </div>
              </div>
            </TabsContent>
            <TabsContent value="export">
              <div className="flex flex-col gap-4">
                <div className="grid gap-2">
                  <label className="text-sm font-medium">
                    Resolution Presets
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <Button
                      variant="outline"
                      onClick={() => {
                        const [width, height] = cropSettings.aspectRatio
                          .split(":")
                          .map(Number);
                        setExportSettings({
                          resolution: "4K",
                          filter: `scale=${
                            Math.round((2160 * width) / height / 2) * 2
                          }:2160`,
                        });
                      }}
                    >
                      4K
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => {
                        const [width, height] = cropSettings.aspectRatio
                          .split(":")
                          .map(Number);
                        setExportSettings({
                          resolution: "2K",
                          filter: `scale=${
                            Math.round((1440 * width) / height / 2) * 2
                          }:1440`,
                        });
                      }}
                    >
                      2K
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => {
                        const [width, height] = cropSettings.aspectRatio
                          .split(":")
                          .map(Number);
                        setExportSettings({
                          resolution: "1080p",
                          filter: `scale=${
                            Math.round((1080 * width) / height / 2) * 2
                          }:1080`,
                        });
                      }}
                    >
                      1080p
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => {
                        const [width, height] = cropSettings.aspectRatio
                          .split(":")
                          .map(Number);
                        setExportSettings({
                          resolution: "720p",
                          filter: `scale=${
                            Math.round((720 * width) / height / 2) * 2
                          }:720`,
                        });
                      }}
                    >
                      720p
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => {
                        const [width, height] = cropSettings.aspectRatio
                          .split(":")
                          .map(Number);
                        setExportSettings({
                          resolution: "480p",
                          filter: `scale=${
                            Math.round((480 * width) / height / 2) * 2
                          }:480`,
                        });
                      }}
                    >
                      480p
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => {
                        const [width, height] = cropSettings.aspectRatio
                          .split(":")
                          .map(Number);
                        setExportSettings({
                          resolution: "360p",
                          filter: `scale=${
                            Math.round((360 * width) / height / 2) * 2
                          }:360`,
                        });
                      }}
                    >
                      360p
                    </Button>
                  </div>
                </div>
              </div>
            </TabsContent>
            {/* SUBTITLE CUSTOMISATION TAB */}
            <TabsContent value="subtitle">
              <SubStyle
                selectedStyle={selectedStyle}
                primaryColor={primaryColor}
                outlineColor={outlineColor}
                backgroundColor={backgroundColor}
                backgroundOpacity={backgroundOpacity}
                fontSize={fontSize}
                marginV={marginV}
                outlineWidth={outlineWidth}
                bold={bold}
                italic={italic}
                underline={underline}
                strikeOut={strikeOut}
                scaleX={scaleX}
                scaleY={scaleY}
                spacing={spacing}
                angle={angle}
                borderStyle={borderStyle}
                shadow={shadow}
                alignment={alignment}
                marginL={marginL}
                marginR={marginR}
                setPrimaryColor={setPrimaryColor}
                setOutlineColor={setOutlineColor}
                setBackgroundColor={setBackgroundColor}
                setBackgroundOpacity={setBackgroundOpacity}
                setFontSize={setFontSize}
                setMarginV={setMarginV}
                setOutlineWidth={setOutlineWidth}
                setBold={setBold}
                setItalic={setItalic}
                setUnderline={setUnderline}
                setStrikeOut={setStrikeOut}
                setScaleX={setScaleX}
                setScaleY={setScaleY}
                setSpacing={setSpacing}
                setAngle={setAngle}
                setBorderStyle={setBorderStyle}
                setShadow={setShadow}
                setAlignment={setAlignment}
                setMarginL={setMarginL}
                setMarginR={setMarginR}
                applyStylePreset={applyStylePreset}
              />
            </TabsContent>
          </Tabs>
        </div>
        {/* Right Column - Video Player and Preview */}
        <div className="flex flex-col gap-4 items-center h-[50vh] md:h-auto">
          <div
            className="relative w-full bg-background rounded-lg overflow-hidden flex items-center justify-center"
            style={{
              minHeight: "510px",
              maxWidth:
                Number(cropSettings?.aspectRatio?.split(":")[0]) === 16
                  ? "1000px"
                  : "310px",
            }}
          >
            {videoUrl && (
              <>
                <AspectRatio
                  ratio={
                    Number(cropSettings.aspectRatio.split(":")[0]) /
                    Number(cropSettings.aspectRatio.split(":")[1])
                  }
                  className="h-auto relative overflow-hidden"
                  style={{ border: `2px solid yellow` }}
                >
                  <video
                    ref={videoRef}
                    src={videoUrl}
                    controls={false}
                    className="w-full h-full object-cover"
                  />
                  <div
                    ref={previewRef}
                    className="absolute left-0 right-0 bottom-0 flex items-center justify-center pointer-events-none z-10"
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
                </AspectRatio>
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
