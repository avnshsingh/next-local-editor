"use client";
import NoSSRWrapper from "@/app/NoSSRWrapper";
import WorkerTest from "@/comp-pages/WorkerTest";
import React from "react";

const Worker = () => {
  return (
    <div>
      <NoSSRWrapper>
        <WorkerTest />
      </NoSSRWrapper>
    </div>
  );
};

export default Worker;
