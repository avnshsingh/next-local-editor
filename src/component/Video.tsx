import { AppSidebar } from "@/components/app-sidebar";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Separator } from "@/components/ui/separator";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { FFmpeg } from "@ffmpeg/ffmpeg";
import { fetchFile, toBlobURL } from "@ffmpeg/util";
import { Loader2 } from "lucide-react";
import { VideoTimeline } from "@/components/VideoTimeline";
import { formatAudioTimestamp } from "@/lib/AudioUtils";
import { ArchiveX, Command, File, Inbox, Send, Trash2 } from "lucide-react";

import { NavUser } from "@/components/nav-user";
import { Label } from "@/components/ui/label";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarInput,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { Switch } from "@/components/ui/switch";
import { useEffect, useRef, useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";

// import React from "../../public/next.svg";

// This is sample data
const data = {
  user: {
    name: "shadcn",
    email: "m@example.com",
    avatar: "",
  },
  navMain: [
    {
      title: "Upload",
      url: "#",
      icon: Inbox,
      isActive: true,
    },
    {
      title: "Player Control",
      url: "#",
      icon: File,
      isActive: false,
    },
    {
      title: "Crop",
      url: "#",
      icon: Send,
      isActive: false,
    },
    {
      title: "Subtitle",
      url: "#",
      icon: Command,
      isActive: false,
    },
  ],
};

export default function Video() {
  const [activeItem, setActiveItem] = useState(data.navMain[0]);
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoUrl, setVideoUrl] = useState<string>("");
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [cropWidth, setCropWidth] = useState(0);
  const [cropHeight, setCropHeight] = useState(0);
  const [cropX, setCropX] = useState(0);
  const [cropY, setCropY] = useState(0);
  const ffmpegRef = useRef(new FFmpeg());
  const [isFFmpegLoaded, setIsFFmpegLoaded] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const messageRef = useRef<HTMLParagraphElement | null>(null);
  const [originalWidth, setOriginalWidth] = useState(0);
  const [originalHeight, setOriginalHeight] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [subtitles, setSubtitles] = useState<
    { text: string; timestamp: [number, number | null] }[]
  >([]);

  console.log("subtitles", subtitles);

  const aspectRatios = [
    { name: "Original", value: originalWidth / originalHeight },
    { name: "1:1", value: 1 },
    { name: "9:16", value: 9 / 16 },
    { name: "16:9", value: 16 / 9 },
    { name: "4:3", value: 4 / 3 },
    { name: "3:4", value: 3 / 4 },
  ];

  const calculateCropDimensions = (aspectRatio: number) => {
    if (!originalWidth || !originalHeight) return;

    const currentRatio = originalWidth / originalHeight;
    let newWidth = originalWidth;
    let newHeight = originalHeight;

    if (aspectRatio > currentRatio) {
      newHeight = originalWidth / aspectRatio;
    } else {
      newWidth = originalHeight * aspectRatio;
    }

    setCropWidth(Math.floor(newWidth));
    setCropHeight(Math.floor(newHeight));
    setCropX(Math.floor((originalWidth - newWidth) / 2));
    setCropY(Math.floor((originalHeight - newHeight) / 2));
  };

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

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setVideoFile(file);
      const url = URL.createObjectURL(file);
      setVideoUrl(url);
      setSubtitles([]);
    }
  };

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      setDuration(videoRef.current.duration);
      const vWidth = videoRef.current.videoWidth;
      const vHeight = videoRef.current.videoHeight;
      setOriginalWidth(vWidth);
      setOriginalHeight(vHeight);
      setCropWidth(vWidth);
      setCropHeight(vHeight);
    }
  };

  const handleSliderChange = (value: number[]) => {
    if (videoRef.current) {
      videoRef.current.currentTime = value[0];
      setCurrentTime(value[0]);
    }
  };

  const SideBarSetup = () => {
    const { setOpen } = useSidebar();

    return (
      <Sidebar
        collapsible="icon"
        className="overflow-hidden *:data-[sidebar=sidebar]:flex-row"
      >
        {/* This is the first sidebar */}
        {/* We disable collapsible and adjust width to icon. */}
        {/* This will make the sidebar appear as icons. */}
        <Sidebar
          collapsible="none"
          className="w-[calc(var(--sidebar-width-icon)+1px)]! border-r"
        >
          <SidebarHeader>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton size="lg" asChild className="md:h-8 md:p-0">
                  <a href="#">
                    <div className="bg-sidebar-primary text-sidebar-primary-foreground flex aspect-square size-8 items-center justify-center rounded-lg">
                      <Command className="size-4" />
                    </div>
                    <div className="grid flex-1 text-left text-sm leading-tight">
                      <span className="truncate font-medium">Local</span>
                      <span className="truncate text-xs">Media</span>
                    </div>
                  </a>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarHeader>
          <SidebarContent>
            <SidebarGroup>
              <SidebarGroupContent className="px-1.5 md:px-0">
                <SidebarMenu>
                  {data.navMain.map(item => (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton
                        tooltip={{
                          children: item.title,
                          hidden: false,
                        }}
                        onClick={() => {
                          setActiveItem(item);
                          setOpen(true);
                        }}
                        isActive={activeItem?.title === item.title}
                        className="px-2.5 md:px-2"
                      >
                        <item.icon />
                        <span>{item.title}</span>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </SidebarContent>
          <SidebarFooter>
            <NavUser user={data.user} />
          </SidebarFooter>
        </Sidebar>

        {/* This is the second sidebar */}
        {/* We disable collapsible and let it fill remaining space */}
        <Sidebar collapsible="none" className="hidden flex-1 md:flex">
          <SidebarHeader className="gap-3.5 border-b p-4">
            <div className="text-foreground text-base font-medium">
              {activeItem?.title}
            </div>
            <SidebarInput placeholder="Type to search..." />
          </SidebarHeader>
          <SidebarContent>
            <SidebarGroup className="px-0">
              <SidebarGroupContent>
                <SecondarySidebar item={activeItem} />
              </SidebarGroupContent>
            </SidebarGroup>
          </SidebarContent>
        </Sidebar>
      </Sidebar>
    );
  };

  const Upload = () => {
    return (
      <div>
        <Input
          type="file"
          accept="video/*"
          onChange={handleFileChange}
          className="cursor-pointer"
          disabled={isProcessing}
        />
      </div>
    );
  };

  const PlayerControl = () => {
    return (
      <div>
        <Button
          onClick={() => videoRef.current?.play()}
          disabled={!videoUrl || isProcessing}
          className="w-full"
        >
          Play
        </Button>
        <Button
          onClick={() => videoRef.current?.pause()}
          disabled={!videoUrl || isProcessing}
          className="w-full"
        >
          Pause
        </Button>
      </div>
    );
  };

  const Crop = () => {
    return !isFFmpegLoaded ? (
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Loader2 className="animate-spin h-4 w-4" />
        Loading FFmpeg...
      </div>
    ) : (
      <div className="space-y-2">
        <div className="space-y-2">
          <Label>Aspect Ratio</Label>
          <div className="grid grid-cols-2 gap-2 mb-2">
            {aspectRatios.map(ratio => (
              <Button
                key={ratio.name}
                variant="outline"
                size="sm"
                onClick={() => calculateCropDimensions(ratio.value)}
                className={ratio.name === "Original" ? "col-span-2" : ""}
              >
                {ratio.name}
              </Button>
            ))}
          </div>
          <div>
            <label className="text-sm">Width:</label>
            <Input
              type="number"
              value={cropWidth}
              onChange={e => setCropWidth(Number(e.target.value))}
              className="mt-1"
            />
          </div>
          <div>
            <label className="text-sm">Height:</label>
            <Input
              type="number"
              value={cropHeight}
              onChange={e => setCropHeight(Number(e.target.value))}
              className="mt-1"
            />
          </div>
          <div>
            <label className="text-sm">X Position:</label>
            <Input
              type="number"
              value={cropX}
              onChange={e => setCropX(Number(e.target.value))}
              className="mt-1"
            />
          </div>
          <div>
            <label className="text-sm">Y Position:</label>
            <Input
              type="number"
              value={cropY}
              onChange={e => setCropY(Number(e.target.value))}
              className="mt-1"
            />
          </div>
        </div>
        <Button
          onClick={async () => {
            if (!videoFile) return;
            setIsProcessing(true);
            try {
              const inputFileName = "input.mp4";
              const outputFileName = "output.mp4";
              const ffmpeg = ffmpegRef.current;
              await ffmpeg.writeFile(inputFileName, await fetchFile(videoFile));
              await ffmpeg.exec([
                "-i",
                inputFileName,
                "-vf",
                `crop=${cropWidth}:${cropHeight}:${cropX}:${cropY}`,
                "-c:v",
                "libx264",
                "-preset",
                "fast",
                "-crf",
                "22",
                outputFileName,
              ]);
              const data = await ffmpeg.readFile(outputFileName);
              const url = URL.createObjectURL(
                new Blob([data], { type: "video/mp4" })
              );
              setVideoUrl(url);
            } catch (error) {
              console.error("Error processing video:", error);
            } finally {
              setIsProcessing(false);
            }
          }}
          disabled={!videoFile || isProcessing}
          className="w-full"
        >
          {isProcessing ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Processing...
            </>
          ) : (
            "Process Video"
          )}
        </Button>
      </div>
    );
  };

  const SubtitleComp = () => {
    const [subtitleFile, setSubtitleFile] = useState<File | null>(null);
    const [editingSubtitle, setEditingSubtitle] = useState<number | null>(null);
    const [editingText, setEditingText] = useState<string>("");

    const handleSubtitleUpload = async (
      e: React.ChangeEvent<HTMLInputElement>
    ) => {
      const file = e.target.files?.[0];
      if (!file) return;
      setSubtitleFile(file);

      const text = await file.text();
      const parsedSubtitles = text
        .split("\n\n")
        .filter(block => block.trim())
        .map(block => {
          const [id, time, ...textLines] = block.split("\n");
          const [start, end] = time.split(" --> ").map(timeStr => {
            const [h, m, s] = timeStr.split(":");
            return parseInt(h) * 3600 + parseInt(m) * 60 + parseFloat(s);
          });
          return {
            text: textLines.join("\n"),
            timestamp: [start, end] as [number, number],
          };
        });
      setSubtitles(parsedSubtitles);
    };

    const handleSubtitleEdit = (index: number, newText: string) => {
      setEditingText(newText);
    };

    const finishEditing = () => {
      if (editingSubtitle !== null) {
        setSubtitles(prev =>
          prev.map((sub, i) =>
            i === editingSubtitle ? { ...sub, text: editingText } : sub
          )
        );
        setEditingSubtitle(null);
        setEditingText("");
      }
    };

    return (
      <div className="space-y-4">
        <Input
          type="file"
          accept=".srt"
          onChange={handleSubtitleUpload}
          className="cursor-pointer"
        />
        <div className="space-y-2">
          {subtitles.map((subtitle, index) => (
            <div key={index} className="flex flex-col items-start gap-2">
              <div className="text-sm text-muted-foreground px-2">
                {formatTime(subtitle.timestamp[0])} →{" "}
                {formatTime(subtitle.timestamp[1])}
              </div>
              {editingSubtitle === index ? (
                <Input
                  value={editingText}
                  onChange={e => handleSubtitleEdit(index, e.target.value)}
                  onKeyDown={e => {
                    if (e.key === "Enter" || e.key === "Escape") {
                      finishEditing();
                    }
                  }}
                  onBlur={finishEditing}
                  autoFocus
                />
              ) : (
                <div
                  className="flex-1 cursor-pointer p-2 hover:bg-muted/50 rounded"
                  onClick={() => {
                    setEditingSubtitle(index);
                    setEditingText(subtitle.text);
                    if (videoRef.current) {
                      videoRef.current.currentTime = subtitle.timestamp[1];
                      setCurrentTime(subtitle.timestamp[1]);
                      isPlaying && videoRef.current.pause();
                    }
                  }}
                >
                  {subtitle.text}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    );
  };

  const SecondarySidebar = ({ item }: { item: any }) => {
    switch (item?.title) {
      case "Upload":
        return <Upload />;
      case "Player Control":
        return <PlayerControl />;
      case "Crop":
        return <Crop />;
      case "Subtitle":
        return <SubtitleComp />;
      default:
        return <Upload />;
    }
  };
  return (
    <SidebarProvider
      style={
        {
          "--sidebar-width": "350px",
        } as React.CSSProperties
      }
    >
      <SideBarSetup />
      <SidebarInset>
        {/* breadcrumb */}
        {/* <header className='sticky top-0 flex shrink-0 items-center gap-2 border-b bg-background p-4'>
                    <SidebarTrigger className='-ml-1' />
                    <Separator orientation='vertical' className='mr-2 h-4' />
                    <Breadcrumb>
                        <BreadcrumbList>
                            <BreadcrumbItem className='hidden md:block'>
                                <BreadcrumbLink href='#'>
                                    All Inboxes
                                </BreadcrumbLink>
                            </BreadcrumbItem>
                            <BreadcrumbSeparator className='hidden md:block' />
                            <BreadcrumbItem>
                                <BreadcrumbPage>Inbox</BreadcrumbPage>
                            </BreadcrumbItem>
                        </BreadcrumbList>
                    </Breadcrumb>
                </header> */}
        <div className="flex flex-1 flex-col gap-4 p-4">
          {/* Video Preview */}
          <Card className="w-full max-w-3xl aspect-video bg-black relative">
            {videoUrl ? (
              <>
                <video
                  ref={videoRef}
                  src={videoUrl}
                  className={`w-full h-full cursor-pointer ${
                    isPlaying ? "playing" : ""
                  }`}
                  onTimeUpdate={e => {
                    handleTimeUpdate();
                    const currentTime = e.currentTarget.currentTime;
                    const currentSubtitle = subtitles.find(
                      sub =>
                        currentTime >= sub.timestamp[0] &&
                        currentTime <= sub.timestamp[1]
                    );
                    if (currentSubtitle) {
                      e.currentTarget.title = currentSubtitle.text;
                    }
                  }}
                  onLoadedMetadata={handleLoadedMetadata}
                  onPlay={() => setIsPlaying(true)}
                  onPause={() => setIsPlaying(false)}
                />
                <div className="absolute bottom-0 left-0 right-0 p-4 text-center text-white text-lg font-semibold bg-black/50">
                  {
                    subtitles.find(
                      sub =>
                        currentTime >= sub.timestamp[0] &&
                        currentTime <= sub.timestamp[1]
                    )?.text
                  }
                </div>
                <div
                  className="absolute border-2 border-white/50"
                  style={{
                    left: `${(cropX / originalWidth) * 100}%`,
                    top: `${(cropY / originalHeight) * 100}%`,
                    width: `${(cropWidth / originalWidth) * 100}%`,
                    height: `${(cropHeight / originalHeight) * 100}%`,
                  }}
                />
              </>
            ) : (
              <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                Upload a video to preview
              </div>
            )}
          </Card>

          {/* Timeline */}
          <div className="p-4 border-t">
            <VideoTimeline
              currentTime={currentTime}
              duration={duration}
              onTimeChange={handleSliderChange}
              // @ts-ignore
              videoRef={videoRef}
              disabled={!videoUrl}
              isPlaying={isPlaying}
            />
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}

const formatTime = (seconds: number): string => {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.floor(seconds % 60);
  return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
};
