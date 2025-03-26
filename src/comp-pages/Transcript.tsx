"use client";

import { useState } from "react";
import { Pipeline, pipeline } from "@xenova/transformers";
import { ProgressItemTransformer } from "@/lib/types";

export default function TranscriptPage() {
  const [transcript, setTranscript] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);

  const transcribeAudio = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    setLoading(true);
    const file = event.target.files?.[0];
    if (!file) {
      setLoading(false);
      return;
    }

    try {
      // Load the Whisper Tiny pipeline
      const transcriber: Pipeline = await pipeline(
        "automatic-speech-recognition",
        "distil-whisper/distil-small.en",
        {
          quantized: true,
          progress_callback: (progress: ProgressItemTransformer) => {
            console.log("Progress:", progress);
          },
        }
      );

      // Create an AudioContext and decode the audio file
      const audioContext = new AudioContext({ sampleRate: 16000 });

      const audioBuffer = await audioContext.decodeAudioData(
        await file.arrayBuffer()
      );

      // Convert AudioBuffer to Float32Array
      const audioData = audioBuffer.getChannelData(0);

      // Transcribe the audio
      const result = await transcriber(audioData, {
        language: "english", // Optional: specify language
        task: "transcribe", // Default task
        chunk_length_s: 30, // Process in 30-second chunks
        stride_length_s: 5, // Overlap between chunks
        // return_timestamps: "word", // Return word timestamps
        chunk_callback: (chunk: any) => {
          console.log("Chunk transcription:", chunk);
          // You can update the UI here with the partial transcript
        },
        callback_function: (progress: any) => {
          console.log("Transcription progress from callback fn:", progress);
          // You can update the UI here with the overall progress
        },
      });

      // setTranscript(result.text);
      setTranscript(result?.text);

      console.log("Transcription result:", result);
    } catch (error) {
      console.error("Transcription error:", error);
      setTranscript("Error during transcription");
    } finally {
      setLoading(false);
    }
  };

  console.log("Transcript state", transcript);

  return (
    <div>
      <input type="file" accept="audio/*" onChange={transcribeAudio} />
      {loading && <p>Loading...</p>}
      {transcript && <p>Transcript: {transcript}</p>}
    </div>
  );
}
