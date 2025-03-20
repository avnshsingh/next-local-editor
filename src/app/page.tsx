"use client";

import Video from "@/component/Video";
import NoSSRWrapper from "./NoSSRWrapper";
import Transcript from "@/component/Transcript";

export default function Page() {
  return (
    <NoSSRWrapper>
      {/* <Home /> */}
      {/* <Video /> */}
      <Transcript />
    </NoSSRWrapper>
  );
}
