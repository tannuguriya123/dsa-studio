import { ExecutionFrame, FrameAction, SupportedLanguage, VisualizerSnapshot } from "./types";

export function deepClone<T>(obj: T): T {
  if (obj === null || typeof obj !== "object") return obj;
  if (Array.isArray(obj)) return obj.map((item) => deepClone(item)) as unknown as T;
  const copy: Record<string, unknown> = {};
  for (const key of Object.keys(obj)) {
    copy[key] = deepClone((obj as Record<string, unknown>)[key]);
  }
  return copy as T;
}

export class TraceRecorder {
  private frames: ExecutionFrame[] = [];
  private activeLineMap: Record<string, Record<SupportedLanguage, number>>;

  constructor(lineMap: Record<string, Record<SupportedLanguage, number>>) {
    this.activeLineMap = lineMap;
  }

  public record(params: {
    tag: string;
    action: FrameAction;
    description: string;
    variables: Record<string, string | number | boolean | null>;
    snapshot: VisualizerSnapshot;
    isError?: boolean;
    isWarning?: boolean;
  }): void {
    const lineByLang = this.activeLineMap[params.tag] ?? { ts: 1, cpp: 1, java: 1, py: 1 };
    this.frames.push({
      step: this.frames.length,
      action: params.action,
      description: params.description,
      lineByLang,
      variables: deepClone(params.variables),
      snapshot: deepClone(params.snapshot),
      isError: params.isError ?? params.action === "ERROR",
      isWarning: params.isWarning ?? params.action === "WARNING",
    });
  }

  public getFrames(): ExecutionFrame[] {
    return this.frames;
  }
}

export function parseNumberList(raw: string | undefined, fallback: number[]): number[] {
  if (!raw || !raw.trim()) return [...fallback];
  const parsed = raw
    .split(/[,\s]+/)
    .map((s) => s.trim())
    .filter(Boolean)
    .map((s) => Number(s));
  if (parsed.some((n) => Number.isNaN(n) || !Number.isFinite(n))) {
    return [...fallback];
  }
  return parsed.slice(0, 24);
}