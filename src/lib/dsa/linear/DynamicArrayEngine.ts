import { TraceRecorder } from "../core/TraceRecorder";

export class DynamicArrayEngine {
  private data: number[];
  private recorder: TraceRecorder;

  constructor(initial: number[], recorder: TraceRecorder) {
    this.data = [...initial];
    this.recorder = recorder;
  }

  public accessAt(index: number): void {
    this.recorder.record({
      tag: "start",
      action: "INIT",
      description: `Checking bounds for array access at index ${index} (length = ${this.data.length}).`,
      variables: { index, length: this.data.length },
      snapshot: { array: this.data, pointers: { index } },
    });

    if (index < 0 || index >= this.data.length) {
      this.recorder.record({
        tag: "error",
        action: "ERROR",
        isError: true,
        description: `IndexOutOfBounds: index ${index} is outside valid range [0..${Math.max(0, this.data.length - 1)}].`,
        variables: { index, length: this.data.length },
        snapshot: { array: this.data, pointers: { index } },
      });
      return;
    }

    const val = this.data[index];
    this.recorder.record({
      tag: "step2",
      action: "FOUND",
      description: `O(1) access: arr[${index}] = ${val}.`,
      variables: { index, value: val },
      snapshot: {
        array: this.data,
        pointers: { index },
        highlightedIndices: [index],
        foundIndex: index,
      },
    });
  }

  public updateAt(index: number, newVal: number): void {
    if (index < 0 || index >= this.data.length) {
      this.recorder.record({
        tag: "error",
        action: "ERROR",
        isError: true,
        description: `Cannot update index ${index}: out of bounds for length ${this.data.length}.`,
        variables: { index, newVal, length: this.data.length },
        snapshot: { array: this.data, pointers: { index } },
      });
      return;
    }

    const oldVal = this.data[index];
    this.data[index] = newVal;
    this.recorder.record({
      tag: "step2",
      action: "WRITE",
      description: `Updated arr[${index}] from ${oldVal} to ${newVal} in O(1).`,
      variables: { index, oldVal, newVal },
      snapshot: {
        array: this.data,
        pointers: { index },
        highlightedIndices: [index],
      },
    });
  }

  public insertAt(index: number, val: number): void {
    if (index < 0 || index > this.data.length) {
      this.recorder.record({
        tag: "error",
        action: "ERROR",
        isError: true,
        description: `Cannot insert at index ${index}: valid insertion range is [0..${this.data.length}].`,
        variables: { index, val, length: this.data.length },
        snapshot: { array: this.data, pointers: { index } },
      });
      return;
    }

    this.data.push(0);
    for (let i = this.data.length - 1; i > index; i--) {
      this.data[i] = this.data[i - 1];
      this.recorder.record({
        tag: "step2",
        action: "SWAP",
        description: `Shifting arr[${i - 1}] (${this.data[i - 1]}) right to index ${i} to make room.`,
        variables: { i, targetIndex: index, val },
        snapshot: {
          array: this.data,
          pointers: { i, insertAt: index },
          swappedIndices: [i - 1, i],
        },
      });
    }

    this.data[index] = val;
    this.recorder.record({
      tag: "step3",
      action: "WRITE",
      description: `Inserted ${val} at index ${index}. New length = ${this.data.length}.`,
      variables: { index, val, length: this.data.length },
      snapshot: {
        array: this.data,
        pointers: { insertAt: index },
        highlightedIndices: [index],
      },
    });
  }

  public deleteAt(index: number): void {
    if (index < 0 || index >= this.data.length) {
      this.recorder.record({
        tag: "error",
        action: "ERROR",
        isError: true,
        description: `Cannot delete at index ${index}: array length is ${this.data.length}.`,
        variables: { index, length: this.data.length },
        snapshot: { array: this.data, pointers: { index } },
      });
      return;
    }

    const removed = this.data[index];
    this.recorder.record({
      tag: "step1",
      action: "DEREF",
      description: `Marking arr[${index}] (value ${removed}) for removal.`,
      variables: { index, removed },
      snapshot: {
        array: this.data,
        pointers: { deleteAt: index },
        highlightedIndices: [index],
      },
    });

    for (let i = index; i < this.data.length - 1; i++) {
      this.data[i] = this.data[i + 1];
      this.recorder.record({
        tag: "step2",
        action: "SWAP",
        description: `Shifting arr[${i + 1}] (${this.data[i + 1]}) left to index ${i}.`,
        variables: { i, removed },
        snapshot: {
          array: this.data,
          pointers: { i },
          swappedIndices: [i, i + 1],
        },
      });
    }

    this.data.pop();
    this.recorder.record({
      tag: "done",
      action: "COMPLETE",
      description: `Deleted ${removed} at index ${index}. Array now has ${this.data.length} elements.`,
      variables: { removed, length: this.data.length },
      snapshot: { array: this.data },
    });
  }

  public reverse(): void {
    let left = 0;
    let right = this.data.length - 1;
    while (left < right) {
      const temp = this.data[left];
      this.data[left] = this.data[right];
      this.data[right] = temp;

      this.recorder.record({
        tag: "step2",
        action: "SWAP",
        description: `Swapped arr[${left}] and arr[${right}] (${temp} ↔ ${this.data[left]}).`,
        variables: { left, right },
        snapshot: {
          array: this.data,
          pointers: { left, right },
          swappedIndices: [left, right],
          rangeBounds: { left, right },
        },
      });

      left++;
      right--;
    }

    this.recorder.record({
      tag: "done",
      action: "COMPLETE",
      description: `Array reversed in place in O(n) time and O(1) space.`,
      variables: { length: this.data.length },
      snapshot: { array: this.data },
    });
  }

  public rotateLeft(steps: number): void {
    if (this.data.length === 0) return;
    const n = this.data.length;
    const k = ((steps % n) + n) % n;
    for (let s = 0; s < k; s++) {
      const first = this.data.shift()!;
      this.data.push(first);
      this.recorder.record({
        tag: "step2",
        action: "SWAP",
        description: `Left rotation step ${s + 1}/${k}: moved ${first} from front to back.`,
        variables: { stepCount: s + 1, totalRotations: k, movedValue: first },
        snapshot: {
          array: this.data,
          highlightedIndices: [n - 1],
        },
      });
    }
    this.recorder.record({
      tag: "done",
      action: "COMPLETE",
      description: `Rotated array left by ${k} position(s).`,
      variables: { k },
      snapshot: { array: this.data },
    });
  }

  public rotateRight(steps: number): void {
    if (this.data.length === 0) return;
    const n = this.data.length;
    const k = ((steps % n) + n) % n;
    for (let s = 0; s < k; s++) {
      const last = this.data.pop()!;
      this.data.unshift(last);
      this.recorder.record({
        tag: "step2",
        action: "SWAP",
        description: `Right rotation step ${s + 1}/${k}: moved ${last} from back to front.`,
        variables: { stepCount: s + 1, totalRotations: k, movedValue: last },
        snapshot: {
          array: this.data,
          highlightedIndices: [0],
        },
      });
    }
    this.recorder.record({
      tag: "done",
      action: "COMPLETE",
      description: `Rotated array right by ${k} position(s).`,
      variables: { k },
      snapshot: { array: this.data },
    });
  }

  public linearSearch(target: number): void {
    for (let i = 0; i < this.data.length; i++) {
      const match = this.data[i] === target;
      this.recorder.record({
        tag: "step1",
        action: match ? "FOUND" : "COMPARE",
        description: match
          ? `Found target ${target} at index ${i}!`
          : `Index ${i}: comparing arr[${i}] (${this.data[i]}) with target ${target}.`,
        variables: { i, currentVal: this.data[i], target, matched: match },
        snapshot: {
          array: this.data,
          pointers: { i, target },
          highlightedIndices: [i],
          foundIndex: match ? i : null,
        },
      });
      if (match) return;
    }

    this.recorder.record({
      tag: "done",
      action: "NOT_FOUND",
      description: `Target ${target} not found after scanning all ${this.data.length} elements.`,
      variables: { target, result: -1 },
      snapshot: { array: this.data, foundIndex: -1 },
    });
  }

  public binarySearch(target: number): void {
    const isSorted = this.data.every((val, idx) => idx === 0 || this.data[idx - 1] <= val);
    if (!isSorted) {
      this.recorder.record({
        tag: "step2",
        action: "WARNING",
        isWarning: true,
        description: `Warning: Binary Search assumes a sorted array! Unsorted input may miss elements or misdirect mid.`,
        variables: { target, isSorted: false },
        snapshot: { array: this.data },
      });
    }

    let low = 0;
    let high = this.data.length - 1;

    while (low <= high) {
      const mid = Math.floor((low + high) / 2);
      this.recorder.record({
        tag: "step2",
        action: "COMPARE",
        description: `Search window [${low}..${high}], mid = ${mid} (arr[${mid}] = ${this.data[mid]}), target = ${target}.`,
        variables: { low, mid, high, midVal: this.data[mid], target },
        snapshot: {
          array: this.data,
          pointers: { low, mid, high },
          highlightedIndices: [mid],
          rangeBounds: { low, mid, high },
        },
      });

      if (this.data[mid] === target) {
        this.recorder.record({
          tag: "step3",
          action: "FOUND",
          description: `Target ${target} located at index ${mid}!`,
          variables: { foundIndex: mid, target },
          snapshot: {
            array: this.data,
            pointers: { low, mid, high },
            highlightedIndices: [mid],
            foundIndex: mid,
            rangeBounds: { low, mid, high },
          },
        });
        return;
      }

      if (this.data[mid] < target) {
        low = mid + 1;
      } else {
        high = mid - 1;
      }
    }

    this.recorder.record({
      tag: "done",
      action: "NOT_FOUND",
      description: `Target ${target} is not present in the array.`,
      variables: { target, result: -1 },
      snapshot: { array: this.data, foundIndex: -1 },
    });
  }
}