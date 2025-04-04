import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { FFmpeg } from "@ffmpeg/ffmpeg";
import { fetchFile, toBlobURL } from "@ffmpeg/util";
import { Captions, FileIcon, Film, Loader2 } from "lucide-react";
import { VideoTimeline } from "@/components/VideoTimeline";
import { Command, File, Inbox, Send, Trash2 } from "lucide-react";

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
import { useEffect, useRef, useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import ThemeToggle from "@/components/ThemeToggle";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { useIsMobile } from "@/hooks/use-mobile";
import { DummySubtile } from "@/lib/DummyData";

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
    {
      title: "SubtitleStyle",
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
    {
      text: string;
      timestamp: [number, number | null];
      words?: { text: string; start: number; end: number }[];
    }[]
  >(DummySubtile || []);
  const [subtitleStyle, setSubtitleStyle] = useState({
    fontSize: 18,
    color: "#ffffff",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    position: "bottom",
    fontFamily: "Open Sans",
    fontVariant: "Regular 400",
    strokeWidth: 0,
    strokeColor: "#000000",
    textAlign: "center",
    animation: "none",
    textTransform: "none",
    positionOffset: 0,
    lineHeight: 1.4,
    maxWidth: 100,
    activeWordBackground: false,
    activeWordBackgroundColor: "#0000ff",
    activeWordTextStyle: false,
    activeWordTextColor: "#ffd700",
    activeWordStrokeWidth: 3,
    activeWordStrokeColor: "#ff0000",
  });

  const isMobile = useIsMobile();

  console.log("isMobile", isMobile);
  console.log("subtitles", subtitles);

  // console.log("subtitles", subtitles);

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
    try {
      const file = e.target.files?.[0];
      if (file) {
        setVideoFile(file);
        const url = URL.createObjectURL(file);
        setVideoUrl(url);
        // setSubtitles([]);
      }
    } catch (error) {
      console.error("Error handling file change:", error);
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
            <ThemeToggle />
            <NavUser user={data.user} />
          </SidebarFooter>
        </Sidebar>

        {/* This is the second sidebar */}
        {/* We disable collapsible and let it fill remaining space */}
        {!isMobile && (
          <Sidebar collapsible="none" className="hidden flex-1 md:flex mt-2">
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
        )}
      </Sidebar>
    );
  };

  const Upload = () => {
    return (
      <div>
        <div className="flex flex-col items-center justify-center w-full">
          <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer bg-background hover:bg-accent/50 transition-colors">
            <div className="flex flex-col items-center justify-center pt-5 pb-6">
              <Film size={30} strokeWidth={1.5} className="m-2" />
              <p className="mb-2 text-sm text-muted-foreground">
                <span className="font-semibold">Click to upload</span> or drag
                and drop
              </p>
              <p className="text-xs text-muted-foreground">
                MP4, WEBM or MOV (MAX. 1GB)
              </p>
            </div>
            <Input
              type="file"
              accept="video/*"
              onChange={handleFileChange}
              className="hidden"
              disabled={isProcessing}
            />
          </label>
        </div>
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
        <ThemeToggle />
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

  const SubtitleStyle = () => {
    return (
      <div className="space-y-4 border-t pt-4">
        <div className="flex items-center justify-between">
          <h3 className="font-medium">Subtitle Style</h3>
          <Button
            variant="outline"
            size="sm"
            onClick={() =>
              setSubtitleStyle({
                fontSize: 18,
                color: "#ffffff",
                backgroundColor: "rgba(0, 0, 0, 0.5)",
                position: "bottom",
                fontFamily: "Open Sans",
                fontVariant: "Regular 400",
                strokeWidth: 0,
                strokeColor: "#000000",
                textAlign: "center",
                animation: "none",
                textTransform: "none",
                positionOffset: 0,
                lineHeight: 1.4,
                maxWidth: 100,
                activeWordBackground: false,
                activeWordBackgroundColor: "#0000ff",
                activeWordTextStyle: false,
                activeWordTextColor: "#ffd700",
                activeWordStrokeWidth: 3,
                activeWordStrokeColor: "#ff0000",
              })
            }
          >
            Restore Defaults
          </Button>
        </div>
        <div className="space-y-2">
          <div>
            <Label>Font Family</Label>
            <select
              className="w-full h-10 px-3 rounded-md border bg-background mt-1"
              value={subtitleStyle.fontFamily || "Arial"}
              onChange={e =>
                setSubtitleStyle(prev => ({
                  ...prev,
                  fontFamily: e.target.value,
                }))
              }
            >
              <option value="Arial">Arial</option>
              <option value="Comic Sans MS">Comic Sans MS</option>
              <option value="Impact">Impact</option>
              <option value="Verdana">Verdana</option>
              <option value="Times New Roman">Times New Roman</option>
            </select>
          </div>
          <div>
            <Label>Font Size</Label>
            <Input
              type="number"
              value={subtitleStyle.fontSize}
              onChange={e =>
                setSubtitleStyle(prev => ({
                  ...prev,
                  fontSize: Number(e.target.value),
                }))
              }
              min={12}
              max={72}
              className="mt-1"
            />
          </div>
          <div>
            <Label>Text Color</Label>
            <Input
              type="color"
              value={subtitleStyle.color}
              onChange={e =>
                setSubtitleStyle(prev => ({ ...prev, color: e.target.value }))
              }
              className="h-10 mt-1"
            />
          </div>
          <div>
            <Label>Text Stroke</Label>
            <div className="flex gap-2">
              <Input
                type="number"
                value={subtitleStyle.strokeWidth || 0}
                onChange={e =>
                  setSubtitleStyle(prev => ({
                    ...prev,
                    strokeWidth: Number(e.target.value),
                  }))
                }
                min={0}
                max={10}
                className="mt-1"
                placeholder="Width"
              />
              <Input
                type="color"
                value={subtitleStyle.strokeColor || "#000000"}
                onChange={e =>
                  setSubtitleStyle(prev => ({
                    ...prev,
                    strokeColor: e.target.value,
                  }))
                }
                className="h-10 mt-1 w-20"
              />
            </div>
          </div>
          <div>
            <Label>Background Opacity</Label>
            <Input
              type="range"
              min={0}
              max={100}
              value={Number(subtitleStyle.backgroundColor.slice(14, -1)) * 100}
              onChange={e => {
                const opacity = Number(e.target.value) / 100;
                setSubtitleStyle(prev => ({
                  ...prev,
                  backgroundColor: `rgba(0, 0, 0, ${opacity})`,
                }));
              }}
              className="mt-1"
            />
          </div>
          <div>
            <Label>Text Alignment</Label>
            <div className="grid grid-cols-3 gap-2 mt-1">
              <Button
                variant={
                  subtitleStyle.textAlign === "left" ? "default" : "outline"
                }
                onClick={() =>
                  setSubtitleStyle(prev => ({ ...prev, textAlign: "left" }))
                }
              >
                Left
              </Button>
              <Button
                variant={
                  subtitleStyle.textAlign === "center" ? "default" : "outline"
                }
                onClick={() =>
                  setSubtitleStyle(prev => ({ ...prev, textAlign: "center" }))
                }
              >
                Center
              </Button>
              <Button
                variant={
                  subtitleStyle.textAlign === "right" ? "default" : "outline"
                }
                onClick={() =>
                  setSubtitleStyle(prev => ({ ...prev, textAlign: "right" }))
                }
              >
                Right
              </Button>
            </div>
          </div>
          <div>
            <Label>Animation Effect</Label>
            <select
              className="w-full h-10 px-3 rounded-md border bg-background mt-1"
              value={subtitleStyle.animation || "none"}
              onChange={e =>
                setSubtitleStyle(prev => ({
                  ...prev,
                  animation: e.target.value,
                }))
              }
            >
              <option value="none">None</option>
              <option value="fade">Fade</option>
              <option value="bounce">Bounce</option>
              <option value="slide">Slide</option>
              <option value="pop">Pop</option>
            </select>
          </div>
          <div>
            <Label>Position</Label>
            <div className="grid grid-cols-2 gap-2 mt-1">
              <Button
                variant={
                  subtitleStyle.position === "top" ? "default" : "outline"
                }
                onClick={() =>
                  setSubtitleStyle(prev => ({ ...prev, position: "top" }))
                }
              >
                Top
              </Button>
              <Button
                variant={
                  subtitleStyle.position === "bottom" ? "default" : "outline"
                }
                onClick={() =>
                  setSubtitleStyle(prev => ({ ...prev, position: "bottom" }))
                }
              >
                Bottom
              </Button>
            </div>
          </div>
        </div>
        <div className="space-y-4 border-t pt-4">
          <h4 className="font-medium">Word-Level Customization</h4>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Active Word Background</Label>
              <Switch
                checked={subtitleStyle.activeWordBackground}
                onCheckedChange={checked =>
                  setSubtitleStyle(prev => ({
                    ...prev,
                    activeWordBackground: checked,
                  }))
                }
              />
            </div>
            {subtitleStyle.activeWordBackground && (
              <Input
                type="color"
                value={subtitleStyle.activeWordBackgroundColor}
                onChange={e =>
                  setSubtitleStyle(prev => ({
                    ...prev,
                    activeWordBackgroundColor: e.target.value,
                  }))
                }
                className="h-10 mt-1"
              />
            )}
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Active Word Text Style</Label>
              <Switch
                checked={subtitleStyle.activeWordTextStyle}
                onCheckedChange={checked =>
                  setSubtitleStyle(prev => ({
                    ...prev,
                    activeWordTextStyle: checked,
                  }))
                }
              />
            </div>
            {subtitleStyle.activeWordTextStyle && (
              <div className="space-y-2">
                <Input
                  type="color"
                  value={subtitleStyle.activeWordTextColor}
                  onChange={e =>
                    setSubtitleStyle(prev => ({
                      ...prev,
                      activeWordTextColor: e.target.value,
                    }))
                  }
                  className="h-10"
                />
                <div className="flex gap-2">
                  <Input
                    type="number"
                    value={subtitleStyle.activeWordStrokeWidth}
                    onChange={e =>
                      setSubtitleStyle(prev => ({
                        ...prev,
                        activeWordStrokeWidth: Number(e.target.value),
                      }))
                    }
                    min={0}
                    max={10}
                    placeholder="Stroke Width"
                  />
                  <Input
                    type="color"
                    value={subtitleStyle.activeWordStrokeColor}
                    onChange={e =>
                      setSubtitleStyle(prev => ({
                        ...prev,
                        activeWordStrokeColor: e.target.value,
                      }))
                    }
                    className="h-10 w-20"
                  />
                </div>
              </div>
            )}
          </div>
        </div>
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
            const [seconds, milliseconds] = s.split(",");
            return (
              parseInt(h) * 3600 +
              parseInt(m) * 60 +
              parseFloat(seconds) +
              parseInt(milliseconds || "0") / 1000
            );
          });
          const words = textLines.join("\n").split(" ");
          const wordCount = words.length;
          const duration = end - start;
          const wordDuration = duration / wordCount;

          return {
            text: textLines.join("\n"),
            timestamp: [start, end] as [number, number],
            words: words.map((word, index) => ({
              text: word,
              start: start + index * wordDuration,
              end: start + (index + 1) * wordDuration,
            })),
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
            i === editingSubtitle
              ? {
                  ...sub,
                  text: editingText,
                  words: [
                    {
                      text: editingText,
                      start: sub.timestamp[0],
                      end: sub.timestamp[1] || sub.timestamp[0],
                    },
                  ],
                }
              : sub
          )
        );
        setEditingSubtitle(null);
        setEditingText("");
      }
    };

    return (
      <div className="space-y-4">
        <div className="flex flex-col items-center justify-center w-full">
          <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer bg-background hover:bg-accent/50 transition-colors">
            <div className="flex flex-col items-center justify-center pt-5 pb-6">
              <Captions size={30} strokeWidth={1.5} className="m-2" />
              <p className="mb-2 text-sm text-muted-foreground">
                <span className="font-semibold">Click to upload</span> or drag
                and drop
              </p>
              <p className="text-xs text-muted-foreground">subtile .SRT File</p>
            </div>
            <Input
              type="file"
              accept=".srt"
              onChange={handleSubtitleUpload}
              className="hidden"
            />
          </label>
        </div>
        {/* hidden using css class temporarily, apply flex to make visible */}
        <div className="hidden flex-wrap items-center gap-x-5">
          {subtitles.map((subtitle, index) => (
            <div key={index} className="flex gap-2 flex-wrap">
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
                  className={`cursor-pointer p-2 rounded ${
                    currentTime >= subtitle.timestamp[0] &&
                    currentTime <= subtitle.timestamp[1]!
                      ? "bg-amber-100/50 text-white"
                      : "hover:bg-muted/50"
                  }`}
                  onClick={() => {
                    setEditingSubtitle(index);
                    setEditingText(subtitle.text);
                    if (videoRef.current) {
                      videoRef.current.currentTime = subtitle.timestamp[1]!;
                      setCurrentTime(subtitle.timestamp[1]!);
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
  const SubtitleCompTimeline = () => {
    const [subtitleFile, setSubtitleFile] = useState<File | null>(null);
    const [editingSubtitle, setEditingSubtitle] = useState<number | null>(null);
    const [editingText, setEditingText] = useState<string>("");

    const handleSubtitleEdit = (index: number, newText: string) => {
      setEditingText(newText);
    };

    const finishEditing = () => {
      if (editingSubtitle !== null) {
        setSubtitles(prev =>
          prev.map((sub, i) =>
            i === editingSubtitle
              ? {
                  ...sub,
                  text: editingText,
                  words: [
                    {
                      text: editingText,
                      start: sub.timestamp[0],
                      end: sub.timestamp[1] || sub.timestamp[0],
                    },
                  ],
                }
              : sub
          )
        );
        setEditingSubtitle(null);
        setEditingText("");
      }
    };

    return (
      <div className="space-y-4">
        <div className="flex flex-wrap items-center gap-x-5">
          {subtitles.map((subtitle, index) => (
            <div key={index} className="flex gap-2 flex-wrap">
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
                  className={`cursor-pointer p-2 rounded ${
                    currentTime >= subtitle.timestamp[0] &&
                    currentTime <= subtitle.timestamp[1]!
                      ? "bg-amber-100/50 text-white"
                      : "hover:bg-muted/50"
                  }`}
                  onClick={() => {
                    setEditingSubtitle(index);
                    setEditingText(subtitle.text);
                    if (videoRef.current) {
                      videoRef.current.currentTime = subtitle.timestamp[1]!;
                      setCurrentTime(subtitle.timestamp[1]!);
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
      case "SubtitleStyle":
        return <SubtitleStyle />;
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
        <header className="sticky top-0 flex shrink-0 items-center gap-2 border-b bg-background p-4">
          <SidebarTrigger className="ml-1" /> <h2>Menu Toggle</h2>
          <Separator orientation="vertical" className="mr-2 h-4" />
          {/* <Breadcrumb>
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
                    </Breadcrumb> */}
        </header>
        <div className="flex flex-1 flex-col gap-4 p-4">
          {isMobile && (
            <>
              <h1 className="text-2xl font-medium bg-background text-primary">
                {activeItem.title}
              </h1>
              <Card className="w-full max-w-3xl aspect-video bg-background">
                <SecondarySidebar item={activeItem} />
              </Card>
              <h1 className="text-2xl font-medium bg-background text-primary md:hidden">
                Video Editor
              </h1>
            </>
          )}
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
                        currentTime <= sub.timestamp[1]!
                    );
                    if (currentSubtitle) {
                      e.currentTarget.title = currentSubtitle.text;
                    }
                  }}
                  onLoadedMetadata={handleLoadedMetadata}
                  onPlay={() => setIsPlaying(true)}
                  onPause={() => setIsPlaying(false)}
                />
                <div
                  className={`absolute bottom-0 left-0 right-0 p-4 text-lg font-semibold ${
                    subtitleStyle.animation === "fade"
                      ? "animate-fade-in"
                      : subtitleStyle.animation === "bounce"
                      ? "animate-bounce"
                      : subtitleStyle.animation === "slide"
                      ? "animate-slide-up"
                      : subtitleStyle.animation === "pop"
                      ? "animate-pop"
                      : ""
                  }`}
                  style={{
                    color: subtitleStyle.color,
                    fontSize: `${subtitleStyle.fontSize}px`,
                    backgroundColor: subtitleStyle.backgroundColor,
                    [subtitleStyle.position]: 0,
                    textAlign: subtitleStyle.textAlign,
                    fontFamily: subtitleStyle.fontFamily,
                    WebkitTextStroke: subtitleStyle.strokeWidth
                      ? `${subtitleStyle.strokeWidth}px ${subtitleStyle.strokeColor}`
                      : "none",
                    textStroke: subtitleStyle.strokeWidth
                      ? `${subtitleStyle.strokeWidth}px ${subtitleStyle.strokeColor}`
                      : "none",
                  }}
                >
                  {(() => {
                    const currentSubtitleIndex = subtitles.findIndex(
                      sub =>
                        currentTime >= sub.timestamp[0] &&
                        currentTime <= sub.timestamp[1]!
                    );
                    if (currentSubtitleIndex === -1) return "";

                    const currentSubtitle = subtitles[currentSubtitleIndex];
                    const currentWordIndex =
                      currentSubtitle.words?.findIndex(
                        word =>
                          currentTime >= word.start && currentTime <= word.end
                      ) ?? -1;

                    let wordsToShow = [];

                    // Add current word
                    if (currentWordIndex !== -1 && currentSubtitle.words) {
                      wordsToShow.push(currentSubtitle.words[currentWordIndex]);
                    }

                    // Add next words from current subtitle
                    if (currentWordIndex !== -1 && currentSubtitle.words) {
                      const nextWords = currentSubtitle.words.slice(
                        currentWordIndex + 1
                      );
                      wordsToShow.push(...nextWords);
                    }

                    // Add next words from next subtitle
                    if (currentSubtitleIndex < subtitles.length - 1) {
                      const nextSubtitle = subtitles[currentSubtitleIndex + 1];
                      if (nextSubtitle.words) {
                        const nextWords = nextSubtitle.words.slice(0);
                        wordsToShow.push(...nextWords);
                      }
                    }

                    return wordsToShow.map((word, index) => (
                      <span
                        key={index}
                        style={{
                          opacity:
                            currentTime >= word.start && currentTime <= word.end
                              ? 1
                              : 0.3,
                          transition: "opacity 0.1s ease-in-out",
                          backgroundColor:
                            currentTime >= word.start &&
                            currentTime <= word.end &&
                            subtitleStyle.activeWordBackground
                              ? subtitleStyle.activeWordBackgroundColor
                              : "transparent",
                          color:
                            currentTime >= word.start &&
                            currentTime <= word.end &&
                            subtitleStyle.activeWordTextStyle
                              ? subtitleStyle.activeWordTextColor
                              : subtitleStyle.color,
                        }}
                      >
                        {word.text}{" "}
                      </span>
                    ));
                  })()}
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
          <SubtitleCompTimeline />
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
