import { CallStackFrameSnapshot } from "../core/types";
import { TraceRecorder } from "../core/TraceRecorder";

export class RecursionEngine {
  private recorder: TraceRecorder;
  private frames: CallStackFrameSnapshot[] = [];
  private seq = 0;

  constructor(recorder: TraceRecorder) {
    this.recorder = recorder;
  }

  private pushFrame(fnName: string, args: Record<string, string | number | boolean | null>): string {
    const id = `frame-${++this.seq}`;
    this.frames.forEach((f) => {
      if (f.status === "active") f.status = "waiting";
    });
    this.frames.push({ id, fnName, args, status: "active" });
    return id;
  }

  private resolveFrame(id: string, returnValue: string | number | boolean | null, desc: string, tag = "step2") {
    const target = this.frames.find((f) => f.id === id);
    if (target) {
      target.returnValue = returnValue;
      target.status = "returning";
    }
    this.recorder.record({
      tag,
      action: "POP_FRAME",
      description: desc,
      variables: { returnValue, stackDepth: this.frames.length },
      snapshot: { callStack: this.frames },
    });
    this.frames = this.frames.filter((f) => f.id !== id);
    if (this.frames.length > 0) {
      this.frames[this.frames.length - 1].status = "active";
    }
  }

  public factorial(n: number): void {
    const safeN = Math.max(0, Math.min(8, Math.floor(n || 0)));
    const run = (k: number): number => {
      const fid = this.pushFrame("factorial", { n: k });
      this.recorder.record({
        tag: "step1",
        action: "PUSH_FRAME",
        description: `Pushed frame factorial(${k}) onto call stack.`,
        variables: { n: k, depth: this.frames.length },
        snapshot: { callStack: this.frames },
      });

      if (k <= 1) {
        this.resolveFrame(fid, 1, `Base case reached: factorial(${k}) returns 1.`, "step1");
        return 1;
      }

      const sub = run(k - 1);
      const ans = k * sub;
      this.resolveFrame(fid, ans, `Unwinding factorial(${k}): ${k} * ${sub} = ${ans}.`, "step2");
      return ans;
    };

    const total = run(safeN);
    this.recorder.record({
      tag: "done",
      action: "COMPLETE",
      description: `factorial(${safeN}) completed with result ${total}.`,
      variables: { input: safeN, result: total },
      snapshot: { callStack: [] },
    });
  }

  public fibonacci(n: number): void {
    const safeN = Math.max(0, Math.min(6, Math.floor(n || 0)));
    const run = (k: number): number => {
      const fid = this.pushFrame("fib", { n: k });
      this.recorder.record({
        tag: "step1",
        action: "PUSH_FRAME",
        description: `Calling fib(${k}) — stack depth ${this.frames.length}.`,
        variables: { n: k, depth: this.frames.length },
        snapshot: { callStack: this.frames },
      });

      if (k <= 1) {
        this.resolveFrame(fid, k, `Base case fib(${k}) returns ${k}.`, "step1");
        return k;
      }

      const a = run(k - 1);
      const b = run(k - 2);
      const sum = a + b;
      this.resolveFrame(fid, sum, `fib(${k}) = fib(${k - 1}) [${a}] + fib(${k - 2}) [${b}] = ${sum}.`, "step2");
      return sum;
    };

    const result = run(safeN);
    this.recorder.record({
      tag: "done",
      action: "COMPLETE",
      description: `fibonacci(${safeN}) = ${result}.`,
      variables: { n: safeN, result },
      snapshot: { callStack: [] },
    });
  }

  public recursiveBinarySearch(arr: number[], target: number): void {
    const sorted = [...arr].sort((a, b) => a - b);
    const search = (low: number, high: number): number => {
      const fid = this.pushFrame("bs", { low, high, target });
      this.recorder.record({
        tag: "step1",
        action: "PUSH_FRAME",
        description: `Frame bs(low=${low}, high=${high}, target=${target}).`,
        variables: { low, high, target },
        snapshot: { array: sorted, callStack: this.frames, rangeBounds: { low, high } },
      });

      if (low > high) {
        this.resolveFrame(fid, -1, `Base case (low > high): target ${target} not found, returning -1.`, "step1");
        return -1;
      }

      const mid = Math.floor((low + high) / 2);
      if (sorted[mid] === target) {
        this.resolveFrame(fid, mid, `Found target ${target} at index ${mid}! Returning ${mid}.`, "step2");
        return mid;
      }

      const ans = sorted[mid] > target ? search(low, mid - 1) : search(mid + 1, high);
      this.resolveFrame(fid, ans, `Returning ${ans} from bs(low=${low}, high=${high}).`, "step2");
      return ans;
    };

    const idx = search(0, sorted.length - 1);
    this.recorder.record({
      tag: "done",
      action: idx >= 0 ? "FOUND" : "NOT_FOUND",
      description: idx >= 0 ? `Target ${target} found at sorted index ${idx}.` : `Target ${target} not found.`,
      variables: { target, index: idx },
      snapshot: { array: sorted, foundIndex: idx, callStack: [] },
    });
  }

  public recursiveSum(arr: number[]): void {
    const sumAt = (idx: number): number => {
      const fid = this.pushFrame("sumRec", { idx, val: idx < arr.length ? arr[idx] : "END" });
      this.recorder.record({
        tag: "step1",
        action: "PUSH_FRAME",
        description: `Pushed sumRec(idx=${idx}).`,
        variables: { idx, length: arr.length },
        snapshot: { array: arr, callStack: this.frames, highlightedIndices: idx < arr.length ? [idx] : [] },
      });

      if (idx >= arr.length) {
        this.resolveFrame(fid, 0, `Reached end of array (idx=${idx}); base case returns 0.`, "step1");
        return 0;
      }

      const rest = sumAt(idx + 1);
      const total = arr[idx] + rest;
      this.resolveFrame(fid, total, `sumRec(${idx}): arr[${idx}] (${arr[idx]}) + ${rest} = ${total}.`, "step2");
      return total;
    };

    const total = sumAt(0);
    this.recorder.record({
      tag: "done",
      action: "COMPLETE",
      description: `Recursive array sum = ${total}.`,
      variables: { total },
      snapshot: { array: arr, callStack: [] },
    });
  }
}