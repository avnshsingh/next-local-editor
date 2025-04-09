import { useState } from "react";

export interface Subtitle {
  start: number;
  end: number;
  text: string;
}

export function useSubtitles() {
  const [subtitles, setSubtitles] = useState<Subtitle[] | null>(null);

  const parseSRT = (content: string) => {
    const subtitles: Subtitle[] = [];
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

  return {
    subtitles,
    setSubtitles,
    handleSubtitleChange,
    parseSRT,
  };
}
