"use client";

import React from "react";
import { ExecutionFrame, TopicId } from "@/lib/dsa/core/types";
import { HeapAndArrayRenderer } from "./HeapAndArrayRenderer";
import { LinearAndCallStackRenderer } from "./LinearAndCallStackRenderer";
import { TreeFlowRenderer } from "./TreeFlowRenderer";

export const VisualizerCanvas: React.FC<{ topicId: TopicId; frame: ExecutionFrame }> = ({
  topicId,
  frame,
}) => {
  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-4 min-h-[380px]">
      {topicId === "trees" ? (
        <TreeFlowRenderer frame={frame} />
      ) : topicId === "pointers-heap" || topicId === "arrays" || topicId === "searching-sorting" ? (
        <HeapAndArrayRenderer frame={frame} />
      ) : (
        <LinearAndCallStackRenderer frame={frame} />
      )}
    </div>
  );
};