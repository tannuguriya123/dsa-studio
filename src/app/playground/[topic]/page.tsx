// src/app/playground/[topic]/page.tsx
"use client";

import React, { Suspense, useEffect } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, AlertTriangle, CheckCircle2, Info } from "lucide-react";
import { useVisualizerStore } from "@/store/useVisualizerStore";
import { DSA_TOPICS } from "@/lib/dsa/core/codeSnippets";
import { TopicId } from "@/lib/dsa/core/types";
import { VisualizerCanvas } from "@/components/visualizer/VisualizerCanvas";
import { CodeAndMemoryPanel } from "@/components/code-panel/CodeAndMemoryPanel";
import { PlaybackAndSandboxControls } from "@/components/controls/PlaybackAndSandboxControls";

function PlaygroundContent() {
  const params = useParams<{ topic: string }>();
  const rawTopic = params?.topic as TopicId | undefined;
  const validTopicId: TopicId = rawTopic && rawTopic in DSA_TOPICS ? rawTopic : "arrays";

  const { topicId, initTopic, frames, currentStep, isPlaying, speedMs, stepForward, methodId } =
    useVisualizerStore();

  useEffect(() => {
    initTopic(validTopicId);
  }, [validTopicId, initTopic]);

  useEffect(() => {
    if (!isPlaying) return;
    const timer = window.setInterval(() => {
      stepForward();
    }, speedMs);
    return () => window.clearInterval(timer);
  }, [isPlaying, speedMs, stepForward]);

  const activeTopicId = topicId in DSA_TOPICS ? topicId : validTopicId;
  const topic = DSA_TOPICS[activeTopicId];
  const method = topic.methods.find((m) => m.id === methodId) ?? topic.methods[0];
  const currentFrame = frames[currentStep];

  return (
    <div className="studio-page !pt-6 md:!pt-7">
      <div className="playground-header flex flex-wrap items-center justify-between gap-4 pb-4">
        <div className="flex items-center gap-3">
          <Link
            href="/"
            className="p-2 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <h1 className="text-xl font-bold">{topic.title}</h1>
            <p className="text-xs text-slate-400">{method.description}</p>
          </div>
        </div>

        <div className="flex items-center gap-2 font-mono text-xs">
          <span className="px-2.5 py-1 rounded bg-slate-900 border border-slate-800 text-emerald-300">
            Time: {method.timeComplexity}
          </span>
          <span className="px-2.5 py-1 rounded bg-slate-900 border border-slate-800 text-sky-300">
            Space: {method.spaceComplexity}
          </span>
        </div>
      </div>

      <PlaybackAndSandboxControls />

      {currentFrame && (
        <div
          className={`rounded-lg border px-4 py-2.5 text-xs font-mono flex items-center gap-2.5 ${
            currentFrame.isError
              ? "border-rose-500/60 bg-rose-950/30 text-rose-200"
              : currentFrame.isWarning
              ? "border-amber-500/60 bg-amber-950/30 text-amber-200"
              : "border-slate-800 bg-slate-900/70 text-slate-200"
          }`}
        >
          {currentFrame.isError ? (
            <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
          ) : currentFrame.isWarning ? (
            <Info className="w-4 h-4 text-amber-400 shrink-0" />
          ) : (
            <CheckCircle2 className="w-4 h-4 text-indigo-400 shrink-0" />
          )}
          <span>{currentFrame.description}</span>
        </div>
      )}

      {currentFrame && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
          <div className="lg:col-span-7">
            <VisualizerCanvas topicId={activeTopicId} frame={currentFrame} />
          </div>
          <div className="lg:col-span-5">
            <CodeAndMemoryPanel />
          </div>
        </div>
      )}
    </div>
  );
}

export default function PlaygroundPage() {
  return (
    <Suspense
      fallback={
        <div className="max-w-7xl mx-auto px-4 py-10 font-mono text-sm text-slate-400">
          Loading playground...
        </div>
      }
    >
      <PlaygroundContent />
    </Suspense>
  );
}