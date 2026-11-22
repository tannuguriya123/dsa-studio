"use client";

import React from "react";
import { motion } from "motion/react";
import { ExecutionFrame } from "@/lib/dsa/core/types";

export const HeapAndArrayRenderer: React.FC<{ frame: ExecutionFrame }> = ({ frame }) => {
  const { array, heapBlocks, highlightedIndices = [], swappedIndices = [], foundIndex, rangeBounds, pointers } =
    frame.snapshot;

  return (
    <div className="space-y-6">
      {heapBlocks && heapBlocks.length > 0 && (
        <div>
          <div className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3">
            Simulated Heap Memory Blocks
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {heapBlocks.map((blk) => {
              const statusStyle =
                blk.status === "allocated"
                  ? "border-emerald-500/50 bg-emerald-950/20"
                  : blk.status === "dangling"
                  ? "border-amber-500/50 bg-amber-950/20"
                  : "border-rose-500/50 bg-rose-950/20 opacity-80";

              return (
                <div key={`${blk.address}-${blk.status}`} className={`rounded-lg border p-3 ${statusStyle}`}>
                  <div className="flex items-center justify-between text-xs mb-2">
                    <span className="font-mono font-bold text-slate-100">
                      ptr &quot;{blk.pointerName}&quot; → {blk.address}
                    </span>
                    <span className="px-2 py-0.5 rounded bg-slate-800 text-[11px] font-mono uppercase">
                      {blk.origin} · {blk.status}
                    </span>
                  </div>
                  <div className="flex gap-1.5 flex-wrap">
                    {blk.values.map((v, idx) => (
                      <div
                        key={idx}
                        className={`min-w-[46px] px-2 py-1.5 rounded border text-center font-mono text-xs ${
                          highlightedIndices.includes(idx)
                            ? "border-sky-400 bg-sky-500/25 text-white"
                            : "border-slate-700 bg-slate-900 text-slate-300"
                        }`}
                      >
                        <div className="text-[10px] text-slate-500">[{idx}]</div>
                        <div>{v === null ? (blk.status === "freed" ? "FREE" : "??") : v}</div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {array && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Contiguous Array Elements ({array.length})
            </span>
            {rangeBounds && (
              <span className="text-xs font-mono text-sky-300">
                {rangeBounds.low !== undefined && `low=${rangeBounds.low} `}
                {rangeBounds.mid !== undefined && `mid=${rangeBounds.mid} `}
                {rangeBounds.high !== undefined && `high=${rangeBounds.high} `}
                {rangeBounds.pivot !== undefined && `pivotIdx=${rangeBounds.pivot}`}
              </span>
            )}
          </div>

          <div className="flex flex-wrap items-end gap-2.5 pt-6 pb-2">
            {array.map((val, idx) => {
              const isSwapped = swappedIndices.includes(idx);
              const isHighlighted = highlightedIndices.includes(idx);
              const isFound = foundIndex === idx;

              let cardClasses = "border-slate-700 bg-slate-900 text-slate-100";
              if (isFound) cardClasses = "border-emerald-400 bg-emerald-500/25 text-emerald-200";
              else if (isSwapped) cardClasses = "border-amber-400 bg-amber-500/25 text-amber-100";
              else if (isHighlighted) cardClasses = "border-sky-400 bg-sky-500/25 text-sky-100";

              const activePointerNames = Object.entries(pointers ?? {})
                .filter(([, v]) => v === idx)
                .map(([k]) => k);

              return (
                <motion.div
                  key={`${idx}-${val}`}
                  layout
                  transition={{ type: "spring", stiffness: 320, damping: 26 }}
                  className="relative flex flex-col items-center"
                >
                  {activePointerNames.length > 0 && (
                    <span className="absolute -top-6 px-1.5 py-0.5 rounded bg-indigo-600 text-[10px] font-mono text-white whitespace-nowrap">
                      {activePointerNames.join(", ")}
                    </span>
                  )}
                  <div
                    className={`w-14 h-14 rounded-lg border-2 flex items-center justify-center font-mono font-bold text-sm transition-colors ${cardClasses}`}
                  >
                    {val}
                  </div>
                  <span className="mt-1 text-[11px] font-mono text-slate-400">[{idx}]</span>
                </motion.div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};