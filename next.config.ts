import type { NextConfig } from "next";
import createNextIntlPlugin from 'next-intl/plugin';
import "@/lib/infra/clients/env"

const nextConfig: NextConfig = {
  /* config options here */
  allowedDevOrigins: ['100.96.0.6']
};

const withNextIntl = createNextIntlPlugin();
export default withNextIntl(nextConfig);