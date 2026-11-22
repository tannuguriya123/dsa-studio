"use client";

import React from "react";
import { Play, Pause, SkipBack, SkipForward, RotateCcw, FlaskConical } from "lucide-react";
import { useVisualizerStore } from "@/store/useVisualizerStore";
import { DSA_TOPICS } from "@/lib/dsa/core/codeSnippets";

export const PlaybackAndSandboxControls: React.FC = () => {
  const {
    topicId,
    methodId,
    setMethod,
    frames,
    currentStep,
    setStep,
    stepForward,
    stepBackward,
    isPlaying,
    togglePlay,
    speedMs,
    setSpeedMs,
    valuesInput,
    targetInput,
    indexInput,
    pointerName,
    bytesInput,
    countInput,
    recursionArg,
    forceWorstCase,
    createCycle,
    updateSandboxField,
    runSimulation,
  } = useVisualizerStore();

  const topic = DSA_TOPICS[topicId];

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-3.5 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setStep(0)}
            className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200"
            title="Reset to Step 1"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
          <button
            onClick={stepBackward}
            disabled={currentStep <= 0}
            className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-200"
            title="Step Backward"
          >
            <SkipBack className="w-4 h-4" />
          </button>
          <button
            onClick={togglePlay}
            className="px-3.5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs flex items-center gap-1.5"
          >
            {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
            {isPlaying ? "Pause" : "Play"}
          </button>
          <button
            onClick={stepForward}
            disabled={currentStep >= frames.length - 1}
            className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-200"
            title="Step Forward"
          >
            <SkipForward className="w-4 h-4" />
          </button>
        </div>

        <div className="flex-1 min-w-[180px] max-w-md flex items-center gap-2">
          <span className="text-xs font-mono text-slate-400">
            {currentStep + 1}/{Math.max(1, frames.length)}
          </span>
          <input
            type="range"
            min={0}
            max={Math.max(0, frames.length - 1)}
            value={currentStep}
            onChange={(e) => setStep(Number(e.target.value))}
            className="w-full accent-indigo-500"
          />
        </div>

        <div className="flex items-center gap-2 text-xs font-mono text-slate-300">
          <span>Delay:</span>
          <select
            value={speedMs}
            onChange={(e) => setSpeedMs(Number(e.target.value))}
            className="bg-slate-800 border border-slate-700 rounded px-2 py-1 text-xs"
          >
            <option value={1200}>0.5x (1200ms)</option>
            <option value={650}>1x (650ms)</option>
            <option value={300}>2x (300ms)</option>
            <option value={120}>4x (120ms)</option>
          </select>
        </div>
      </div>

      <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-4 space-y-3">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-amber-300">
            <FlaskConical className="w-4 h-4" />
            Method & Break/Mutate Sandbox
          </div>
          <div className="flex flex-wrap gap-1.5">
            {topic.methods.map((m) => (
              <button
                key={m.id}
                onClick={() => setMethod(m.id)}
                className={`px-2.5 py-1 rounded text-xs font-mono transition ${
                  methodId === m.id
                    ? "bg-emerald-600 text-white"
                    : "bg-slate-800 text-slate-300 hover:bg-slate-700"
                }`}
              >
                {m.label}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
          {topicId !== "pointers-heap" && topicId !== "recursion" && (
            <label className="flex flex-col gap-1">
              <span className="text-slate-400">Elements (comma separated)</span>
              <input
                value={valuesInput}
                onChange={(e) => updateSandboxField({ valuesInput: e.target.value })}
                className="rounded bg-slate-950 border border-slate-700 px-2.5 py-1.5 font-mono text-slate-100"
              />
            </label>
          )}

          {topicId === "pointers-heap" && (
            <>
              <label className="flex flex-col gap-1">
                <span className="text-slate-400">Pointer Name</span>
                <input
                  value={pointerName}
                  onChange={(e) => updateSandboxField({ pointerName: e.target.value })}
                  className="rounded bg-slate-950 border border-slate-700 px-2.5 py-1.5 font-mono text-slate-100"
                />
              </label>
              <label className="flex flex-col gap-1">
                <span className="text-slate-400">Bytes / Element Size</span>
                <input
                  value={bytesInput}
                  onChange={(e) => updateSandboxField({ bytesInput: e.target.value })}
                  className="rounded bg-slate-950 border border-slate-700 px-2.5 py-1.5 font-mono text-slate-100"
                />
              </label>
              <label className="flex flex-col gap-1">
                <span className="text-slate-400">Element Count</span>
                <input
                  value={countInput}
                  onChange={(e) => updateSandboxField({ countInput: e.target.value })}
                  className="rounded bg-slate-950 border border-slate-700 px-2.5 py-1.5 font-mono text-slate-100"
                />
              </label>
            </>
          )}

          {topicId === "recursion" && (methodId === "factorial" || methodId === "fibonacci") && (
            <label className="flex flex-col gap-1">
              <span className="text-slate-400">Recursion Input (n)</span>
              <input
                value={recursionArg}
                onChange={(e) => updateSandboxField({ recursionArg: e.target.value })}
                className="rounded bg-slate-950 border border-slate-700 px-2.5 py-1.5 font-mono text-slate-100"
              />
            </label>
          )}

          {(topicId === "arrays" || topicId === "linked-list" || topicId === "pointers-heap") && (
            <label className="flex flex-col gap-1">
              <span className="text-slate-400">Index / Offset</span>
              <input
                value={indexInput}
                onChange={(e) => updateSandboxField({ indexInput: e.target.value })}
                className="rounded bg-slate-950 border border-slate-700 px-2.5 py-1.5 font-mono text-slate-100"
              />
            </label>
          )}

          <label className="flex flex-col gap-1">
            <span className="text-slate-400">Target / Value</span>
            <input
              value={targetInput}
              onChange={(e) => updateSandboxField({ targetInput: e.target.value })}
              className="rounded bg-slate-950 border border-slate-700 px-2.5 py-1.5 font-mono text-slate-100"
            />
          </label>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
          <div className="flex flex-wrap items-center gap-4 text-xs text-slate-300">
            {(topicId === "searching-sorting" || topicId === "pointers-heap") && (
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={forceWorstCase}
                  onChange={(e) => updateSandboxField({ forceWorstCase: e.target.checked })}
                  className="rounded accent-rose-500"
                />
                <span>Trigger Worst-Case / Fault Mode</span>
              </label>
            )}
            {topicId === "linked-list" && (
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={createCycle}
                  onChange={(e) => updateSandboxField({ createCycle: e.target.checked })}
                  className="rounded accent-amber-500"
                />
                <span>Inject Cycle (tail → head)</span>
              </label>
            )}
          </div>

          <button
            onClick={runSimulation}
            className="px-4 py-1.5 rounded-lg bg-sky-600 hover:bg-sky-500 text-white text-xs font-semibold"
          >
            Run Trace
          </button>
        </div>
      </div>
    </div>
  );
};