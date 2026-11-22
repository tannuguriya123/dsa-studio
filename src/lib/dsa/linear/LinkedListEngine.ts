import { LinkedNodeSnapshot } from "../core/types";
import { TraceRecorder } from "../core/TraceRecorder";

class LLNode {
  public id: string;
  public address: string;
  public value: number;
  public next: LLNode | null = null;

  constructor(value: number, address: string) {
    this.id = address;
    this.address = address;
    this.value = value;
  }
}

export class LinkedListEngine {
  private head: LLNode | null = null;
  private tail: LLNode | null = null;
  private addrCounter = 0x2000;
  private recorder: TraceRecorder;

  constructor(initialValues: number[], recorder: TraceRecorder, createCycle = false) {
    this.recorder = recorder;
    for (const val of initialValues) {
      const node = new LLNode(val, this.nextAddr());
      if (!this.head) {
        this.head = this.tail = node;
      } else {
        this.tail!.next = node;
        this.tail = node;
      }
    }
    if (createCycle && this.head && this.tail && this.head !== this.tail) {
      this.tail.next = this.head;
    }
  }

  private nextAddr(): string {
    const hex = `0x${this.addrCounter.toString(16).toUpperCase()}`;
    this.addrCounter += 0x20;
    return hex;
  }

  private hasCycle(): boolean {
    let slow = this.head;
    let fast = this.head;
    while (fast && fast.next) {
      slow = slow!.next;
      fast = fast.next.next;
      if (slow === fast) return true;
    }
    return false;
  }

  private serialize(activeId?: string | null) {
    const nodes: LinkedNodeSnapshot[] = [];
    const visited = new Set<string>();
    let curr = this.head;
    let guard = 0;

    while (curr && guard < 30) {
      nodes.push({
        id: curr.id,
        address: curr.address,
        value: curr.value,
        nextId: curr.next ? curr.next.id : null,
      });
      if (visited.has(curr.id)) break;
      visited.add(curr.id);
      curr = curr.next;
      guard++;
    }

    return {
      linkedList: {
        headId: this.head ? this.head.id : null,
        tailId: this.tail ? this.tail.id : null,
        nodes,
        hasCycle: this.hasCycle(),
      },
      pointers: {
        head: this.head ? `${this.head.address} (${this.head.value})` : "NULL",
        tail: this.tail ? `${this.tail.address} (${this.tail.value})` : "NULL",
        ...(activeId ? { curr: activeId } : {}),
      },
    };
  }

  public insertHead(val: number): void {
    const node = new LLNode(val, this.nextAddr());
    node.next = this.head;
    this.head = node;
    if (!this.tail) this.tail = node;

    this.recorder.record({
      tag: "step1",
      action: "POINTER_LINK",
      description: `Allocated node ${node.address} (val=${val}), linked next -> ${node.next ? node.next.address : "NULL"}, updated head.`,
      variables: { val, newNode: node.address, head: this.head.address },
      snapshot: this.serialize(node.id),
    });
  }

  public insertTail(val: number): void {
    if (this.hasCycle()) {
      this.recorder.record({
        tag: "step2",
        action: "WARNING",
        isWarning: true,
        description: `Cycle detected in list: tail->next loops back instead of pointing to NULL.`,
        variables: { val, cycleDetected: true },
        snapshot: this.serialize(),
      });
      return;
    }

    const node = new LLNode(val, this.nextAddr());
    if (!this.head || !this.tail) {
      this.head = this.tail = node;
    } else {
      this.tail.next = node;
      this.tail = node;
    }

    this.recorder.record({
      tag: "step2",
      action: "POINTER_LINK",
      description: `Appended node ${node.address} (val=${val}) at tail.`,
      variables: { val, tail: this.tail.address },
      snapshot: this.serialize(node.id),
    });
  }

  public insertAt(index: number, val: number): void {
    if (index <= 0 || !this.head) {
      this.insertHead(val);
      return;
    }

    let prev: LLNode | null = this.head;
    let i = 0;
    while (prev && i < index - 1) {
      this.recorder.record({
        tag: "step2",
        action: "DEREF",
        description: `Traversing to index ${index - 1}: currently at ${prev.address} (val=${prev.value}).`,
        variables: { i, targetIndex: index, currAddr: prev.address },
        snapshot: this.serialize(prev.id),
      });
      prev = prev.next;
      i++;
    }

    if (!prev) {
      this.recorder.record({
        tag: "error",
        action: "ERROR",
        isError: true,
        description: `Index ${index} exceeds linked list length.`,
        variables: { index, val },
        snapshot: this.serialize(),
      });
      return;
    }

    const node = new LLNode(val, this.nextAddr());
    node.next = prev.next;
    prev.next = node;
    if (!node.next) this.tail = node;

    this.recorder.record({
      tag: "step3",
      action: "POINTER_LINK",
      description: `Spliced node ${node.address} (val=${val}) after ${prev.address}.`,
      variables: { index, val, newNode: node.address },
      snapshot: this.serialize(node.id),
    });
  }

  public deleteByValue(val: number): void {
    if (!this.head) {
      this.recorder.record({
        tag: "error",
        action: "ERROR",
        isError: true,
        description: `Cannot delete ${val}: linked list is empty.`,
        variables: { val, head: "NULL" },
        snapshot: this.serialize(),
      });
      return;
    }

    if (this.head.value === val) {
      const removed = this.head;
      this.head = this.head.next;
      if (!this.head) this.tail = null;
      this.recorder.record({
        tag: "step1",
        action: "FREE",
        description: `Removed head node ${removed.address} with value ${val}.`,
        variables: { removedAddr: removed.address, val },
        snapshot: this.serialize(),
      });
      return;
    }

    let curr: LLNode | null = this.head;
    const visited = new Set<string>();
    while (curr && curr.next && curr.next.value !== val) {
      if (visited.has(curr.id)) {
        this.recorder.record({
          tag: "step2",
          action: "WARNING",
          isWarning: true,
          description: `Cycle encountered while searching for ${val}; stopping traversal safely.`,
          variables: { val, cycleDetected: true },
          snapshot: this.serialize(curr.id),
        });
        return;
      }
      visited.add(curr.id);
      this.recorder.record({
        tag: "step2",
        action: "COMPARE",
        description: `Checking next node (${curr.next.address}, val=${curr.next.value}) against ${val}.`,
        variables: { currAddr: curr.address, nextVal: curr.next.value, val },
        snapshot: this.serialize(curr.id),
      });
      curr = curr.next;
    }

    if (curr && curr.next && curr.next.value === val) {
      const target = curr.next;
      curr.next = target.next;
      if (target === this.tail) this.tail = curr;
      this.recorder.record({
        tag: "step3",
        action: "FREE",
        description: `Unlinked and freed node ${target.address} (val=${val}).`,
        variables: { removedAddr: target.address, val },
        snapshot: this.serialize(curr.id),
      });
      return;
    }

    this.recorder.record({
      tag: "done",
      action: "NOT_FOUND",
      description: `Value ${val} was not found in the linked list.`,
      variables: { val, found: false },
      snapshot: this.serialize(),
    });
  }

  public deleteAt(index: number): void {
    if (!this.head || index < 0) {
      this.recorder.record({
        tag: "error",
        action: "ERROR",
        isError: true,
        description: `Invalid deleteAt(${index}): list empty or negative index.`,
        variables: { index },
        snapshot: this.serialize(),
      });
      return;
    }

    if (index === 0) {
      const oldHead = this.head;
      this.head = this.head.next;
      if (!this.head) this.tail = null;
      this.recorder.record({
        tag: "step1",
        action: "FREE",
        description: `Deleted node at index 0 (${oldHead.address}, val=${oldHead.value}).`,
        variables: { index: 0, removedAddr: oldHead.address },
        snapshot: this.serialize(),
      });
      return;
    }

    let prev: LLNode | null = this.head;
    for (let i = 0; i < index - 1 && prev?.next; i++) {
      prev = prev.next;
    }

    if (!prev || !prev.next) {
      this.recorder.record({
        tag: "error",
        action: "ERROR",
        isError: true,
        description: `Index ${index} out of bounds for deletion.`,
        variables: { index },
        snapshot: this.serialize(prev?.id),
      });
      return;
    }

    const removed = prev.next;
    prev.next = removed.next;
    if (removed === this.tail) this.tail = prev;

    this.recorder.record({
      tag: "step3",
      action: "FREE",
      description: `Deleted node at index ${index} (${removed.address}, val=${removed.value}).`,
      variables: { index, removedAddr: removed.address, val: removed.value },
      snapshot: this.serialize(prev.id),
    });
  }

  public search(target: number): void {
    let curr = this.head;
    let idx = 0;
    const visited = new Set<string>();

    while (curr) {
      if (visited.has(curr.id)) {
        this.recorder.record({
          tag: "step1",
          action: "WARNING",
          isWarning: true,
          description: `Cycle detected at node ${curr.address}! Halting search to prevent infinite loop.`,
          variables: { idx, addr: curr.address, target, cycleDetected: true },
          snapshot: this.serialize(curr.id),
        });
        return;
      }
      visited.add(curr.id);

      const matched = curr.value === target;
      this.recorder.record({
        tag: "step1",
        action: matched ? "FOUND" : "COMPARE",
        description: matched
          ? `Found ${target} at index ${idx} (${curr.address}).`
          : `Index ${idx} (${curr.address}): value ${curr.value} !== ${target}.`,
        variables: { idx, addr: curr.address, val: curr.value, target },
        snapshot: this.serialize(curr.id),
      });

      if (matched) return;
      curr = curr.next;
      idx++;
    }

    this.recorder.record({
      tag: "done",
      action: "NOT_FOUND",
      description: `Value ${target} not found in linked list.`,
      variables: { target, result: -1 },
      snapshot: this.serialize(),
    });
  }

  public reverse(): void {
    if (this.hasCycle()) {
      this.recorder.record({
        tag: "step1",
        action: "WARNING",
        isWarning: true,
        description: `List contains a cycle: standard reversal would loop infinitely unless cycle is broken first.`,
        variables: { cycleDetected: true },
        snapshot: this.serialize(),
      });
      return;
    }

    let prev: LLNode | null = null;
    let curr: LLNode | null = this.head;
    this.tail = this.head;

    while (curr) {
      const nextNode: LLNode | null = curr.next;
      curr.next = prev;
      this.recorder.record({
        tag: "step2",
        action: "POINTER_LINK",
        description: `Reversed link of ${curr.address} (val=${curr.value}) -> ${prev ? prev.address : "NULL"}.`,
        variables: {
          curr: curr.address,
          prev: prev ? prev.address : "NULL",
          next: nextNode ? nextNode.address : "NULL",
        },
        snapshot: this.serialize(curr.id),
      });
      prev = curr;
      curr = nextNode;
    }

    this.head = prev;
    this.recorder.record({
      tag: "done",
      action: "COMPLETE",
      description: `Linked list reversed; new head is ${this.head ? this.head.address : "NULL"}.`,
      variables: { head: this.head ? this.head.address : "NULL" },
      snapshot: this.serialize(this.head?.id),
    });
  }
}