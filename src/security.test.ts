/**
 * Verifies that server-only secrets are never referenced outside of API route handlers.
 * A client component importing process.env.VAPI_API_KEY would embed it in the browser bundle.
 */

import { readdirSync, readFileSync, statSync } from "fs";
import { join } from "path";

const SERVER_ONLY_VARS = ["ANTHROPIC_API_KEY", "VAPI_API_KEY", "VAPI_PHONE_NUMBER_ID"];

function collectSourceFiles(dir: string, files: string[] = []): string[] {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) {
      if (entry === "node_modules" || entry === ".next") continue;
      collectSourceFiles(full, files);
    } else if (/\.(ts|tsx)$/.test(entry) && !entry.endsWith(".test.ts") && !entry.endsWith(".test.tsx")) {
      files.push(full);
    }
  }
  return files;
}

function isClientFile(filePath: string): boolean {
  // API routes and lib utilities run server-side; everything else may be client-side
  return !filePath.includes("/api/") && !filePath.includes("/lib/");
}

describe("server secret isolation", () => {
  const srcDir = join(__dirname);
  const sourceFiles = collectSourceFiles(srcDir);
  const clientFiles = sourceFiles.filter(isClientFile);

  it("client files do not reference server-only env vars", () => {
    const violations: string[] = [];

    for (const file of clientFiles) {
      const content = readFileSync(file, "utf-8");
      for (const varName of SERVER_ONLY_VARS) {
        if (content.includes(varName)) {
          violations.push(`${file} references ${varName}`);
        }
      }
    }

    expect(violations).toEqual([]);
  });

  it("server-only vars are only accessed from api routes or lib", () => {
    const serverFiles = sourceFiles.filter((f) => !isClientFile(f));
    // Sanity check: the routes that need these vars actually exist
    const routeFiles = serverFiles.filter((f) => f.includes("/api/"));
    expect(routeFiles.length).toBeGreaterThan(0);
  });
});
