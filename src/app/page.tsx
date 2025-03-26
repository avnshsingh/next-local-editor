"use client";

import Video from "@/comp-pages/Video";
import NoSSRWrapper from "./NoSSRWrapper";
import Transcript from "@/comp-pages/Transcript";
import { Button } from "@/components/ui/button";

import ModelManager from "@/comp-pages/ModelManager";
import TranscriberSTT from "@/comp-pages/TranscriberSTT";

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
