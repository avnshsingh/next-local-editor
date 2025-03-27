"use client";

import Video from "@/comp-pages/Video";
import NoSSRWrapper from "./NoSSRWrapper";

export default function Page() {
  return (
    <div>
      <NoSSRWrapper>
        {/* <Home /> */}
        {/* <Transcript /> */}
        {/* <ModelManager /> */}
        {/* <h1>Home Page</h1> */}
        <Video />
        {/* <TranscriberSTT /> */}
      </NoSSRWrapper>
    </div>
  );
}
