"use server";

// Server actions for reading and writing iris configs in iris-config.ts.
// exportToConfig does a full replacement of the preset body — no regex patching.
// The only constraint: numeric fields must be plain decimal literals so that
// readFromConfig can parse them back with a simple regex.

import { writeFile, readFile } from "fs/promises";
import { exec } from "child_process";
import { promisify } from "util";
import path from "path";
import { IRIS_DEFAULTS, type IrisConfig } from "@/config/iris-config";

const execAsync = promisify(exec);

const CONFIG_PATH = path.join(process.cwd(), "src/config/iris-config.ts");

/** Find the body of `withIrisDefaults({ … })` for a named preset. */
function findPresetBody(content: string, presetName: string): { bodyStart: number; bodyEnd: number } | null {
  const startPattern = new RegExp(`export const ${presetName}[^{]*\\{`);
  const startMatch = startPattern.exec(content);
  if (!startMatch) return null;

  const bodyStart = startMatch.index + startMatch[0].length;
  let depth = 1, bodyEnd = bodyStart;
  while (bodyEnd < content.length && depth > 0) {
    if (content[bodyEnd] === "{") depth++;
    if (content[bodyEnd] === "}") depth--;
    bodyEnd++;
  }
  return { bodyStart, bodyEnd: bodyEnd - 1 };
}

/** Serialize an IrisConfig into a tidy object-literal body (indented with 2 spaces). */
function serializeBody(v: IrisConfig): string {
  const lines: string[] = [];
  const add = (key: string, val: string) => lines.push(`  ${key}: ${val},`);

  add("N",            String(v.N));
  add("pinDistance",  String(v.pinDistance));
  add("slotOffset",   v.slotOffset.toFixed(6));
  add("bladeLength",  String(v.bladeLength));
  add("bladeWidth",   String(v.bladeWidth));
  add("openFStop",    v.openFStop.toFixed(1));
  add("defaultFStop", v.defaultFStop.toFixed(1));
  add("size",         String(v.size));
  if (v.strokeWidth  !== undefined) add("strokeWidth",  v.strokeWidth.toFixed(2));
  if (v.closedFStop  !== undefined) add("closedFStop",  String(v.closedFStop));
  if (v.hotzoneScale !== undefined) add("hotzoneScale", v.hotzoneScale.toFixed(2));
  if (v.chaseTauMs   !== undefined) add("chaseTauMs",   String(v.chaseTauMs));
  if (v.easeOutMs    !== undefined) add("easeOutMs",    String(v.easeOutMs));
  if (v.catchupMs    !== undefined) add("catchupMs",    String(v.catchupMs));
  if (v.bladeColor   !== undefined) add("bladeColor",   `"${v.bladeColor}"`);
  if (v.strokeColor  !== undefined) add("strokeColor",  `"${v.strokeColor}"`);
  if (v.interactive  !== undefined) add("interactive",  String(v.interactive));
  if (v.initAnimation !== undefined) add("initAnimation", String(v.initAnimation));

  return "\n" + lines.join("\n") + "\n";
}

/**
 * Read the current values from a named preset in iris-config.ts.
 * Fields absent from the block fall back to IRIS_DEFAULTS.
 * Returns null if the preset cannot be found or parsed.
 */
export async function readFromConfig(
  presetName: "IRIS_HERO" | "IRIS_NAV",
): Promise<IrisConfig | null> {
  try {
    const content = await readFile(CONFIG_PATH, "utf-8");
    const range = findPresetBody(content, presetName);
    if (!range) return null;

    const body = content.slice(range.bodyStart, range.bodyEnd);

    function extractNum(key: string): number | undefined {
      const m = new RegExp(`\\b${key}:\\s*([\\d.]+)`).exec(body);
      if (m) return parseFloat(m[1]);
      const d = IRIS_DEFAULTS[key as keyof typeof IRIS_DEFAULTS];
      return typeof d === "number" ? d : undefined;
    }
    function extractStr(key: string): string | undefined {
      const m = new RegExp(`\\b${key}:\\s*"([^"]*)"`) .exec(body);
      return m ? m[1] : undefined;
    }
    function extractBool(key: string): boolean | undefined {
      const m = new RegExp(`\\b${key}:\\s*(true|false)`).exec(body);
      if (m) return m[1] === "true";
      const d = IRIS_DEFAULTS[key as keyof typeof IRIS_DEFAULTS];
      return typeof d === "boolean" ? d : undefined;
    }

    return {
      N:             Math.round(extractNum("N") ?? 0),
      pinDistance:   extractNum("pinDistance") ?? 0,
      slotOffset:    extractNum("slotOffset")  ?? 0,
      bladeLength:   extractNum("bladeLength") ?? 0,
      bladeWidth:    extractNum("bladeWidth")  ?? 0,
      openFStop:     extractNum("openFStop")   ?? 1.4,
      defaultFStop:  extractNum("defaultFStop") ?? 5.6,
      size:          Math.round(extractNum("size") ?? 0),
      strokeWidth:   extractNum("strokeWidth"),
      bladeColor:    extractStr("bladeColor"),
      strokeColor:   extractStr("strokeColor"),
      interactive:   extractBool("interactive"),
      initAnimation: extractBool("initAnimation"),
      closedFStop:   extractNum("closedFStop"),
      hotzoneScale:  extractNum("hotzoneScale"),
      chaseTauMs:    extractNum("chaseTauMs"),
      easeOutMs:     extractNum("easeOutMs"),
      catchupMs:     extractNum("catchupMs"),
    };
  } catch {
    return null;
  }
}

/**
 * Overwrite the body of a named preset in iris-config.ts with the given values.
 * The entire `{ … }` block is replaced — no field-level patching.
 * Runs tsc --noEmit after writing; restores the original on failure.
 */
export async function exportToConfig(
  presetName: "IRIS_HERO" | "IRIS_NAV",
  values: IrisConfig,
): Promise<{ ok: boolean; error?: string }> {
  try {
    const originalContent = await readFile(CONFIG_PATH, "utf-8");
    const range = findPresetBody(originalContent, presetName);
    if (!range) return { ok: false, error: `${presetName} not found in iris-config.ts` };

    const newContent =
      originalContent.slice(0, range.bodyStart) +
      serializeBody(values) +
      originalContent.slice(range.bodyEnd);

    await writeFile(CONFIG_PATH, newContent, "utf-8");

    // Type-check the written file; restore on failure.
    try {
      await execAsync("npx tsc --noEmit", { cwd: process.cwd() });
    } catch (tscErr: unknown) {
      await writeFile(CONFIG_PATH, originalContent, "utf-8");
      const e = tscErr as { stderr?: string; stdout?: string };
      const output = e.stdout || e.stderr || String(tscErr);
      return { ok: false, error: `TypeScript error after export:\n${output}` };
    }

    return { ok: true };
  } catch (err) {
    return { ok: false, error: String(err) };
  }
}
