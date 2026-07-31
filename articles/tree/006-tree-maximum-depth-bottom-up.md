---
id: tree-maximum-depth-bottom-up
title: Maximum Depth of Binary Tree (Bottom-Up)
module: tree
pattern_label: Bottom-Up DFS
complexity_label: O(n) / O(h)
estimated_minutes: 20
exit_criteria:
  - Return 1 plus the maximum of left and right subtree depths.
---
## Concept

Maximum Depth of Binary Tree (Bottom-Up) 探討如何透過後序遍歷（Postorder Traversal）的 Bottom-Up 遞迴策略，聚合左右子樹的計算結果來求解整棵二元樹的最大深度。在遞迴過程中，每個節點的深度取決於其左右子樹中深度較大者再加一。這種由下而上的思考方式能夠優雅地將全域問題拆解為區域子問題。

## Thinking

思考本題時，我們必須先確認 Base Case：當節點為 null 時，其深度為 0。接著進行遞迴步驟：分別計算左子樹的最大深度與右子樹的最大深度。最後，將兩者取其最大值並加上 1，即為以當前節點為根的子樹深度。此過程完全符合 Bottom-Up DFS 的架構，由葉節點逐步向上回傳數值。

## Pattern Recognition

當題目要求尋找全域樹狀結構屬性，且該屬性能夠透過左右子樹的聚合結果來定義時，即為典型的 Bottom-Up DFS Pattern。辨識線索包含：必須遍歷整棵樹、子問題的解法完全相同、且父節點的計算高度依賴子節點的回傳值。

## Common Mistakes

常見錯誤包含未正確處理節點為 null 的 Base Case，導致遞迴無法終止或拋出空指標例外。另一個常見錯誤是搞混 Top-Down 與 Bottom-Up 的寫法，在 Bottom-Up 中誤用全域變數來累加深度，反而破壞了函數的純粹性與正確性。

## Complexity

時間複雜度為 O(n)，其中 n 為二元樹的節點總數，每個節點皆會被訪問一次。空間複雜度為 O(h)，其中 h 為樹的高度，主要取決於遞迴呼叫堆疊（Call Stack）的最大深度；在最壞情況下（斜樹）空間複雜度為 O(n)，在平衡樹下則為 O(log n)。

## Digest

本單元深入解析 Maximum Depth of Binary Tree 的 Bottom-Up 實作方式。透過後序遍歷，我們將大問題化為小問題，先求出左子樹與右子樹的深度，再向上聚合。此技巧是處理二元樹問題的基石。

## TypeScript Tip

```typescript
class TreeNode {
  val: number;
  left: TreeNode | null;
  right: TreeNode | null;
  constructor(val?: number, left?: TreeNode | null, right?: TreeNode | null) {
    this.val = (val===undefined ? 0 : val);
    this.left = (left===undefined ? null : left);
    this.right = (right===undefined ? null : right);
  }
}

function maxDepth(root: TreeNode | null): number {
  if (!root) return 0;
  return Math.max(maxDepth(root.left), maxDepth(root.right)) + 1;
}

const node = new TreeNode(1, null, new TreeNode(2));
if (maxDepth(node) !== 2) throw new Error("assertion failed");
```

## Python Tip

```python
class TreeNode:
    def __init__(self, val=0, left=None, right=None):
        self.val = val
        self.left = left
        self.right = right

def maxDepth(root: TreeNode | None) -> int:
    if not root:
        return 0
    return max(maxDepth(root.left), maxDepth(root.right)) + 1

node = TreeNode(1, None, TreeNode(2))
assert maxDepth(node) == 2, "assertion failed"
```

## TypeScript Corner

```typescript
class TreeNode {
  val: number;
  left: TreeNode | null;
  right: TreeNode | null;
  constructor(val?: number, left?: TreeNode | null, right?: TreeNode | null) {
    this.val = (val===undefined ? 0 : val);
    this.left = (left===undefined ? null : left);
    this.right = (right===undefined ? null : right);
  }
}

function maxDepth(root: TreeNode | null): number {
  if (root === null) {
    return 0;
  }
  const leftDepth = maxDepth(root.left);
  const rightDepth = maxDepth(root.right);
  return Math.max(leftDepth, rightDepth) + 1;
}

const root = new TreeNode(3, new TreeNode(9), new TreeNode(20, new TreeNode(15), new TreeNode(7)));
const depth = maxDepth(root);
if (depth !== 3) throw new Error("assertion failed");
```

## Python Corner

```python
class TreeNode:
    def __init__(self, val=0, left=None, right=None):
        self.val = val
        self.left = left
        self.right = right

def maxDepth(root: TreeNode | None) -> int:
    if root is None:
        return 0
    left_depth = maxDepth(root.left)
    right_depth = maxDepth(root.right)
    return max(left_depth, right_depth) + 1

root = TreeNode(3, TreeNode(9), TreeNode(20, TreeNode(15), TreeNode(7)))
assert maxDepth(root) == 3, "assertion failed"
```

## Takeaway

Bottom-Up DFS 透過後序遍歷聚合子樹結果，是解決二元樹深度與結構問題的核心策略。

## Tomorrow Preview

明天我們將探討 Top-Down 策略的 Maximum Depth of Binary Tree，學習如何透過傳遞參數（如累加器）由上而下更新狀態來求解樹的高度。

## Today's Challenge

- **104** · 此題為經典的二元樹深度計算問題，完美對應 Bottom-Up 遞迴策略，透過聚合左右子樹深度來得出解答。
  - Hint: 請確保 Base Case 針對 null 回傳 0，並在遞迴返回時將左右子樹最大值加一。
