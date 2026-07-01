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

// Only API route handlers are allowed to reference server-only env vars.
// lib/ files are NOT exempt: they can be imported by client components and bundled for the browser.
function isServerFile(filePath: string): boolean {
  return filePath.includes("/api/");
}

describe("server secret isolation", () => {
  const srcDir = join(__dirname);
  const sourceFiles = collectSourceFiles(srcDir);
  const clientFiles = sourceFiles.filter((f) => !isServerFile(f));
  const serverFiles = sourceFiles.filter(isServerFile);

  it("non-api files do not reference server-only env vars", () => {
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

  it("each server-only var is actually used in an api route handler", () => {
    // Guards against the first test vacuously passing because no file references the vars at all.
    const serverContent = serverFiles
      .filter((f) => !f.includes(".test."))
      .map((f) => readFileSync(f, "utf-8"))
      .join("\n");

    for (const varName of SERVER_ONLY_VARS) {
      expect(serverContent).toContain(varName);
    }
  });
});
