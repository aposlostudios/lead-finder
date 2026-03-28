import withPWAInit from "next-pwa";

const withPWA = withPWAInit({
  dest: "public",
  disable: process.env.NODE_ENV === "development",
  register: true,
  skipWaiting: true,
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Allow server-side native modules (better-sqlite3)
  serverExternalPackages: ["better-sqlite3"],
};

export default withPWA(nextConfig);
