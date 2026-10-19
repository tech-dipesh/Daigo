import type { NextConfig } from "next";
import "@/lib/infra/clients/env"

const nextConfig: NextConfig = {
  /* config options here */
  allowedDevOrigins: ['100.96.0.6']
};

export default nextConfig;
