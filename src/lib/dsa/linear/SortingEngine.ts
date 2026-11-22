import { TraceRecorder } from "../core/TraceRecorder";

export class SortingEngine {
  private arr: number[];
  private recorder: TraceRecorder;

  constructor(initial: number[], recorder: TraceRecorder) {
    this.arr = [...initial];
    this.recorder = recorder;
  }

  public bubbleSort(): void {
    const n = this.arr.length;
    for (let i = 0; i < n - 1; i++) {
      let swapped = false;
      for (let j = 0; j < n - i - 1; j++) {
        this.recorder.record({
          tag: "step2",
          action: "COMPARE",
          description: `Pass ${i + 1}: comparing arr[${j}] (${this.arr[j]}) and arr[${j + 1}] (${this.arr[j + 1]}).`,
          variables: { i, j, leftVal: this.arr[j], rightVal: this.arr[j + 1], swapped },
          snapshot: {
            array: this.arr,
            pointers: { i, j },
            highlightedIndices: [j, j + 1],
          },
        });

        if (this.arr[j] > this.arr[j + 1]) {
          [this.arr[j], this.arr[j + 1]] = [this.arr[j + 1], this.arr[j]];
          swapped = true;
          this.recorder.record({
            tag: "step2",
            action: "SWAP",
            description: `Swapped indices ${j} and ${j + 1} -> [${this.arr[j]}, ${this.arr[j + 1]}].`,
            variables: { i, j, swapped: true },
            snapshot: {
              array: this.arr,
              pointers: { i, j },
              swappedIndices: [j, j + 1],
            },
          });
        }
      }
      if (!swapped) break;
    }

    this.recorder.record({
      tag: "done",
      action: "COMPLETE",
      description: `Bubble Sort complete.`,
      variables: { sorted: true },
      snapshot: { array: this.arr },
    });
  }

  public selectionSort(): void {
    const n = this.arr.length;
    for (let i = 0; i < n - 1; i++) {
      let minIdx = i;
      for (let j = i + 1; j < n; j++) {
        this.recorder.record({
          tag: "step2",
          action: "COMPARE",
          description: `Scanning index ${j} (${this.arr[j]}) against current min arr[${minIdx}] (${this.arr[minIdx]}).`,
          variables: { i, j, minIdx, minVal: this.arr[minIdx] },
          snapshot: {
            array: this.arr,
            pointers: { i, j, minIdx },
            highlightedIndices: [minIdx, j],
          },
        });
        if (this.arr[j] < this.arr[minIdx]) {
          minIdx = j;
        }
      }

      if (minIdx !== i) {
        [this.arr[i], this.arr[minIdx]] = [this.arr[minIdx], this.arr[i]];
        this.recorder.record({
          tag: "step3",
          action: "SWAP",
          description: `Placed minimum ${this.arr[i]} at sorted boundary index ${i}.`,
          variables: { i, minIdx },
          snapshot: {
            array: this.arr,
            pointers: { i, minIdx },
            swappedIndices: [i, minIdx],
          },
        });
      }
    }

    this.recorder.record({
      tag: "done",
      action: "COMPLETE",
      description: `Selection Sort complete.`,
      variables: { sorted: true },
      snapshot: { array: this.arr },
    });
  }

  public quickSort(forceWorstCase = false): void {
    if (forceWorstCase) {
      this.arr.sort((a, b) => a - b);
      this.recorder.record({
        tag: "start",
        action: "WARNING",
        isWarning: true,
        description: `Worst-case sandbox triggered: sorted ascending array with last-element pivot degrades partitioning toward O(n²).`,
        variables: { worstCaseMode: true, length: this.arr.length },
        snapshot: { array: this.arr },
      });
    }

    const partition = (low: number, high: number): number => {
      const pivot = this.arr[high];
      let i = low - 1;

      for (let j = low; j < high; j++) {
        this.recorder.record({
          tag: "step1",
          action: "COMPARE",
          description: `Comparing arr[${j}] (${this.arr[j]}) with pivot (${pivot} at index ${high}).`,
          variables: { low, high, i, j, pivot },
          snapshot: {
            array: this.arr,
            pointers: { i, j, pivot: high },
            highlightedIndices: [j, high],
            rangeBounds: { low, high, pivot: high },
          },
        });

        if (this.arr[j] <= pivot) {
          i++;
          if (i !== j) {
            [this.arr[i], this.arr[j]] = [this.arr[j], this.arr[i]];
            this.recorder.record({
              tag: "step1",
              action: "SWAP",
              description: `Moved smaller element ${this.arr[i]} to left partition at index ${i}.`,
              variables: { i, j, pivot },
              snapshot: {
                array: this.arr,
                pointers: { i, j, pivot: high },
                swappedIndices: [i, j],
                rangeBounds: { low, high, pivot: high },
              },
            });
          }
        }
      }

      [this.arr[i + 1], this.arr[high]] = [this.arr[high], this.arr[i + 1]];
      const pivotIndex = i + 1;
      this.recorder.record({
        tag: "step1",
        action: "SWAP",
        description: `Pivot ${pivot} settled at final partition index ${pivotIndex}.`,
        variables: { pivotIndex, pivot, low, high },
        snapshot: {
          array: this.arr,
          pointers: { pivot: pivotIndex },
          highlightedIndices: [pivotIndex],
          rangeBounds: { low, high, pivot: pivotIndex },
        },
      });
      return pivotIndex;
    };

    const sortRec = (low: number, high: number) => {
      if (low >= high) return;
      const p = partition(low, high);
      sortRec(low, p - 1);
      sortRec(p + 1, high);
    };

    sortRec(0, this.arr.length - 1);
    this.recorder.record({
      tag: "done",
      action: "COMPLETE",
      description: `Quick Sort complete.`,
      variables: { sorted: true },
      snapshot: { array: this.arr },
    });
  }

  public mergeSort(): void {
    const merge = (left: number, mid: number, right: number) => {
      const leftPart = this.arr.slice(left, mid + 1);
      const rightPart = this.arr.slice(mid + 1, right + 1);
      let i = 0;
      let j = 0;
      let k = left;

      while (i < leftPart.length && j < rightPart.length) {
        if (leftPart[i] <= rightPart[j]) {
          this.arr[k] = leftPart[i++];
        } else {
          this.arr[k] = rightPart[j++];
        }
        this.recorder.record({
          tag: "step2",
          action: "WRITE",
          description: `Merging [${left}..${right}]: wrote ${this.arr[k]} at index ${k}.`,
          variables: { left, mid, right, k, value: this.arr[k] },
          snapshot: {
            array: this.arr,
            pointers: { k, mid },
            highlightedIndices: [k],
            rangeBounds: { left, mid, right },
          },
        });
        k++;
      }

      while (i < leftPart.length) {
        this.arr[k] = leftPart[i++];
        this.recorder.record({
          tag: "step2",
          action: "WRITE",
          description: `Copying remaining left element ${this.arr[k]} to index ${k}.`,
          variables: { k, value: this.arr[k] },
          snapshot: { array: this.arr, highlightedIndices: [k], rangeBounds: { left, mid, right } },
        });
        k++;
      }

      while (j < rightPart.length) {
        this.arr[k] = rightPart[j++];
        this.recorder.record({
          tag: "step2",
          action: "WRITE",
          description: `Copying remaining right element ${this.arr[k]} to index ${k}.`,
          variables: { k, value: this.arr[k] },
          snapshot: { array: this.arr, highlightedIndices: [k], rangeBounds: { left, mid, right } },
        });
        k++;
      }
    };

    const sortRec = (left: number, right: number) => {
      if (left >= right) return;
      const mid = Math.floor((left + right) / 2);
      sortRec(left, mid);
      sortRec(mid + 1, right);
      merge(left, mid, right);
    };

    sortRec(0, this.arr.length - 1);
    this.recorder.record({
      tag: "done",
      action: "COMPLETE",
      description: `Merge Sort complete.`,
      variables: { sorted: true },
      snapshot: { array: this.arr },
    });
  }
}