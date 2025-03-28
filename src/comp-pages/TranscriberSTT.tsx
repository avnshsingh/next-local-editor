"use client";
import { AudioManager } from "@/components/AudioManager";
import Transcript from "@/components/Transcript";
import { useTranscriber } from "@/hooks/useTranscriber";
import { useTheme } from "next-themes";
import { useEffect } from "react";

function TranscriberSTT() {
  const transcriber = useTranscriber();
  const { setTheme } = useTheme();

  useEffect(() => {
    // setTheme("light");
  }, []);
  return (
    <div className="flex justify-center items-center min-h-screen dark:bg-slate-900">
      <div className="container flex flex-col justify-center items-center">
        <h1 className="text-5xl font-extrabold tracking-tight text-slate-900 dark:text-white sm:text-6xl text-center">
          Distil-Whisper Web
        </h1>
        <h2 className="mt-3 mb-5 px-4 text-center text-1xl font-semibold tracking-tight text-slate-900 dark:text-white sm:text-2xl">
          ML-powered speech recognition directly in your browser
        </h2>
        <AudioManager transcriber={transcriber} />
        <Transcript transcribedData={transcriber.output} />
      </div>
    </div>
  );
}

export default TranscriberSTT;
