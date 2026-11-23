import { TreeNodeSnapshot } from "../core/types";
import { TraceRecorder } from "../core/TraceRecorder";

class BSTNode {
  public id: string;
  public value: number;
  public left: BSTNode | null = null;
  public right: BSTNode | null = null;

  constructor(value: number) {
    this.id = `bst-${value}`;
    this.value = value;
  }
}

export class BinarySearchTreeEngine {
  private root: BSTNode | null = null;
  private recorder: TraceRecorder;

  constructor(initialValues: number[], recorder: TraceRecorder) {
    this.recorder = recorder;
    for (const v of initialValues) {
      this.root = this.insertSilent(this.root, v);
    }
    this.recorder.record({
      tag: "init",
      action: "INIT",
      description: "Initialized BST with the values in the sandbox.",
      variables: { values: initialValues.join(", ") },
      snapshot: this.layoutNodes(),
    });
  }

  private insertSilent(node: BSTNode | null, val: number): BSTNode {
    if (!node) return new BSTNode(val);
    if (val < node.value) node.left = this.insertSilent(node.left, val);
    else if (val > node.value) node.right = this.insertSilent(node.right, val);
    return node;
  }

  private layoutNodes(highlightedNodeIds: string[] = [], traversalOutput: number[] = []) {
    const nodes: TreeNodeSnapshot[] = [];
    let counter = 0;

    const assignCoords = (node: BSTNode | null, depth: number) => {
      if (!node) return;
      assignCoords(node.left, depth + 1);
      const x = counter * 115;
      const y = depth * 105;
      counter++;
      nodes.push({
        id: node.id,
        value: node.value,
        leftId: node.left ? node.left.id : null,
        rightId: node.right ? node.right.id : null,
        depth,
        x,
        y,
      });
      assignCoords(node.right, depth + 1);
    };

    assignCoords(this.root, 0);

    return {
      tree: {
        rootId: this.root ? this.root.id : null,
        nodes,
        highlightedNodeIds,
        traversalOutput,
      },
    };
  }

  public insert(val: number): void {
    const insertRec = (node: BSTNode | null): BSTNode => {
      if (!node) {
        const created = new BSTNode(val);
        if (!this.root) this.root = created;
        this.recorder.record({
          tag: "step1",
          action: "PUSH_FRAME",
          description: `Inserted new node with value ${val}.`,
          variables: { inserted: val, nodeId: created.id },
          snapshot: this.layoutNodes([created.id]),
        });
        return created;
      }

      this.recorder.record({
        tag: "step3",
        action: "COMPARE",
        description: `At node ${node.value}: comparing new value ${val}.`,
        variables: { currentNode: node.value, val },
        snapshot: this.layoutNodes([node.id]),
      });

      if (val === node.value) {
        this.recorder.record({
          tag: "step2",
          action: "WARNING",
          isWarning: true,
          description: `Duplicate value ${val} already exists in BST — skipped to preserve unique key invariant.`,
          variables: { duplicate: val },
          snapshot: this.layoutNodes([node.id]),
        });
        return node;
      }

      if (val < node.value) {
        const previousLeft = node.left;
        node.left = insertRec(node.left);
        if (!previousLeft && node.left) {
          this.recorder.record({
            tag: "step1",
            action: "PUSH_FRAME",
            description: `Attached new node ${val} to the left of node ${node.value}.`,
            variables: { inserted: val, parent: node.value, direction: "LEFT" },
            snapshot: this.layoutNodes([node.left.id]),
          });
        }
      } else {
        const previousRight = node.right;
        node.right = insertRec(node.right);
        if (!previousRight && node.right) {
          this.recorder.record({
            tag: "step1",
            action: "PUSH_FRAME",
            description: `Attached new node ${val} to the right of node ${node.value}.`,
            variables: { inserted: val, parent: node.value, direction: "RIGHT" },
            snapshot: this.layoutNodes([node.right.id]),
          });
        }
      }
      return node;
    };

    this.root = insertRec(this.root);
  }

  public search(val: number): void {
    const searchRec = (node: BSTNode | null): boolean => {
      if (!node) {
        this.recorder.record({
          tag: "step1",
          action: "NOT_FOUND",
          description: `Reached null branch: value ${val} not found in BST.`,
          variables: { val, found: false },
          snapshot: this.layoutNodes([]),
        });
        return false;
      }

      const match = node.value === val;
      this.recorder.record({
        tag: "step2",
        action: match ? "FOUND" : "COMPARE",
        description: match
          ? `Found target ${val} at node ${node.value}!`
          : `Node ${node.value}: ${val} < ${node.value} ? going ${val < node.value ? "LEFT" : "RIGHT"}.`,
        variables: { currentNode: node.value, val, direction: match ? "FOUND" : val < node.value ? "LEFT" : "RIGHT" },
        snapshot: this.layoutNodes([node.id]),
      });

      if (match) return true;
      return val < node.value ? searchRec(node.left) : searchRec(node.right);
    };

    searchRec(this.root);
  }

  public deleteNode(val: number): void {
    let deletionOccurred = false;

    const findMin = (node: BSTNode): BSTNode => {
      let curr = node;
      while (curr.left) curr = curr.left;
      return curr;
    };

    const delRec = (node: BSTNode | null): BSTNode | null => {
      if (!node) {
        this.recorder.record({
          tag: "done",
          action: "NOT_FOUND",
          description: `Value ${val} not found in tree; nothing deleted.`,
          variables: { val, deleted: false },
          snapshot: this.layoutNodes([]),
        });
        return null;
      }

      if (val < node.value) {
        node.left = delRec(node.left);
        return node;
      }
      if (val > node.value) {
        node.right = delRec(node.right);
        return node;
      }

      // Found node to delete
      if (!node.left && !node.right) {
        this.recorder.record({
          tag: "step3",
          action: "FREE",
          description: `Deleting leaf node ${node.value} (0 children).`,
          variables: { deleted: node.value, caseType: "LEAF" },
          snapshot: this.layoutNodes([node.id]),
        });
        deletionOccurred = true;
        return null;
      }

      if (!node.left || !node.right) {
        const child = node.left ?? node.right;
        this.recorder.record({
          tag: "step3",
          action: "POINTER_LINK",
          description: `Deleting node ${node.value} (1 child) and promoting child ${child!.value}.`,
          variables: { deleted: node.value, promoted: child!.value, caseType: "ONE_CHILD" },
          snapshot: this.layoutNodes([node.id, child!.id]),
        });
        deletionOccurred = true;
        return child;
      }

      // Two children -> inorder successor
      const succ = findMin(node.right);
      this.recorder.record({
        tag: "step4",
        action: "SWAP",
        description: `Node ${node.value} has 2 children: replacing with inorder successor ${succ.value}.`,
        variables: { deletedTarget: val, successor: succ.value, caseType: "TWO_CHILDREN" },
        snapshot: this.layoutNodes([node.id, succ.id]),
      });
      node.value = succ.value;
      node.id = `bst-${succ.value}`;
      node.right = this.deleteSuccessorSilent(node.right, succ.value);
      deletionOccurred = true;
      return node;
    };

    this.root = delRec(this.root);
    if (deletionOccurred) {
      this.recorder.record({
        tag: "done",
        action: "COMPLETE",
        description: `Deletion complete: node ${val} removed from the BST.`,
        variables: { val, deleted: true },
        snapshot: this.layoutNodes(),
      });
    }
  }

  private deleteSuccessorSilent(node: BSTNode | null, key: number): BSTNode | null {
    if (!node) return null;
    if (key < node.value) node.left = this.deleteSuccessorSilent(node.left, key);
    else if (key > node.value) node.right = this.deleteSuccessorSilent(node.right, key);
    else return node.right;
    return node;
  }

  public traverse(mode: "inorder" | "preorder" | "postorder" | "levelOrder"): void {
    const visited: number[] = [];

    if (mode === "levelOrder") {
      if (!this.root) return;
      const queue: BSTNode[] = [this.root];
      while (queue.length > 0) {
        const curr = queue.shift()!;
        visited.push(curr.value);
        this.recorder.record({
          tag: "step2",
          action: "FOUND",
          description: `Level-order (BFS) visit: ${curr.value}. Queue size = ${queue.length}.`,
          variables: { visiting: curr.value, visitedSoFar: visited.join(" -> ") },
          snapshot: this.layoutNodes([curr.id], [...visited]),
        });
        if (curr.left) queue.push(curr.left);
        if (curr.right) queue.push(curr.right);
      }
      return;
    }

    const dfs = (node: BSTNode | null) => {
      if (!node) return;
      if (mode === "preorder") {
        visited.push(node.value);
        this.recorder.record({
          tag: "step2",
          action: "FOUND",
          description: `Preorder visit (Root -> Left -> Right): ${node.value}.`,
          variables: { visiting: node.value, order: visited.join(", ") },
          snapshot: this.layoutNodes([node.id], [...visited]),
        });
      }
      dfs(node.left);
      if (mode === "inorder") {
        visited.push(node.value);
        this.recorder.record({
          tag: "step2",
          action: "FOUND",
          description: `Inorder visit (Left -> Root -> Right): ${node.value}.`,
          variables: { visiting: node.value, order: visited.join(", ") },
          snapshot: this.layoutNodes([node.id], [...visited]),
        });
      }
      dfs(node.right);
      if (mode === "postorder") {
        visited.push(node.value);
        this.recorder.record({
          tag: "step2",
          action: "FOUND",
          description: `Postorder visit (Left -> Right -> Root): ${node.value}.`,
          variables: { visiting: node.value, order: visited.join(", ") },
          snapshot: this.layoutNodes([node.id], [...visited]),
        });
      }
    };

    dfs(this.root);
  }
}