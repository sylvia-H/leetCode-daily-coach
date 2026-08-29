---
id: tree-dfs-postorder-traversal
title: DFS Postorder Traversal
module: tree
pattern_label: Depth-First Search
complexity_label: O(n) / O(h)
estimated_minutes: 20
exit_criteria:
  - 能寫出先造訪左右子樹、再處理根節點的遞迴函式。
---
## Concept

DFS Postorder Traversal 是一種深度優先搜尋策略，其核心邏輯為先完整走訪左子樹，接著完整走訪右子樹，最後才處理根節點（Left -> Right -> Root）。這種自底向上（bottom-up）的資料處理方式，非常適合需要依賴子樹計算結果來決定父節點狀態的演算法情境。

## Thinking

在處理二元樹問題時，若當前節點的運算結果必須依賴其左右子樹回傳的資訊，則會自然地採用 Postorder Traversal。思考流程如下：首先遞迴呼叫左子樹以取得左側的狀態，接著遞迴呼叫右子樹以取得右側的狀態，最後在根節點整合左右子樹的結果並進行最終運算。

## Pattern Recognition

當題目要求計算樹的高度、深度、直徑，或是需要從葉節點開始向上收集資料以進行節點刪除或狀態聚合時，即可明確辨識出此 Pattern 的應用時機。

## Common Mistakes

最常見的錯誤是在左右子樹尚未回傳計算狀態之前，就提前存取或操作根節點的值，這會破壞依賴關係，導致子樹資訊尚未準備就緒便進行運算。

## Complexity

Time Complexity: O(n), Space Complexity: O(h)

## Digest

掌握 DFS Postorder Traversal 的關鍵在於理解 Left -> Right -> Root 的執行順序。透過自底向上的處理機制，父節點能夠順利取得並整合左右子樹回傳的各項指標。無論是在實作節點刪除、計算樹的高度，或是求解複雜的樹狀結構問題時，此 Pattern 皆展現出極高的實用性與清晰的邏輯架構。

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
  const leftDepth = maxDepth(root.left);
  const rightDepth = maxDepth(root.right);
  return Math.max(leftDepth, rightDepth) + 1;
}

import assert from "node:assert";
const tree = new TreeNode(3, new TreeNode(9), new TreeNode(20, new TreeNode(15), new TreeNode(7)));
assert.strictEqual(maxDepth(tree), 3);
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
    left_depth = maxDepth(root.left)
    right_depth = maxDepth(root.right)
    return max(left_depth, right_depth) + 1

tree = TreeNode(3, TreeNode(9), TreeNode(20, TreeNode(15), TreeNode(7)))
assert maxDepth(tree) == 3
```

## Takeaway

Postorder Traversal 的核心是自底向上，確保子樹運算完成後，父節點再進行整合。

## Tomorrow Preview

明天我們將探討 DFS Level-order Traversal，學習如何使用廣度優先與佇列結構進行層級遍歷。

## Today's Challenge

- **145** · 本題為標準的二元樹後序遍歷練習，直接評估 Left -> Right -> Root 的遞迴掌握度。
  - Hint: 先遞迴左子樹，再遞迴右子樹，最後將當前節點值加入結果陣列。
- **1245** · 計算樹的直徑需要透過後序遍歷自底向上收集左右子樹的高度，並在每個節點更新最大直徑。
  - Hint: 在遞迴回傳子樹高度的同時，利用左右子樹高度和更新全域的最大直徑。
