import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Node-only libraries used in route handlers; keep them out of the server bundle.
  serverExternalPackages: ["pdfjs-dist", "mammoth", "docx", "firebase-admin", "@react-pdf/renderer"],
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          // Lets the Google sign-in popup talk back to the page without console warnings.
          { key: "Cross-Origin-Opener-Policy", value: "same-origin-allow-popups" },
        ],
      },
    ];
  },
};

export default nextConfig;
