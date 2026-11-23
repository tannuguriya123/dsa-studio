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

  return (
    <div className="flex flex-col gap-4">
      <div className="rounded-xl border border-slate-800 bg-slate-950 overflow-hidden">
        <div className="flex items-center justify-between px-3 py-2 border-b border-slate-800 bg-slate-900/80">
          <span className="text-xs font-mono text-slate-300 font-semibold">
            {method.label} · {method.timeComplexity}
          </span>
          <div className="flex gap-1">
            {LANG_LABELS.map((l) => (
              <button
                key={l.id}
                onClick={() => setLanguage(l.id)}
                className={`px-2.5 py-1 rounded text-xs font-mono transition ${
                  language === l.id
                    ? "bg-indigo-600 text-white"
                    : "bg-slate-800 text-slate-400 hover:text-slate-200"
                }`}
              >
                {l.label}
              </button>
            ))}
          </div>
        </div>

        <div className="p-3 font-mono text-xs overflow-x-auto">
          {lines.map((lineText, idx) => {
            const lineNum = idx + 1;
            const isCurrent = lineNum === activeLine;
            return (
              <div
                key={lineNum}
                className={`flex items-start px-2 py-0.5 rounded ${
                  isCurrent
                    ? "bg-indigo-500/25 border-l-2 border-indigo-400 text-white"
                    : "text-slate-300"
                }`}
              >
                <span className="w-7 select-none text-slate-500 text-right pr-3">{lineNum}</span>
                <pre className="whitespace-pre">{lineText}</pre>
              </div>
            );
          })}
        </div>
      </div>

      <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-3.5">
        <div className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
          Live Memory & Variable Watch (Step {currentStep + 1}/{Math.max(1, frames.length)})
        </div>
        {!frame || Object.keys(frame.variables).length === 0 ? (
          <div className="text-xs font-mono text-slate-500">No active local variables at this step.</div>
        ) : (
          <table className="w-full text-left font-mono text-xs">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400">
                <th className="py-1.5 pr-3">Identifier / Pointer</th>
                <th className="py-1.5">Current Value</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(frame.variables).map(([key, val]) => (
                <tr key={key} className="border-b border-slate-800/50">
                  <td className="py-1.5 pr-3 text-sky-300">{key}</td>
                  <td className="py-1.5 text-emerald-300">{String(val)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};