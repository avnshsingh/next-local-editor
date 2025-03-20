"use client";

import Video from "@/component/Video";
import NoSSRWrapper from "./NoSSRWrapper";
import Transcript from "@/component/Transcript";
import { Button } from "@/components/ui/button";

import ModelManager from "@/component/ModelManager";

export default function Page() {
  return (
    <div>
      {" "}
      <NoSSRWrapper>
        {/* <Home /> */}
        {/* <Transcript /> */}
        {/* <ModelManager /> */}
        <Video />
      </NoSSRWrapper>
    </div>
  );
}
