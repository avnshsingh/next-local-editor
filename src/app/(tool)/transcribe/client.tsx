"use client";
import NoSSRWrapper from "@/app/NoSSRWrapper";
import TranscriberSTT from "@/component/TranscriberSTT";
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
