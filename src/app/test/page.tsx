"use client";
import NoSSRWrapper from "../NoSSRWrapper";
import Test from "@/comp-pages/Test";

const TestPage = () => {
  return (
    <div>
      <NoSSRWrapper>
        <Test />
      </NoSSRWrapper>
    </div>
  );
};

export default TestPage;
