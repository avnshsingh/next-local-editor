import { Button } from "@/components/ui/button";
import Link from "next/link";
import React, { useEffect } from "react";

const WorkerTest = () => {
  const [count, setCount] = React.useState(0);

  useEffect(() => {
    // Check if we're in the browser
    if (typeof window !== "undefined") {
      const worker = new Worker(new URL("../test.worker.js", import.meta.url));

      // Send data to the worker
      // worker.postMessage([1, 2, 3, 4, 5]);

      worker.postMessage(10000000000);

      // Listen for messages from the worker
      worker.onmessage = event => {
        setCount(event.data);
      };

      // Clean up the worker on component unmount
      return () => {
        worker.terminate();
      };
    }
  }, []);

  function printHello() {
    console.log("hello");
  }

  console.log("sum is: ", count);

  return (
    <div>
      <h1>Worker Test</h1>
      <h2>{count != 0 ? count : "Loading..."}</h2>
      <Button
        onClick={() => {
          console.log("count", count);
        }}
      >
        Print count
      </Button>
      <Button onClick={printHello}>Print hello</Button>
      <Button>
        <Link href="/">Move to home</Link>
      </Button>
    </div>
  );
};

export default WorkerTest;
