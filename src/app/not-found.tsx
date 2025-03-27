"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6 text-center">
      <div className="space-y-2">
        <h2 className="text-4xl font-bold tracking-tight">
          404 - Page Not Found
        </h2>
        <p className="text-muted-foreground">
          Oops! The page you're looking for doesn't exist or has been moved.
        </p>
      </div>
      <div className="flex items-center justify-center">
        <Link href="/">
          <Button variant="default" size="lg">
            Return Home
          </Button>
        </Link>
      </div>
    </div>
  );
}
