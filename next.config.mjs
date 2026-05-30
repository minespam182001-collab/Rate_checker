/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "upload.wikimedia.org" },
      { protocol: "https", hostname: "**.remitly.com" },
      { protocol: "https", hostname: "**.wise.com" },
      { protocol: "https", hostname: "**.westernunion.com" },
      { protocol: "https", hostname: "**.xoom.com" },
      { protocol: "https", hostname: "**.icicibank.com" },
      { protocol: "https", hostname: "www.money2india.com" },
    ],
  },
};

export default nextConfig;
