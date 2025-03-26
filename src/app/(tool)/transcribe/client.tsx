"use client";
import NoSSRWrapper from "@/app/NoSSRWrapper";
import TranscriberSTT from "@/comp-pages/TranscriberSTT";
import React from "react";

const TranscriberClient = () => {
  return (
    <div>
      <NoSSRWrapper>
        <TranscriberSTT />
      </NoSSRWrapper>
    </div>
  );
};

export default TranscriberClient;
