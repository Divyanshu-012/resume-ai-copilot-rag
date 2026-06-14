import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Tell Next.js to NOT bundle these packages with webpack.
  // They rely on Node.js internals (fs, child_process, native bindings)
  // that break inside the webpack bundler. They'll be required at runtime
  // by Node.js directly instead, which is what they expect.
  serverExternalPackages: ["pdf2json", "pdf-parse"],
};

export default nextConfig;
