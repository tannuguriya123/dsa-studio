// src/lib/dsa/linear/QueueEngine.ts
import { TraceRecorder } from "../core/TraceRecorder";

export class QueueEngine {
  private items: { id: string; address: string; value: number }[] = [];
  private capacity = 12;
  private addr = 0x4000;
  private recorder: TraceRecorder;

  constructor(initialValues: number[], recorder: TraceRecorder) {
    this.recorder = recorder;
    this.items = initialValues.slice(0, this.capacity).map((value) => ({
      id: `q-${this.addr}`,
      address: `0x${(this.addr += 0x10).toString(16).toUpperCase()}`,
      value,
    }));
  }

  private snap(extraVars: Record<string, string | number | boolean | null> = {}) {
    const front = this.items[0];
    const rear = this.items[this.items.length - 1];
    return {
      variables: {
        size: this.items.length,
        front: front ? `${front.value}` : "EMPTY",
        rear: rear ? `${rear.value}` : "EMPTY",
        ...extraVars,
      },
      snapshot: {
        queue: { items: this.items, capacity: this.capacity },
      },
    };
  }

  public enqueue(val: number): void {
    if (this.items.length >= this.capacity) {
      const s = this.snap({ error: "QUEUE_OVERFLOW" });
      this.recorder.record({
        tag: "error",
        action: "ERROR",
        isError: true,
        description: `Queue Overflow: cannot enqueue ${val}; capacity ${this.capacity} is full.`,
        ...s,
      });
      return;
    }
    const id = `q-${this.addr}`;
    const address = `0x${(this.addr += 0x10).toString(16).toUpperCase()}`;
    this.items.push({ id, address, value: val });
    const s = this.snap({ enqueued: val });
    this.recorder.record({
      tag: "step1",
      action: "PUSH_FRAME",
      description: `Enqueued ${val} at rear of queue (${address}). Size = ${this.items.length}.`,
      ...s,
    });
  }

  public dequeue(): void {
    if (this.items.length === 0) {
      const s = this.snap({ error: "QUEUE_UNDERFLOW" });
      this.recorder.record({
        tag: "error",
        action: "ERROR",
        isError: true,
        description: `Queue Underflow: cannot dequeue() from an empty queue!`,
        ...s,
      });
      return;
    }
    const dequeued = this.items.shift()!;
    const s = this.snap({ dequeued: dequeued.value });
    this.recorder.record({
      tag: "step2",
      action: "POP_FRAME",
      description: `Dequeued ${dequeued.value} from front of queue (${dequeued.address}).`,
      ...s,
    });
  }

  public front(): void {
    if (this.items.length === 0) {
      const s = this.snap({ frontValue: null });
      this.recorder.record({
        tag: "error",
        action: "ERROR",
        isError: true,
        description: `Cannot read front(): queue is empty.`,
        ...s,
      });
      return;
    }
    const f = this.items[0];
    const s = this.snap({ frontValue: f.value });
    this.recorder.record({
      tag: "step2",
      action: "FOUND",
      description: `Front element is ${f.value} at ${f.address}.`,
      ...s,
    });
  }

  public isEmpty(): void {
    const empty = this.items.length === 0;
    const s = this.snap({ isEmpty: empty });
    this.recorder.record({
      tag: "step1",
      action: "COMPLETE",
      description: `isEmpty() returned ${empty}.`,
      ...s,
    });
  }

  public clear(): void {
    const count = this.items.length;
    this.items = [];
    const s = this.snap({ clearedCount: count });
    this.recorder.record({
      tag: "step1",
      action: "FREE",
      description: `Cleared ${count} item(s) from the queue.`,
      ...s,
    });
  }
}