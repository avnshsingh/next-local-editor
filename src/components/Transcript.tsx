import { useRef, useEffect } from "react";

import { TranscriberData } from "../hooks/useTranscriber";
import { formatAudioTimestamp } from "@/lib/AudioUtils";

interface Props {
  transcribedData: TranscriberData | undefined;
}

export default function Transcript({ transcribedData }: Props) {
  const divRef = useRef<HTMLDivElement>(null);

  console.log("transcribedData", transcribedData);
  console.log("chunk", transcribedData?.chunks);

  const saveBlob = (blob: Blob, filename: string) => {
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
  };
  const exportTXT = () => {
    let chunks = transcribedData?.chunks ?? [];
    let text = chunks
      .map(chunk => chunk.text)
      .join("")
      .trim();

    const blob = new Blob([text], { type: "text/plain" });
    saveBlob(blob, "transcript.txt");
  };
  const exportJSON = () => {
    let jsonData = JSON.stringify(transcribedData?.chunks ?? [], null, 2);

    // post-process the JSON to make it more readable
    const regex = /(    "timestamp": )\[\s+(\S+)\s+(\S+)\s+\]/gm;
    jsonData = jsonData.replace(regex, "$1[$2 $3]");

    const blob = new Blob([jsonData], { type: "application/json" });
    saveBlob(blob, "transcript.json");
  };
  const exportSRT = () => {
    let chunks = transcribedData?.chunks ?? [];
    let srtContent = chunks
      .map((chunk, index) => {
        const startTime = new Date(chunk.timestamp[0] * 1000)
          .toISOString()
          .slice(11, 23)
          .replace(".", ",");
        const endTimeSeconds = chunk.timestamp[1] ?? chunk.timestamp[0] + 5;
        const endTime = new Date(endTimeSeconds * 1000)
          .toISOString()
          .slice(11, 23)
          .replace(".", ",");
        return `${
          index + 1
        }\n${startTime} --> ${endTime}\n${chunk.text.trim()}\n`;
      })
      .join("\n");

    const blob = new Blob([srtContent], { type: "text/plain" });
    saveBlob(blob, "transcript.srt");
  };

  // Scroll to the bottom when the component updates
  useEffect(() => {
    if (divRef.current) {
      const diff = Math.abs(
        divRef.current.offsetHeight +
          divRef.current.scrollTop -
          divRef.current.scrollHeight
      );

      if (diff <= 64) {
        // We're close enough to the bottom, so scroll to the bottom
        divRef.current.scrollTop = divRef.current.scrollHeight;
      }
    }
  });

  return (
    <div
      ref={divRef}
      className="w-full flex flex-col my-2 p-4 max-h-[20rem] overflow-y-auto dark:bg-gray-900"
    >
      {transcribedData?.chunks &&
        transcribedData.chunks.map((chunk, i) => (
          <div
            key={`${i}-${chunk.text}`}
            className="w-full flex flex-row mb-2 bg-white dark:bg-gray-800 rounded-lg p-4 shadow-xl shadow-black/5 ring-1 ring-slate-700/10 dark:ring-slate-300/10 dark:text-gray-200"
          >
            <div className="mr-5 dark:text-gray-400">
              {formatAudioTimestamp(chunk.timestamp[0])}
            </div>
            {chunk.text}
          </div>
        ))}
      {transcribedData && !transcribedData.isBusy && (
        <div className="w-full text-right">
          <button
            onClick={exportTXT}
            className="text-white bg-green-500 hover:bg-green-600 focus:ring-4 focus:ring-green-300 font-medium rounded-lg text-sm px-4 py-2 text-center mr-2 dark:bg-green-600 dark:hover:bg-green-700 dark:focus:ring-green-800 inline-flex items-center"
          >
            Export TXT
          </button>
          <button
            onClick={exportJSON}
            className="text-white bg-green-500 hover:bg-green-600 focus:ring-4 focus:ring-green-300 font-medium rounded-lg text-sm px-4 py-2 text-center mr-2 dark:bg-green-600 dark:hover:bg-green-700 dark:focus:ring-green-800 inline-flex items-center"
          >
            Export JSON
          </button>
          <button
            onClick={exportSRT}
            className="text-white bg-green-500 hover:bg-green-600 focus:ring-4 focus:ring-green-300 font-medium rounded-lg text-sm px-4 py-2 text-center mr-2 dark:bg-green-600 dark:hover:bg-green-700 dark:focus:ring-green-800 inline-flex items-center"
          >
            Export SRT
          </button>
        </div>
      )}
    </div>
  );
}
