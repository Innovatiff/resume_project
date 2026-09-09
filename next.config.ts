import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Node-only libraries used in route handlers; keep them out of the server bundle.
  serverExternalPackages: ["pdfjs-dist", "mammoth", "docx", "firebase-admin", "@react-pdf/renderer"],
};

export default nextConfig;
