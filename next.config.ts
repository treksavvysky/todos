import type { NextConfig } from "next";
import path from "node:path";

const nextConfig: NextConfig = {
  serverExternalPackages: ['better-sqlite3', '@plugins/agent-gate', '@plugins/agent-gate-next'],
  // The @plugins/* deps are file: symlinks into ~/plugins (a sibling of
  // ~/lifeops). Turbopack only follows symlinks inside its root, so widen it
  // to the common ancestor.
  turbopack: {
    root: path.join(__dirname, '..', '..'),
  },
};

export default nextConfig;
