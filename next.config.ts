// @ts-ignore
if (typeof window === "undefined") {
  const mockStorage = {
    getItem: () => null,
    setItem: () => null,
    removeItem: () => null,
    clear: () => null,
    key: () => null,
    length: 0,
  };

  // Suntik paksa ke semua global penampung Node/Bun
  (global as any).localStorage = mockStorage;
  (globalThis as any).localStorage = mockStorage;
}

// Sisa kode bawaan nextConfig Anda di bawah ini:
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
};

export default nextConfig;