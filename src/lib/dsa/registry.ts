import { ExecutionFrame, TopicId } from "./core/types";
import { DSA_TOPICS } from "./core/codeSnippets";
import { parseNumberList, TraceRecorder } from "./core/TraceRecorder";
import { PointerHeapManager } from "./memory/PointerHeapManager";
import { DynamicArrayEngine } from "./linear/DynamicArrayEngine";
import { SortingEngine } from "./linear/SortingEngine";
import { LinkedListEngine } from "./linear/LinkedListEngine";
import { StackEngine } from "./linear/StackEngine";
import { QueueEngine } from "./linear/QueueEngine";
import { BinarySearchTreeEngine } from "./trees/BinarySearchTreeEngine";
import { RecursionEngine } from "./recursion/RecursionEngine";

export interface RunConfig {
  topicId: TopicId;
  methodId: string;
  valuesInput?: string;
  targetInput?: string;
  indexInput?: string;
  pointerName?: string;
  bytesInput?: string;
  countInput?: string;
  recursionArg?: string;
  forceWorstCase?: boolean;
  createCycle?: boolean;
}

function finiteNumber(value: number | undefined, fallback: number): number {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

export function executeTopicMethod(config: RunConfig): ExecutionFrame[] {
  const topic = DSA_TOPICS[config.topicId];
  const method = topic.methods.find((m) => m.id === config.methodId) ?? topic.methods[0];
  const recorder = new TraceRecorder(method.lineMap);

  const values = parseNumberList(config.valuesInput ?? method.defaultParams.valuesInput, [10, 20, 30, 40, 50]);
  const targetNum = finiteNumber(
    Number(config.targetInput ?? method.defaultParams.targetInput ?? 20),
    20
  );
  const idxNum = finiteNumber(
    Number(config.indexInput ?? method.defaultParams.indexInput ?? 1),
    1
  );
  const ptrName = (config.pointerName ?? method.defaultParams.pointerName ?? "p").trim() || "p";
  const bytesNum = finiteNumber(
    Number(config.bytesInput ?? method.defaultParams.bytesInput ?? 16),
    16
  );
  const countNum = finiteNumber(
    Number(config.countInput ?? method.defaultParams.countInput ?? 4),
    4
  );
  const recArg = finiteNumber(
    Number(config.recursionArg ?? method.defaultParams.recursionArg ?? 5),
    5
  );

  switch (config.topicId) {
    case "pointers-heap": {
      const heap = new PointerHeapManager(recorder);
      if (method.id === "malloc") heap.malloc(ptrName, bytesNum, countNum);
      else if (method.id === "calloc") heap.calloc(ptrName, countNum, bytesNum);
      else if (method.id === "realloc") {
        heap.malloc(ptrName, 16, 4);
        heap.dereferenceAndWrite(ptrName, 0, values[0] ?? 10);
        heap.dereferenceAndWrite(ptrName, 1, values[1] ?? 20);
        heap.realloc(ptrName, bytesNum, countNum);
      } else if (method.id === "free") {
        heap.malloc(ptrName, 16, 4);
        heap.free(ptrName);
        if (config.forceWorstCase) {
          heap.free(ptrName); // Demonstrates double-free error
        }
      } else if (method.id === "dereference") {
        if (config.forceWorstCase) {
          heap.malloc(ptrName, 16, 4);
          heap.free(ptrName);
          heap.dereferenceAndWrite(ptrName, idxNum, Number.isNaN(targetNum) ? 99 : targetNum);
        } else {
          heap.malloc(ptrName, 16, 4);
          heap.dereferenceAndWrite(ptrName, idxNum, Number.isNaN(targetNum) ? 77 : targetNum);
        }
      }
      break;
    }

    case "arrays": {
      const arrEngine = new DynamicArrayEngine(values, recorder);
      if (method.id === "accessAt") arrEngine.accessAt(idxNum);
      else if (method.id === "updateAt") arrEngine.updateAt(idxNum, Number.isNaN(targetNum) ? 99 : targetNum);
      else if (method.id === "insertAt") arrEngine.insertAt(idxNum, Number.isNaN(targetNum) ? 99 : targetNum);
      else if (method.id === "deleteAt") arrEngine.deleteAt(idxNum);
      else if (method.id === "reverse") arrEngine.reverse();
      else if (method.id === "rotateLeft") arrEngine.rotateLeft(idxNum);
      else if (method.id === "rotateRight") arrEngine.rotateRight(idxNum);
      break;
    }

    case "searching-sorting": {
      if (method.id === "linearSearch") {
        new DynamicArrayEngine(values, recorder).linearSearch(Number.isNaN(targetNum) ? 23 : targetNum);
      } else if (method.id === "binarySearch") {
        new DynamicArrayEngine(values, recorder).binarySearch(Number.isNaN(targetNum) ? 37 : targetNum);
      } else {
        const sorter = new SortingEngine(values, recorder);
        if (method.id === "bubbleSort") sorter.bubbleSort();
        else if (method.id === "selectionSort") sorter.selectionSort();
        else if (method.id === "quickSort") sorter.quickSort(Boolean(config.forceWorstCase));
        else if (method.id === "mergeSort") sorter.mergeSort();
      }
      break;
    }

    case "linked-list": {
      const ll = new LinkedListEngine(values, recorder, Boolean(config.createCycle));
      if (method.id === "insertHead") ll.insertHead(Number.isNaN(targetNum) ? 10 : targetNum);
      else if (method.id === "insertTail") ll.insertTail(Number.isNaN(targetNum) ? 40 : targetNum);
      else if (method.id === "insertAt") ll.insertAt(idxNum, Number.isNaN(targetNum) ? 30 : targetNum);
      else if (method.id === "deleteByValue") ll.deleteByValue(Number.isNaN(targetNum) ? 35 : targetNum);
      else if (method.id === "deleteAt") ll.deleteAt(idxNum);
      else if (method.id === "search") ll.search(Number.isNaN(targetNum) ? 48 : targetNum);
      else if (method.id === "reverse") ll.reverse();
      break;
    }

    case "stack": {
      const stk = new StackEngine(values, recorder);
      if (method.id === "push") stk.push(Number.isNaN(targetNum) ? 40 : targetNum);
      else if (method.id === "pop") stk.pop();
      else if (method.id === "peek") stk.peek();
      else if (method.id === "isEmpty") stk.isEmpty();
      else if (method.id === "clear") stk.clear();
      break;
    }

    case "queue": {
      const q = new QueueEngine(values, recorder);
      if (method.id === "enqueue") q.enqueue(Number.isNaN(targetNum) ? 40 : targetNum);
      else if (method.id === "dequeue") q.dequeue();
      else if (method.id === "front") q.front();
      else if (method.id === "isEmpty") q.isEmpty();
      else if (method.id === "clear") q.clear();
      break;
    }

    case "trees": {
      const bst = new BinarySearchTreeEngine(values, recorder);
      if (method.id === "insert") bst.insert(Number.isNaN(targetNum) ? 35 : targetNum);
      else if (method.id === "search") bst.search(Number.isNaN(targetNum) ? 60 : targetNum);
      else if (method.id === "deleteNode") bst.deleteNode(Number.isNaN(targetNum) ? 30 : targetNum);
      else if (
        method.id === "inorder" ||
        method.id === "preorder" ||
        method.id === "postorder" ||
        method.id === "levelOrder"
      ) {
        bst.traverse(method.id);
      }
      break;
    }

    case "recursion": {
      const rec = new RecursionEngine(recorder);
      if (method.id === "factorial") rec.factorial(recArg);
      else if (method.id === "fibonacci") rec.fibonacci(recArg);
      else if (method.id === "recursiveBinarySearch") {
        rec.recursiveBinarySearch(values, Number.isNaN(targetNum) ? 23 : targetNum);
      } else if (method.id === "recursiveSum") rec.recursiveSum(values);
      break;
    }
  }

  return recorder.getFrames();
}