import { notFound } from "next/navigation";

export default function Home() {
  console.log("home page on server");

  return (
    <div>
      <h1 className="h-[2000px]">Home Page</h1>
    </div>
  );
}
