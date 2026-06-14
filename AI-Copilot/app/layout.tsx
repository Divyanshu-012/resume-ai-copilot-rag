import type { Metadata } from "next";
import "./globals.css";
import Effects from "./Effects";

export const metadata: Metadata = {
  title: "AI Job Copilot",
  description: "Land your dream job 10x faster with AI",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <Effects />

        <div id="cursor"></div>
        <div id="cursor-ring"></div>
        <canvas id="bg-canvas"></canvas>
        <canvas id="trail-canvas"></canvas>
        <div className="noise"></div>
        <div className="scanline"></div>

        <div className="content">{children}</div>
      </body>
    </html>
  );
}
