"use client";

import { useEffect, useRef } from "react";
import { Play, Pause, Volume2, VolumeX } from "lucide-react";
import { useTheme } from "next-themes";

export default function AudioPlayer(props: {
  audioUrl: string;
  mimeType: string;
}) {
  const audioPlayer = useRef<HTMLAudioElement>(null);
  const audioSource = useRef<HTMLSourceElement>(null);

  // Updates src when url changes
  useEffect(() => {
    if (audioPlayer.current && audioSource.current) {
      audioSource.current.src = props.audioUrl;
      audioPlayer.current.load();
    }
  }, [props.audioUrl]);

  return (
    <div className="flex relative z-10 p-4 w-full">
      <div className="w-full rounded-lg bg-white dark:bg-slate-800 shadow-xl shadow-black/5 ring-1 ring-slate-700/10 dark:ring-slate-700/30 p-2">
        <audio
          ref={audioPlayer}
          controls
          className="w-full h-12 [&::-webkit-media-controls-panel]:bg-slate-50 dark:[&::-webkit-media-controls-panel]:bg-slate-700 [&::-webkit-media-controls-play-button]:text-slate-900 dark:[&::-webkit-media-controls-play-button]:text-white [&::-webkit-media-controls-current-time-display]:text-slate-900 dark:[&::-webkit-media-controls-current-time-display]:text-white [&::-webkit-media-controls-time-remaining-display]:text-slate-900 dark:[&::-webkit-media-controls-time-remaining-display]:text-white [&::-webkit-media-controls-timeline]:bg-slate-200 dark:[&::-webkit-media-controls-timeline]:bg-slate-600 [&::-webkit-media-controls-volume-slider]:bg-slate-200 dark:[&::-webkit-media-controls-volume-slider]:bg-slate-600"
        >
          <source ref={audioSource} type={props.mimeType}></source>
        </audio>
      </div>
    </div>
  );
}
