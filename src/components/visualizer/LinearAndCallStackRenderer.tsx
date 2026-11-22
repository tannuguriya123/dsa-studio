"use client";

import React from "react";
import { motion } from "motion/react";
import { ExecutionFrame } from "@/lib/dsa/core/types";

export const LinearAndCallStackRenderer: React.FC<{ frame: ExecutionFrame }> = ({ frame }) => {
  const { linkedList, stack, queue, callStack } = frame.snapshot;

  return (
    <div className="space-y-6">
      {linkedList && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Linked List Nodes & Next Pointers
            </span>
            {linkedList.hasCycle && (
              <span className="px-2 py-0.5 rounded bg-amber-500/20 border border-amber-500/50 text-amber-300 text-xs font-mono">
                CYCLE ACTIVE
              </span>
            )}
          </div>
          {linkedList.nodes.length === 0 ? (
            <div className="text-sm font-mono text-slate-500 py-6 text-center border border-dashed border-slate-800 rounded-lg">
              HEAD → NULL (Empty List)
            </div>
          ) : (
            <div className="flex flex-wrap items-center gap-2">
              {linkedList.nodes.map((node, index) => {
                const isCurr = frame.snapshot.pointers?.curr === node.id;
                const isHead = linkedList.headId === node.id;
                return (
                  <React.Fragment key={node.id}>
                    <motion.div
                      layout
                      className={`rounded-lg border px-3 py-2 font-mono text-xs ${
                        isCurr
                          ? "border-sky-400 bg-sky-500/20 text-white"
                          : "border-slate-700 bg-slate-900 text-slate-200"
                      }`}
                    >
                      <div className="flex items-center gap-1.5 text-[10px] text-slate-400">
                        <span>{node.address}</span>
                        {isHead && <span className="text-emerald-400 font-bold">HEAD</span>}
                        {isCurr && <span className="text-sky-300 font-bold">CURR</span>}
                      </div>
                      <div className="text-base font-bold mt-0.5">{node.value}</div>
                      <div className="text-[10px] text-slate-400 mt-1">
                        next: {node.nextId ?? "NULL"}
                      </div>
                    </motion.div>
                    {index < linkedList.nodes.length - 1 && (
                      <span className="text-slate-500 font-mono text-sm">→</span>
                    )}
                  </React.Fragment>
                );
              })}
              <span className="font-mono text-xs text-slate-500 px-1">
                {linkedList.hasCycle ? "↺ Cycle" : "→ NULL"}
              </span>
            </div>
          )}
        </div>
      )}

      {stack && (
        <div>
          <div className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3">
            Stack Frames (Top at Top · LIFO)
          </div>
          <div className="flex flex-col-reverse gap-2 max-w-xs">
            {stack.items.length === 0 ? (
              <div className="text-xs font-mono text-slate-500 p-4 border border-dashed border-slate-800 rounded-lg text-center">
                Stack Empty
              </div>
            ) : (
              stack.items.map((item, i) => {
                const isTop = i === stack.items.length - 1;
                return (
                  <motion.div
                    key={item.id}
                    layout
                    className={`flex items-center justify-between px-3.5 py-2 rounded-lg border font-mono text-xs ${
                      isTop
                        ? "border-indigo-400 bg-indigo-500/20 text-white"
                        : "border-slate-700 bg-slate-900 text-slate-300"
                    }`}
                  >
                    <span>
                      {isTop && <strong className="text-indigo-300 mr-2">[TOP]</strong>}
                      val = <strong>{item.value}</strong>
                    </span>
                    <span className="text-slate-400">{item.address}</span>
                  </motion.div>
                );
              })
            )}
          </div>
        </div>
      )}

      {queue && (
        <div>
          <div className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3">
            Queue (FRONT → ... → REAR · FIFO)
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-mono text-emerald-400 font-semibold">FRONT</span>
            {queue.items.length === 0 ? (
              <div className="text-xs font-mono text-slate-500 px-4 py-2 border border-dashed border-slate-800 rounded-lg">
                Empty Queue
              </div>
            ) : (
              queue.items.map((item, idx) => (
                <motion.div
                  key={item.id}
                  layout
                  className={`px-3.5 py-2 rounded-lg border font-mono text-xs ${
                    idx === 0
                      ? "border-emerald-400 bg-emerald-500/20 text-white"
                      : "border-slate-700 bg-slate-900 text-slate-200"
                  }`}
                >
                  <div className="font-bold text-sm">{item.value}</div>
                  <div className="text-[10px] text-slate-400">{item.address}</div>
                </motion.div>
              ))
            )}
            <span className="text-xs font-mono text-sky-400 font-semibold">REAR</span>
          </div>
        </div>
      )}

      {callStack && (
        <div>
          <div className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3">
            Runtime Recursion Call Stack (Bottom → Top)
          </div>
          {callStack.length === 0 ? (
            <div className="text-xs font-mono text-slate-500 p-4 border border-dashed border-slate-800 rounded-lg text-center">
              Call Stack Empty
            </div>
          ) : (
            <div className="flex flex-col-reverse gap-2 max-w-md">
              {callStack.map((cf) => (
                <div
                  key={cf.id}
                  className={`rounded-lg border px-3.5 py-2 font-mono text-xs ${
                    cf.status === "active"
                      ? "border-sky-400 bg-sky-500/20 text-white"
                      : cf.status === "returning"
                      ? "border-emerald-400 bg-emerald-500/20 text-emerald-100"
                      : "border-slate-700 bg-slate-900 text-slate-400"
                  }`}
                >
                  <div className="flex justify-between">
                    <span className="font-bold">
                      {cf.fnName}({Object.entries(cf.args).map(([k, v]) => `${k}=${v}`).join(", ")})
                    </span>
                    <span className="uppercase text-[10px]">{cf.status}</span>
                  </div>
                  {cf.returnValue !== undefined && (
                    <div className="text-[11px] text-emerald-300 mt-1">returns: {String(cf.returnValue)}</div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};