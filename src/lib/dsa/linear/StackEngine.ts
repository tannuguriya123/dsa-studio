// src/lib/dsa/linear/StackEngine.ts
import { TraceRecorder } from "../core/TraceRecorder";

export class StackEngine {
  private items: { id: string; address: string; value: number }[] = [];
  private addr = 0x3000;
  private recorder: TraceRecorder;

  constructor(initialValues: number[], recorder: TraceRecorder) {
    this.recorder = recorder;
    this.items = initialValues.map((value) => ({
      id: `stk-${this.addr}`,
      address: `0x${(this.addr += 0x10).toString(16).toUpperCase()}`,
      value,
    }));
  }

  private snap(extraVars: Record<string, string | number | boolean | null> = {}) {
    const topItem = this.items[this.items.length - 1];
    return {
      variables: {
        size: this.items.length,
        top: topItem ? `${topItem.value} (${topItem.address})` : "EMPTY",
        ...extraVars,
      },
      snapshot: {
        stack: { items: this.items },
        pointers: { topIndex: this.items.length - 1 },
      },
    };
  }

  public push(val: number): void {
    const id = `stk-${this.addr}`;
    const address = `0x${(this.addr += 0x10).toString(16).toUpperCase()}`;
    this.items.push({ id, address, value: val });
    const s = this.snap({ pushed: val });
    this.recorder.record({
      tag: "step1",
      action: "PUSH_FRAME",
      description: `Pushed ${val} onto top of stack at ${address} (size = ${this.items.length}).`,
      ...s,
    });
  }

  public pop(): void {
    if (this.items.length === 0) {
      const s = this.snap({ error: "STACK_UNDERFLOW" });
      this.recorder.record({
        tag: "error",
        action: "ERROR",
        isError: true,
        description: `Stack Underflow: cannot pop() from an empty stack!`,
        ...s,
      });
      return;
    }
    const popped = this.items.pop()!;
    const s = this.snap({ popped: popped.value });
    this.recorder.record({
      tag: "step2",
      action: "POP_FRAME",
      description: `Popped ${popped.value} from top of stack (${popped.address}).`,
      ...s,
    });
  }

  public peek(): void {
    if (this.items.length === 0) {
      const s = this.snap({ peeked: null });
      this.recorder.record({
        tag: "error",
        action: "ERROR",
        isError: true,
        description: `Cannot peek(): stack is currently empty.`,
        ...s,
      });
      return;
    }
    const top = this.items[this.items.length - 1];
    const s = this.snap({ peeked: top.value });
    this.recorder.record({
      tag: "step2",
      action: "FOUND",
      description: `Peeked top element: ${top.value} at ${top.address} (stack unchanged).`,
      ...s,
    });
  }

  public isEmpty(): void {
    const empty = this.items.length === 0;
    const s = this.snap({ isEmpty: empty });
    this.recorder.record({
      tag: "step1",
      action: "COMPLETE",
      description: `isEmpty() returned ${empty} (current size = ${this.items.length}).`,
      ...s,
    });
  }

  public clear(): void {
    const prevCount = this.items.length;
    this.items = [];
    const s = this.snap({ clearedCount: prevCount });
    this.recorder.record({
      tag: "step1",
      action: "FREE",
      description: `Cleared all ${prevCount} element(s) from the stack.`,
      ...s,
    });
  }
}