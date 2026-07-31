---
id: tree-same-tree-validation
title: Same Tree Validation
module: tree
pattern_label: Parallel Tree Traversal
complexity_label: O(n) / O(h)
estimated_minutes: 15
exit_criteria:
  - >-
    Return true if two trees are identical in structure and node values, false
    otherwise.
---
## Concept

Same Tree Validation 旨在於同時走訪兩棵二元樹，並在結構與節點數值上進行逐一比對。在平行二元樹走訪（Parallel Tree Traversal）的框架下，我們需要確保兩棵樹在每一個對應的位置上，其節點皆同時存在且數值相等，或者同時為空值（null）。這項技術是驗證二元樹對稱性、子樹結構相容性以及樹結構序列化比對的基礎。

## Thinking

在思考 Same Tree Validation 時，核心策略是採用遞迴（Recursion）或廣度優先搜尋（BFS）與深度優先搜尋（DFS）的疊代法，對兩棵樹進行平行走訪。我們必須首先定義基本情況（Base Cases）：若兩棵樹的當前根節點皆為 null，代表此分支完全相同，回傳 true；若其中一棵為 null 而另一棵不是，或兩者皆不為 null 但數值（.val）不相等，則代表結構或數值衝突，回傳 false。若基本情況通過，則同時對左子樹與右子樹進行遞迴驗證，並使用邏輯與（Logical AND）將左右子樹的結果結合，確保兩側皆完全吻合。

## Pattern Recognition

當題目要求『比較兩個獨立的樹狀結構是否完全相同』、『驗證鏡像對稱性』或『檢查一棵樹是否為另一棵樹的子結構』時，即可辨識出 Parallel Tree Traversal 的 Pattern。此 Pattern 的特徵在於函式或走訪迴圈中會同時接受兩個指標（例如 p 與 q），並同步推進其狀態。

## Common Mistakes

最常見的錯誤是在存取節點的數值（.val）之前，沒有完整檢查該節點是否為 null，導致在空節點上存取屬性而引發執行期例外（Runtime Exception）。另一個常見錯誤是只檢查了數值相等，卻遺漏了結構上的空值檢查，導致在不對稱的樹結構中產生錯誤的結果。

## Complexity

時間複雜度為 O(n)，其中 n 為兩棵樹中節點數較少者的節點總數，因為我們最多需要走訪完所有對應節點。空間複雜度在最壞情況下為 O(h)，其中 h 為樹的高度，由遞迴呼叫堆疊（Call Stack）的深度所決定；在完全不平衡的樹中空間複雜度為 O(n)，在平衡樹中則為 O(log n)。

## Digest

Same Tree Validation 透過平行遞迴走訪兩棵二元樹，同步檢查結構與數值。核心在於正確處理 null 邊界條件並結合邏輯運算子。

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

function isSameTree(p: TreeNode | null, q: TreeNode | null): boolean {
  if (!p && !q) return true;
  if (!p || !q) return false;
  return p.val === q.val && isSameTree(p.left, q.left) && isSameTree(p.right, q.right);
}

import assert from "node:assert";
const t1 = new TreeNode(1, new TreeNode(2));
const t2 = new TreeNode(1, null, new TreeNode(2));
assert.strictEqual(isSameTree(t1, t2), false);
```

## Python Tip

```python
class TreeNode:
    def __init__(self, val=0, left=None, right=None):
        self.val = val
        self.left = left
        self.right = right

def isSameTree(p: TreeNode | None, q: TreeNode | None) -> bool:
    if not p and not q:
        return True
    if not p or not q:
        return False
    return p.val == q.val and isSameTree(p.left, q.left) and isSameTree(p.right, q.right)

t1 = TreeNode(1, TreeNode(2))
t2 = TreeNode(1, None, TreeNode(2))
assert isSameTree(t1, t2) == False
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

function isSameTree(p: TreeNode | null, q: TreeNode | null): boolean {
  if (p === null && q === null) return true;
  if (p === null || q === null) return false;
  if (p.val !== q.val) return false;
  return isSameTree(p.left, q.left) && isSameTree(p.right, q.right);
}

import assert from "node:assert";
const tree1 = new TreeNode(1, new TreeNode(2), new TreeNode(3));
const tree2 = new TreeNode(1, new TreeNode(2), new TreeNode(3));
assert.strictEqual(isSameTree(tree1, tree2), true);
```

## Python Corner

```python
class TreeNode:
    def __init__(self, val=0, left=None, right=None):
        self.val = val
        self.left = left
        self.right = right

def isSameTree(p: TreeNode | None, q: TreeNode | None) -> bool:
    if p is None and q is None:
        return True
    if p is None or q is None:
        return False
    if p.val != q.val:
        return False
    return isSameTree(p.left, q.left) and isSameTree(p.right, q.right)

tree1 = TreeNode(1, TreeNode(2), TreeNode(3))
tree2 = TreeNode(1, TreeNode(2), TreeNode(3))
assert isSameTree(tree1, tree2) == True
```

## Takeaway

平行走訪兩棵樹時，務必先確立完整的 null 邊界條件，再進行數值比對與子樹遞迴。

## Tomorrow Preview

明天我們將探討 Symmetric Tree，延伸今天的 Parallel Tree Traversal 概念，學習如何在單一樹中對稱地比對左右子樹。

## Today's Challenge

- **100** · 題號 100 完美對應 Parallel Tree Traversal，需要同步走訪兩棵樹的對應節點以驗證結構與數值是否完全一致。
  - Hint: 先處理雙方皆為 null 的情況，再處理其中一方為 null 或數值不等的情況，最後組合左右子樹的遞迴結果。
