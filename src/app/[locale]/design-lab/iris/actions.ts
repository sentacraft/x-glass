"use server";

// Server actions for reading and writing iris configs in iris-config.ts.
// The regex patcher relies on numeric fields being plain decimal literals
// (e.g. slotOffset: 0.6283, not Math.PI / 5) and string fields being
// double-quoted literals (e.g. bladeColor: "#181818").

import { writeFile, readFile } from "fs/promises";
import path from "path";
import { IRIS_DEFAULTS, type IrisConfig } from "@/config/iris-config";

const CONFIG_PATH = path.join(process.cwd(), "src/config/iris-config.ts");

/**
 * Read the current values from a named `export const <presetName> = { … }`
 * block in iris-config.ts. Fields not explicitly listed in the block fall back
 * to IRIS_DEFAULTS, matching the behaviour of withIrisDefaults() at runtime.
 * Returns null if the preset cannot be found or parsed.
 */
export async function readFromConfig(
  presetName: "IRIS_HERO" | "IRIS_NAV",
): Promise<IrisConfig | null> {
  try {
    const content = await readFile(CONFIG_PATH, "utf-8");

    // Match up to the first `{` so `withIrisDefaults({` works as well as plain `= {`.
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
    const body = content.slice(bodyStart, bodyEnd - 1);

    // extractNum: reads from the config body; if absent, falls back to IRIS_DEFAULTS.
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
    // extractBool: reads from the config body; falls back to IRIS_DEFAULTS.
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
 * Patch values inside a named `export const <presetName> = { … }` block in
 * iris-config.ts. Supports numeric, string, and boolean field types.
 * Only fields that already exist in the block are updated; missing fields
 * are left unchanged (no insertions).
 */
export async function exportToConfig(
  presetName: "IRIS_HERO" | "IRIS_NAV",
  values: IrisConfig,
): Promise<{ ok: boolean; error?: string }> {
  try {
    let content = await readFile(CONFIG_PATH, "utf-8");

    // Match up to the first `{` so `withIrisDefaults({` works as well as plain `= {`.
    const startPattern = new RegExp(`export const ${presetName}[^{]*\\{`);
    const startMatch = startPattern.exec(content);
    if (!startMatch) return { ok: false, error: `${presetName} not found in iris-config.ts` };

    const bodyStart = startMatch.index + startMatch[0].length;
    let depth = 1;
    let bodyEnd = bodyStart;
    while (bodyEnd < content.length && depth > 0) {
      if (content[bodyEnd] === "{") depth++;
      if (content[bodyEnd] === "}") depth--;
      bodyEnd++;
    }

    let body = content.slice(bodyStart, bodyEnd - 1);

    // Helpers: replace the field if it exists; insert it before the closing brace if not.
    function patchNum(b: string, key: string, val: number): string {
      const next = b.replace(new RegExp(`(\\b${key}:\\s*)[\\d.]+`), `$1${val}`);
      return next !== b ? next : b.trimEnd() + `\n  ${key}: ${val},\n`;
    }
    function patchStr(b: string, key: string, val: string): string {
      const next = b.replace(new RegExp(`(\\b${key}:\\s*)"[^"]*"`), `$1"${val}"`);
      return next !== b ? next : b.trimEnd() + `\n  ${key}: "${val}",\n`;
    }
    function patchBool(b: string, key: string, val: boolean): string {
      const next = b.replace(new RegExp(`(\\b${key}:\\s*)(true|false)`), `$1${val}`);
      return next !== b ? next : b.trimEnd() + `\n  ${key}: ${val},\n`;
    }

    // Patch all fields — insert if absent, replace if present.
    body = patchNum(body, "N",            values.N);
    body = patchNum(body, "pinDistance",  values.pinDistance);
    body = patchNum(body, "slotOffset",   parseFloat(values.slotOffset.toFixed(6)));
    body = patchNum(body, "bladeLength",  values.bladeLength);
    body = patchNum(body, "bladeWidth",   values.bladeWidth);
    body = patchNum(body, "openFStop",    parseFloat(values.openFStop.toFixed(1)));
    body = patchNum(body, "defaultFStop", parseFloat(values.defaultFStop.toFixed(1)));
    body = patchNum(body, "size",         values.size);
    if (values.strokeWidth  !== undefined) body = patchNum (body, "strokeWidth",  parseFloat(values.strokeWidth.toFixed(2)));
    if (values.closedFStop  !== undefined) body = patchNum (body, "closedFStop",  values.closedFStop);
    if (values.hotzoneScale !== undefined) body = patchNum (body, "hotzoneScale", parseFloat(values.hotzoneScale.toFixed(2)));
    if (values.chaseTauMs   !== undefined) body = patchNum (body, "chaseTauMs",   values.chaseTauMs);
    if (values.easeOutMs    !== undefined) body = patchNum (body, "easeOutMs",    values.easeOutMs);
    if (values.catchupMs    !== undefined) body = patchNum (body, "catchupMs",    values.catchupMs);
    if (values.bladeColor   !== undefined) body = patchStr (body, "bladeColor",   values.bladeColor);
    if (values.strokeColor  !== undefined) body = patchStr (body, "strokeColor",  values.strokeColor);
    if (values.interactive  !== undefined) body = patchBool(body, "interactive",  values.interactive);
    if (values.initAnimation !== undefined) body = patchBool(body, "initAnimation", values.initAnimation);

    content = content.slice(0, bodyStart) + body + content.slice(bodyEnd - 1);
    await writeFile(CONFIG_PATH, content, "utf-8");
    return { ok: true };
  } catch (err) {
    return { ok: false, error: String(err) };
  }
}
