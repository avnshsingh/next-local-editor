import { useRef, useState } from "react";
import { FFmpeg } from "@ffmpeg/ffmpeg";
import { fetchFile } from "@ffmpeg/util";
import { Muxer, ArrayBufferTarget } from "webm-muxer";

interface VideoInfo {
  width: number;
  height: number;
  duration: number;
  fps: number;
}

interface SubtitleStyle {
  bold: boolean;
  italic: boolean;
  fontSize: number;
  primaryColor: string;
  outlineColor: string;
  backgroundColor: string;
  backgroundOpacity: number;
  marginV: number;
  outlineWidth: number;
  borderStyle: number;
  shadow: number;
}

// need ffmpeg.current
export const useWebCodecCanvas = (ffmpeg: FFmpeg) => {
  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);
  const messageRef = useRef<HTMLParagraphElement | null>(null);

  const renderSubtitleToCanvas = (
    canvas: HTMLCanvasElement,
    subtitle: any[],
    timestamp: number,
    style: SubtitleStyle
  ) => {
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const currentSub = subtitle
      ? subtitle.find(sub => timestamp >= sub.start && timestamp <= sub.end)
      : null;

    if (!currentSub) return;

    const {
      bold,
      italic,
      fontSize,
      primaryColor,
      outlineColor,
      backgroundColor,
      backgroundOpacity,
      marginV,
      outlineWidth,
      borderStyle,
      shadow,
    } = style;

    ctx.font = `${bold ? "bold" : ""} ${
      italic ? "italic" : ""
    } ${fontSize}px 'Roboto'`;
    ctx.textAlign = "center";
    ctx.textBaseline = "bottom";

    const x = canvas.width / 2;
    const y = canvas.height - marginV;

    if (borderStyle === 3) {
      const metrics = ctx.measureText(currentSub.text);
      const textHeight = fontSize * 1.2;
      const padding = 8;

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

    if (borderStyle === 1 || borderStyle === 4) {
      ctx.strokeStyle = outlineColor;
      ctx.lineWidth = outlineWidth * 2;
      ctx.lineJoin = "round";
      ctx.strokeText(currentSub.text, x, y);

      if (borderStyle === 4 && shadow > 0) {
        ctx.shadowColor = outlineColor;
        ctx.shadowBlur = shadow * 4;
        ctx.shadowOffsetX = outlineWidth;
        ctx.shadowOffsetY = outlineWidth;
      }
    }

    ctx.fillStyle = primaryColor;
    ctx.shadowColor = "transparent";
    ctx.fillText(currentSub.text, x, y);
  };

  const createSubtitleOnlyVideo = async (
    videoInfo: VideoInfo,
    subtitles: any[],
    style: SubtitleStyle
  ) => {
    if (!videoInfo || !subtitles || !subtitles.length) {
      throw new Error("Video info or subtitles not available");
    }

    if (!("VideoEncoder" in window)) {
      throw new Error("WebCodecs API not supported in this browser");
    }

    try {
      const canvas = document.createElement("canvas");
      canvas.width = videoInfo.width;
      canvas.height = videoInfo.height;

      const totalFrames = Math.ceil(videoInfo.duration * videoInfo.fps);
      const frameDuration = 1000 / videoInfo.fps;

      const target = new ArrayBufferTarget();
      const muxer = new Muxer({
        target,
        video: {
          codec: "V_VP9",
          width: canvas.width,
          height: canvas.height,
          frameRate: videoInfo.fps,
          alpha: true,
        },
      });

      const videoEncoder = new VideoEncoder({
        output: (chunk, meta) => muxer.addVideoChunk(chunk, meta),
        error: e => {
          console.error("Encoder error:", e);
        },
      });

      videoEncoder.configure({
        codec: "vp09.00.10.08",
        width: canvas.width,
        height: canvas.height,
        bitrate: 1e6,
      });

      for (let frameIndex = 0; frameIndex < totalFrames; frameIndex++) {
        const timestamp = frameIndex * frameDuration;
        setExportProgress(Math.round((frameIndex / totalFrames) * 50));
        renderSubtitleToCanvas(canvas, subtitles, timestamp, style);

        const frame = new VideoFrame(canvas, {
          timestamp: timestamp * 1000,
          duration: frameDuration * 1000,
        });

        videoEncoder.encode(frame, { keyFrame: frameIndex % 150 === 0 });
        frame.close();

        if (frameIndex % 10 === 0) {
          await new Promise(resolve => setTimeout(resolve, 0));
        }
      }

      await videoEncoder.flush();
      videoEncoder.close();

      muxer.finalize();
      return new Blob([target.buffer], { type: "video/webm" });
    } catch (error) {
      console.error("Error creating subtitle video:", error);
      throw error;
    }
  };
  // Render a subtitle frame to canvas with rounded corner of red background and yellow text
  const renderSubtitleToCanvasWithRounedCorner = (
    canvas,
    subtitles,
    timestamp
  ) => {
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const currentSub = subtitles?.find(
      sub => timestamp >= sub.start && timestamp <= sub.end
    );

    if (!currentSub) return;

    // === Styling ===
    const fontSize = 32;
    const fontFamily = "Roboto";
    const padding = 12;
    const borderRadius = 12;
    const x = canvas.width / 2;
    const y = canvas.height - 80;

    ctx.font = `bold ${fontSize}px ${fontFamily}`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    const text = currentSub.text;
    const metrics = ctx.measureText(text);
    const textWidth = metrics.width;
    const textHeight = fontSize * 1.2;

    // Draw red rounded background
    const boxX = x - textWidth / 2 - padding;
    const boxY = y - textHeight / 2 - padding;
    const boxW = textWidth + padding * 2;
    const boxH = textHeight + padding * 2;

    drawRoundedRect(ctx, boxX, boxY, boxW, boxH, borderRadius, "#FF0000");

    // Draw yellow text
    ctx.fillStyle = "#FFFF00";
    ctx.fillText(text, x, y);
  };

  function drawRoundedRect(ctx, x, y, width, height, radius, fillColor) {
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.arcTo(x + width, y, x + width, y + height, radius);
    ctx.arcTo(x + width, y + height, x, y + height, radius);
    ctx.arcTo(x, y + height, x, y, radius);
    ctx.arcTo(x, y, x + width, y, radius);
    ctx.closePath();
    ctx.fillStyle = fillColor;
    ctx.fill();
  }

  const exportVideoWithSubtitles = async (
    videoFile: File,
    subtitles: any[],
    videoInfo: VideoInfo,
    style: SubtitleStyle
  ) => {
    if (!videoFile || !subtitles || !videoInfo) return;

    try {
      setIsExporting(true);
      setExportProgress(0);

      if (messageRef.current) {
        messageRef.current.textContent = "Creating subtitle overlay...";
      }

      const subtitleVideoBlob = await createSubtitleOnlyVideo(
        videoInfo,
        subtitles,
        style
      );

      if (messageRef.current) {
        messageRef.current.textContent = "Overlaying subtitles on video...";
      }

      const inputName = "input.mp4";
      const subtitleName = "subtitles.webm";
      const outputName = "output.mp4";

      await ffmpeg.writeFile(inputName, await fetchFile(videoFile));
      await ffmpeg.writeFile(subtitleName, await fetchFile(subtitleVideoBlob));

      await ffmpeg.exec([
        "-i",
        inputName,
        "-i",
        subtitleName,
        "-filter_complex",
        "[1:v]colorkey=0x000000:0.1:0.2[ckout];[0:v][ckout]overlay=format=auto",
        "-c:v",
        "libx264",
        "-pix_fmt",
        "yuv420p",
        "-c:a",
        "copy",
        "-to",
        "00:00:05",
        "-preset",
        "ultrafast",
        outputName,
      ]);

      setExportProgress(90);

      const data = await ffmpeg.readFile(outputName);
      const url = URL.createObjectURL(
        new Blob([data.buffer], { type: "video/mp4" })
      );

      setExportProgress(100);
      return url;
    } catch (error) {
      console.error("Error exporting video:", error);
      if (messageRef.current) {
        messageRef.current.textContent =
          "Error exporting video: " + (error as Error).message;
      }
      throw error;
    } finally {
      setIsExporting(false);
    }
  };

  const downloadSubtitleOnlyVideo = async (
    videoInfo: VideoInfo,
    subtitles: any[],
    style: SubtitleStyle
  ) => {
    if (!videoInfo || !subtitles) return;

    try {
      setIsExporting(true);
      setExportProgress(0);

      if (messageRef.current) {
        messageRef.current.textContent = "Creating subtitle video...";
      }

      const subtitleVideoBlob = await createSubtitleOnlyVideo(
        videoInfo,
        subtitles,
        style
      );
      return URL.createObjectURL(subtitleVideoBlob);
    } catch (error) {
      console.error("Error creating subtitle video:", error);
      if (messageRef.current) {
        messageRef.current.textContent =
          "Error creating subtitle video: " + (error as Error).message;
      }
      throw error;
    } finally {
      setIsExporting(false);
    }
  };

  return {
    isExporting,
    exportProgress,
    messageRef,
    exportVideoWithSubtitles,
    downloadSubtitleOnlyVideo,
    renderSubtitleToCanvas,
    renderSubtitleToCanvasWithRounedCorner,
  };
};
