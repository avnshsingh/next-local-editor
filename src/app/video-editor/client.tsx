"use client";
import NoSSRWrapper from "../NoSSRWrapper";
import Video from "@/comp-pages/Video";

const VideoEditorClient = () => {
  return (
    <div>
      <NoSSRWrapper>
        <Video />
      </NoSSRWrapper>
    </div>
  );
};

export default VideoEditorClient;
