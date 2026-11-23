"use client";

import React from "react";
import { useVisualizerStore } from "@/store/useVisualizerStore";
import { DSA_TOPICS } from "@/lib/dsa/core/codeSnippets";
import { SupportedLanguage } from "@/lib/dsa/core/types";

const LANG_LABELS: { id: SupportedLanguage; label: string }[] = [
  { id: "ts", label: "TypeScript" },
  { id: "cpp", label: "C++" },
  { id: "java", label: "Java" },
  { id: "py", label: "Python" },
];

export const CodeAndMemoryPanel: React.FC = () => {
  const { topicId, methodId, language, setLanguage, frames, currentStep } = useVisualizerStore();
  const topic = DSA_TOPICS[topicId];
  const method = topic.methods.find((m) => m.id === methodId) ?? topic.methods[0];
  const frame = frames[currentStep];

  const sourceCode = method.code[language];
  const lines = sourceCode.split("\n");
  const activeLine = frame?.lineByLang[language] ?? 1;
  const formatValue = (value: string | number | boolean | null) => {
    if (value === null) return "null";
    if (typeof value === "boolean") return value ? "true" : "false";
    return String(value);
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="rounded-xl border border-indigo-400/35 bg-[#0b1020] overflow-hidden shadow-[0_12px_32px_rgba(15,23,42,0.22)]">
        <div className="flex items-center justify-between gap-3 border-b border-slate-700/80 bg-[#11182a] px-3 py-2">
          <div className="flex items-center gap-2 min-w-0">
            <div className="flex gap-1.5 shrink-0" aria-hidden="true">
              <span className="h-2.5 w-2.5 rounded-full bg-rose-400" />
              <span className="h-2.5 w-2.5 rounded-full bg-amber-400" />
              <span className="h-2.5 w-2.5 rounded-full bg-emerald-400" />
            </div>
            <span className="truncate rounded-md border border-slate-700/70 bg-slate-950/70 px-2.5 py-1 text-[11px] font-mono font-semibold text-slate-200">
              {method.label}.{language === "ts" ? "ts" : language === "cpp" ? "cpp" : language === "java" ? "java" : "py"}
            </span>
          </div>
          <select
            value={language}
            onChange={(event) => setLanguage(event.target.value as SupportedLanguage)}
            aria-label="Code language"
            className="rounded-md border border-indigo-400/40 bg-indigo-500/15 px-2.5 py-1.5 text-xs font-mono font-bold text-indigo-100 outline-none ring-indigo-400/30 focus:ring-2"
          >
            {LANG_LABELS.map((l) => (
              <option key={l.id} value={l.id} className="bg-slate-900 text-slate-100">
                {l.label}
              </option>
            ))}
          </select>
        </div>

        <div className="min-h-[210px] p-3 font-mono text-xs overflow-x-auto bg-[linear-gradient(90deg,rgba(30,41,59,0.42)_36px,transparent_36px)]">
          {lines.map((lineText, idx) => {
            const lineNum = idx + 1;
            const isCurrent = lineNum === activeLine;
            return (
              <div
                key={lineNum}
                className={`flex min-h-6 items-start rounded-sm ${
                  isCurrent
                    ? "bg-indigo-500/20 border-l-2 border-indigo-400 text-white"
                    : "border-l-2 border-transparent text-slate-300"
                }`}
              >
                <span className="w-9 shrink-0 select-none border-r border-slate-800/70 pr-2 text-right text-slate-600">{lineNum}</span>
                <pre className="whitespace-pre pl-3 pr-2 py-0.5">{lineText || " "}</pre>
              </div>
            );
          })}
        </div>
      </div>

      <div className="rounded-xl border-2 border-sky-400/35 bg-slate-900/80 p-3.5 shadow-[0_10px_28px_rgba(14,165,233,0.08)]">
        <div className="mb-3 flex items-center justify-between gap-3">
          <div className="text-xs font-bold uppercase tracking-[0.14em] text-sky-300">
            Live Memory &amp; Variables
          </div>
          <div className="rounded-md border border-sky-400/30 bg-sky-500/10 px-2 py-1 font-mono text-[10px] font-bold text-sky-200">
            STEP {currentStep + 1}/{Math.max(1, frames.length)}
          </div>
        </div>
        {!frame || Object.keys(frame.variables).length === 0 ? (
          <div className="rounded-lg border border-dashed border-slate-700 bg-slate-950/50 px-3 py-4 text-xs font-mono text-slate-500">
            No active local variables at this step.
          </div>
        ) : (
          <table className="w-full overflow-hidden rounded-lg text-left font-mono text-xs">
            <thead>
              <tr className="border-b border-sky-400/20 bg-sky-950/40 text-sky-300">
                <th className="px-2 py-2 pr-3">Identifier / Pointer</th>
                <th className="px-2 py-2">Current Value</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(frame.variables).map(([key, val]) => (
                <tr key={key} className="border-b border-slate-800/70 bg-slate-950/30">
                  <td className="px-2 py-2 pr-3 text-sky-300">{key}</td>
                  <td className="px-2 py-2 font-bold text-emerald-300">{formatValue(val)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};