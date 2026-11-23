"use client";

import React, { useMemo } from "react";
import { ReactFlow, Background, Controls, Edge, Node, MarkerType } from "@xyflow/react";
import { ExecutionFrame } from "@/lib/dsa/core/types";

export const TreeFlowRenderer: React.FC<{ frame: ExecutionFrame }> = ({ frame }) => {
  const tree = frame.snapshot.tree;

  const { nodes, edges } = useMemo(() => {
    if (!tree || tree.nodes.length === 0) return { nodes: [] as Node[], edges: [] as Edge[] };

    const highlighted = new Set(tree.highlightedNodeIds ?? []);
    const rfNodes: Node[] = tree.nodes.map((n) => ({
      id: n.id,
      position: { x: n.x, y: n.y },
      data: { label: `${n.value}` },
      style: {
        width: 52,
        height: 52,
        borderRadius: "9999px",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontWeight: 700,
        fontFamily: "monospace",
        background: highlighted.has(n.id) ? "#0284c7" : "#0f172a",
        color: "#f8fafc",
        border: highlighted.has(n.id) ? "2px solid #7dd3fc" : "2px solid #334155",
      },
    }));

    const rfEdges: Edge[] = [];
    for (const n of tree.nodes) {
      if (n.leftId) {
        rfEdges.push({
          id: `${n.id}-L-${n.leftId}`,
          source: n.id,
          target: n.leftId,
          label: "L",
          markerEnd: { type: MarkerType.ArrowClosed },
          style: { stroke: "#64748b" },
        });
      }
      if (n.rightId) {
        rfEdges.push({
          id: `${n.id}-R-${n.rightId}`,
          source: n.id,
          target: n.rightId,
          label: "R",
          markerEnd: { type: MarkerType.ArrowClosed },
          style: { stroke: "#64748b" },
        });
      }
    }

    return { nodes: rfNodes, edges: rfEdges };
  }, [tree]);

  if (!tree) return null;
  const structureKey = `${tree.rootId ?? "null"}:${tree.nodes
    .map((node) => `${node.id}:${node.leftId ?? "-"}:${node.rightId ?? "-"}`)
    .join("|")}`;

  return (
    <div className="space-y-3">
      <div className="h-[360px] w-full rounded-lg border border-slate-800 bg-slate-950 overflow-hidden">
        {nodes.length === 0 ? (
          <div className="h-full flex items-center justify-center font-mono text-xs text-slate-500">
            Tree is empty (ROOT = NULL)
          </div>
        ) : (
          <ReactFlow
            key={structureKey}
            nodes={nodes}
            edges={edges}
            fitView
            nodesDraggable={false}
            nodesConnectable={false}
          >
            <Background color="#1e293b" gap={18} />
            <Controls />
          </ReactFlow>
        )}
      </div>

      {tree.traversalOutput && tree.traversalOutput.length > 0 && (
        <div className="rounded-lg border border-slate-800 bg-slate-900/70 p-3 font-mono text-xs">
          <span className="text-slate-400 mr-2">Traversal Output:</span>
          <span className="text-emerald-300 font-semibold">[{tree.traversalOutput.join(", ")}]</span>
        </div>
      )}
    </div>
  );
};