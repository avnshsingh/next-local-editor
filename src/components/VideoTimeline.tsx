import React, { useEffect, useRef, useState } from "react";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { Minus, Plus, SkipBack, SkipForward } from "lucide-react";

interface VideoTimelineProps {
  currentTime: number;
  duration: number;
  onTimeChange: (time: number[]) => void;
  videoRef: React.RefObject<HTMLVideoElement>;
  disabled?: boolean;
}

export function VideoTimeline({
  currentTime,
  duration,
  onTimeChange,
  videoRef,
  disabled = false,
}: VideoTimelineProps) {
  const [zoom, setZoom] = useState(1);
  const [isDragging, setIsDragging] = useState(false);
  const [thumbnails, setThumbnails] = useState<string[]>([]);
  const timelineRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [scrollPosition, setScrollPosition] = useState(0);
  const [visibleTimeRange, setVisibleTimeRange] = useState({
    start: 0,
    end: duration,
  });

  const formatTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
  };

  const handleZoom = (direction: "in" | "out") => {
    const newZoom = direction === "in" ? zoom * 1.5 : zoom / 1.5;
    const clampedZoom = Math.min(Math.max(newZoom, 1), 10);
    setZoom(clampedZoom);

    if (containerRef.current && timelineRef.current) {
      const container = containerRef.current;
      const timeline = timelineRef.current;
      const containerWidth = container.clientWidth;
      const timelineWidth = containerWidth * clampedZoom;
      timeline.style.width = `${timelineWidth}px`;

      // Adjust scroll position to keep current time in view
      const currentTimePosition = (currentTime / duration) * timelineWidth;
      const halfContainer = containerWidth / 2;
      const newScrollPosition = Math.max(
        0,
        currentTimePosition - halfContainer
      );
      container.scrollLeft = newScrollPosition;
      setScrollPosition(newScrollPosition);
    }
  };

  const handleTimelineClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (disabled || !timelineRef.current) return;
    const timeline = timelineRef.current;
    const rect = timeline.getBoundingClientRect();
    const offsetX = e.clientX - rect.left + scrollPosition;
    const newTime = (offsetX / timeline.clientWidth) * duration;
    onTimeChange([Math.max(0, Math.min(newTime, duration))]);
  };
  const handleFrameStep = (direction: "forward" | "backward") => {
    if (!videoRef.current) return;
    const frameTime = 1 / 30; // Assuming 30fps
    const newTime =
      direction === "forward"
        ? Math.min(currentTime + frameTime, duration)
        : Math.max(currentTime - frameTime, 0);
    onTimeChange([newTime]);
  };

  const generateThumbnails = async () => {
    if (!videoRef.current || thumbnails.length > 0) return;
    const video = videoRef.current;
    const thumbnailCount = 10;
    const interval = duration / thumbnailCount;
    const newThumbnails: string[] = [];

    for (let i = 0; i < thumbnailCount; i++) {
      video.currentTime = i * interval;
      await new Promise(resolve =>
        video.addEventListener("seeked", resolve, { once: true })
      );
      const canvas = document.createElement("canvas");
      canvas.width = 160;
      canvas.height = 90;
      const ctx = canvas.getContext("2d");
      ctx?.drawImage(video, 0, 0, canvas.width, canvas.height);
      newThumbnails.push(canvas.toDataURL());
    }

    setThumbnails(newThumbnails);
    video.currentTime = currentTime;
  };

  useEffect(() => {
    if (videoRef.current && duration > 0) {
      generateThumbnails();
    }
  }, [videoRef.current, duration]);

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => handleZoom("out")}
            disabled={disabled || zoom <= 1}
          >
            <Minus className="h-4 w-4" />
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => handleZoom("in")}
            disabled={disabled || zoom >= 10}
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => handleFrameStep("backward")}
            disabled={disabled || currentTime <= 0}
          >
            <SkipBack className="h-4 w-4" />
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => handleFrameStep("forward")}
            disabled={disabled || currentTime >= duration}
          >
            <SkipForward className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div
        ref={containerRef}
        className="relative h-32 bg-muted rounded-md overflow-x-auto"
        style={{ cursor: disabled ? "default" : "pointer" }}
      >
        <div
          ref={timelineRef}
          className="relative h-full"
          style={{
            width: `${100 * zoom}%`,
            minWidth: "100%",
          }}
          onClick={handleTimelineClick}
        >
          <div className="absolute inset-0 flex">
            {thumbnails.map((thumbnail, index) => (
              <div
                key={index}
                className="relative h-full"
                style={{
                  width: `${100 / thumbnails.length}%`,
                }}
              >
                <div className="absolute top-0 left-0 w-full text-center text-xs text-muted-foreground py-1">
                  {formatTime((duration / thumbnails.length) * index)}
                </div>
                <div
                  className="absolute top-6 bottom-0 w-full"
                  style={{
                    backgroundImage: `url(${thumbnail})`,
                    backgroundSize: "cover",
                    backgroundPosition: "center",
                    opacity: disabled ? 0.5 : 1,
                  }}
                />
              </div>
            ))}
          </div>
          <div
            className="absolute top-6 h-[calc(100%-1.5rem)] bg-primary/30 border-l-2 border-r-2 border-primary"
            style={{
              left: `${(currentTime / duration) * 100}%`,
              width: "2px",
              transform: "translateX(-50%)",
            }}
          />
        </div>
      </div>

      <Slider
        value={[currentTime]}
        min={0}
        max={duration}
        step={0.1}
        onValueChange={([value]) => {
          if (!isDragging) setIsDragging(true);
          onTimeChange([value]);
        }}
        onValueCommit={() => {
          setIsDragging(false);
          if (videoRef.current) {
            videoRef.current.currentTime = currentTime;
          }
        }}
        disabled={disabled}
        className="w-full"
      />
      <div className="flex justify-between text-sm text-muted-foreground">
        <span>{formatTime(currentTime)}</span>
        <span>{formatTime(duration)}</span>
      </div>
    </div>
  );
}
