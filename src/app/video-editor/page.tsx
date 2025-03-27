import VideoEditorClient from "./client";

const VideoEditorPage = () => {
  console.log("on server");
  return (
    <div>
      <VideoEditorClient />
    </div>
  );
};

export default VideoEditorPage;
