import { HeapBlock } from "../core/types";
import { TraceRecorder } from "../core/TraceRecorder";

export class PointerHeapManager {
  private blocks: HeapBlock[] = [];
  private nextAddr = 0x1000;
  private recorder: TraceRecorder;

  constructor(recorder: TraceRecorder, seedBlocks?: HeapBlock[]) {
    this.recorder = recorder;
    if (seedBlocks) {
      this.blocks = seedBlocks;
      const maxHex = seedBlocks.reduce((acc, b) => Math.max(acc, parseInt(b.address, 16) + 0x100), 0x1000);
      this.nextAddr = maxHex;
    }
  }

  private allocAddress(): string {
    const addr = `0x${this.nextAddr.toString(16).toUpperCase()}`;
    this.nextAddr += 0x40;
    return addr;
  }

  public getBlocks(): HeapBlock[] {
    return this.blocks;
  }

  public malloc(ptrName: string, totalBytes: number, count: number): void {
    const safeCount = Math.max(1, Math.min(8, Math.floor(count || 1)));
    const safeBytes = Math.max(4, Math.floor(totalBytes || safeCount * 4));
    const address = this.allocAddress();

    // Mark any prior block owned by this pointerName as dangling if overwritten without free
    this.blocks.forEach((b) => {
      if (b.pointerName === ptrName && b.status === "allocated") {
        b.status = "dangling";
      }
    });

    const newBlock: HeapBlock = {
      address,
      pointerName: ptrName,
      sizeBytes: safeBytes,
      count: safeCount,
      values: Array.from({ length: safeCount }, () => null),
      status: "allocated",
      origin: "malloc",
    };
    this.blocks.push(newBlock);

    this.recorder.record({
      tag: "step1",
      action: "ALLOC",
      description: `malloc(${safeBytes}) allocated ${safeCount} slots at ${address} assigned to pointer '${ptrName}' (uninitialized slots).`,
      variables: { [ptrName]: address, sizeBytes: safeBytes, count: safeCount, status: "allocated" },
      snapshot: {
        heapBlocks: this.blocks,
        pointers: { [ptrName]: address },
      },
    });
  }

  public calloc(ptrName: string, count: number, elemBytes: number): void {
    const safeCount = Math.max(1, Math.min(8, Math.floor(count || 4)));
    const safeElem = Math.max(1, Math.floor(elemBytes || 4));
    const totalBytes = safeCount * safeElem;
    const address = this.allocAddress();

    this.blocks.forEach((b) => {
      if (b.pointerName === ptrName && b.status === "allocated") {
        b.status = "dangling";
      }
    });

    const newBlock: HeapBlock = {
      address,
      pointerName: ptrName,
      sizeBytes: totalBytes,
      count: safeCount,
      values: Array.from({ length: safeCount }, () => 0),
      status: "allocated",
      origin: "calloc",
    };
    this.blocks.push(newBlock);

    this.recorder.record({
      tag: "step1",
      action: "ALLOC",
      description: `calloc(${safeCount}, ${safeElem}) allocated ${totalBytes} zero-initialized bytes at ${address} for '${ptrName}'.`,
      variables: { [ptrName]: address, count: safeCount, elemBytes: safeElem, totalBytes },
      snapshot: {
        heapBlocks: this.blocks,
        pointers: { [ptrName]: address },
      },
    });
  }

  public realloc(ptrName: string, newBytes: number, newCount: number): void {
    const target = [...this.blocks].reverse().find((b) => b.pointerName === ptrName);
    if (!target || target.status !== "allocated") {
      this.recorder.record({
        tag: "error",
        action: "ERROR",
        isError: true,
        description: `Cannot realloc '${ptrName}': pointer is unallocated, dangling, or already freed.`,
        variables: { [ptrName]: target ? `${target.address} (${target.status})` : "NULL" },
        snapshot: { heapBlocks: this.blocks, pointers: { [ptrName]: target?.address ?? null } },
      });
      return;
    }

    const safeCount = Math.max(1, Math.min(8, Math.floor(newCount || target.count + 2)));
    const safeBytes = Math.max(4, Math.floor(newBytes || safeCount * 4));
    const oldAddr = target.address;
    const newAddr = this.allocAddress();

    target.status = "freed";
    const resized: HeapBlock = {
      address: newAddr,
      pointerName: ptrName,
      sizeBytes: safeBytes,
      count: safeCount,
      values: Array.from({ length: safeCount }, (_, idx) =>
        idx < target.values.length ? target.values[idx] : null
      ),
      status: "allocated",
      origin: "realloc",
    };
    this.blocks.push(resized);

    this.recorder.record({
      tag: "step2",
      action: "REALLOC",
      description: `realloc('${ptrName}') moved block from ${oldAddr} to ${newAddr} (${safeBytes} bytes, ${safeCount} slots), preserving existing values.`,
      variables: { [ptrName]: newAddr, oldAddress: oldAddr, newBytes: safeBytes },
      snapshot: {
        heapBlocks: this.blocks,
        pointers: { [ptrName]: newAddr },
      },
    });
  }

  public free(ptrName: string): void {
    const active = [...this.blocks]
      .reverse()
      .find((b) => b.pointerName === ptrName && (b.status === "allocated" || b.status === "dangling"));

    if (!active) {
      this.recorder.record({
        tag: "error",
        action: "ERROR",
        isError: true,
        description: `Double-free / Invalid free detected on '${ptrName}': no active allocated block to release.`,
        variables: { [ptrName]: "NULL / ALREADY_FREED" },
        snapshot: { heapBlocks: this.blocks, pointers: { [ptrName]: null } },
      });
      return;
    }

    const freedAddr = active.address;
    active.status = "freed";
    active.values = active.values.map(() => null);

    this.recorder.record({
      tag: "step2",
      action: "FREE",
      description: `free() released memory at ${freedAddr} for '${ptrName}' and set pointer to NULL to prevent dangling access.`,
      variables: { [ptrName]: "NULL", freedAddress: freedAddr },
      snapshot: {
        heapBlocks: this.blocks,
        pointers: { [ptrName]: null },
      },
    });
  }

  public dereferenceAndWrite(ptrName: string, index: number, value: number): void {
    const block = [...this.blocks].reverse().find((b) => b.pointerName === ptrName);
    if (!block) {
      this.recorder.record({
        tag: "error",
        action: "ERROR",
        isError: true,
        description: `Null Pointer Dereference: '${ptrName}' does not point to any heap block.`,
        variables: { [ptrName]: "NULL", index, value },
        snapshot: { heapBlocks: this.blocks, pointers: { [ptrName]: null } },
      });
      return;
    }

    if (block.status === "freed" || block.status === "dangling") {
      this.recorder.record({
        tag: "error",
        action: "ERROR",
        isError: true,
        description:
          block.status === "freed"
            ? `Use-After-Free Error: attempting to access ${block.address} after free()!`
            : `Dangling Pointer Error: '${ptrName}' no longer points to its allocated block.`,
        variables: { [ptrName]: `${block.address} [${block.status.toUpperCase()}]`, index, value },
        snapshot: { heapBlocks: this.blocks, pointers: { [ptrName]: block.address } },
      });
      return;
    }

    if (index < 0 || index >= block.values.length) {
      this.recorder.record({
        tag: "error",
        action: "ERROR",
        isError: true,
        description: `Out-of-bounds offset [${index}] on block of size ${block.values.length} at ${block.address}.`,
        variables: { [ptrName]: block.address, index, capacity: block.values.length },
        snapshot: { heapBlocks: this.blocks, pointers: { [ptrName]: block.address } },
      });
      return;
    }

    block.values[index] = value;
    this.recorder.record({
      tag: "step3",
      action: "DEREF",
      description: `Dereferenced ${block.address}[${index}] and wrote value ${value}.`,
      variables: { [ptrName]: block.address, offset: index, writtenValue: value },
      snapshot: {
        heapBlocks: this.blocks,
        pointers: { [ptrName]: block.address },
        highlightedIndices: [index],
      },
    });
  }
}