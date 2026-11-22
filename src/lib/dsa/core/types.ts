export type SupportedLanguage = "ts" | "cpp" | "java" | "py";

export type TopicId =
  | "pointers-heap"
  | "arrays"
  | "searching-sorting"
  | "linked-list"
  | "stack"
  | "queue"
  | "trees"
  | "recursion";

export type FrameAction =
  | "INIT"
  | "ALLOC"
  | "FREE"
  | "REALLOC"
  | "DEREF"
  | "COMPARE"
  | "SWAP"
  | "WRITE"
  | "POINTER_LINK"
  | "PUSH_FRAME"
  | "POP_FRAME"
  | "FOUND"
  | "NOT_FOUND"
  | "COMPLETE"
  | "ERROR"
  | "WARNING";

export interface HeapBlock {
  address: string; // e.g., "0x1000"
  pointerName: string; // e.g., "ptr"
  sizeBytes: number;
  count: number;
  values: (number | null)[];
  status: "allocated" | "freed" | "dangling";
  origin: "malloc" | "calloc" | "realloc";
}

export interface LinkedNodeSnapshot {
  id: string;
  address: string;
  value: number;
  nextId: string | null;
}

export interface TreeNodeSnapshot {
  id: string;
  value: number;
  leftId: string | null;
  rightId: string | null;
  depth: number;
  x: number;
  y: number;
}

export interface CallStackFrameSnapshot {
  id: string;
  fnName: string;
  args: Record<string, string | number | boolean | null>;
  returnValue?: string | number | boolean | null;
  status: "active" | "waiting" | "returning";
}

export interface VisualizerSnapshot {
  array?: number[];
  auxArray?: (number | null)[];
  pointers?: Record<string, number | string | null>;
  highlightedIndices?: number[];
  swappedIndices?: number[];
  foundIndex?: number | null;
  rangeBounds?: { low?: number; mid?: number; high?: number; pivot?: number; left?: number; right?: number };
  heapBlocks?: HeapBlock[];
  linkedList?: {
    headId: string | null;
    tailId: string | null;
    nodes: LinkedNodeSnapshot[];
    hasCycle?: boolean;
  };
  stack?: {
    items: { id: string; address: string; value: number }[];
  };
  queue?: {
    items: { id: string; address: string; value: number }[];
    capacity: number;
  };
  tree?: {
    rootId: string | null;
    nodes: TreeNodeSnapshot[];
    highlightedNodeIds?: string[];
    traversalOutput?: number[];
  };
  callStack?: CallStackFrameSnapshot[];
  outputLog?: string[];
}

export interface ExecutionFrame {
  step: number;
  action: FrameAction;
  description: string;
  lineByLang: Record<SupportedLanguage, number>;
  variables: Record<string, string | number | boolean | null>;
  snapshot: VisualizerSnapshot;
  isError?: boolean;
  isWarning?: boolean;
}

export interface MethodCodeDefinition {
  id: string;
  label: string;
  category: string;
  timeComplexity: string;
  spaceComplexity: string;
  description: string;
  defaultParams: {
    valuesInput?: string;
    targetInput?: string;
    indexInput?: string;
    pointerName?: string;
    bytesInput?: string;
    countInput?: string;
    recursionArg?: string;
    forceWorstCase?: boolean;
    createCycle?: boolean;
  };
  code: Record<SupportedLanguage, string>;
  lineMap: Record<string, Record<SupportedLanguage, number>>;
}

export interface TopicMeta {
  id: TopicId;
  title: string;
  subtitle: string;
  badge: string;
  methods: MethodCodeDefinition[];
}