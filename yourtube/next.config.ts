import type { NextConfig } from "next";

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  env:{
    BACKEND_URL : process.env.NEXT_PUBLIC_BACKEND_URL,
  }
};

module.exports = nextConfig;


export default nextConfig;
