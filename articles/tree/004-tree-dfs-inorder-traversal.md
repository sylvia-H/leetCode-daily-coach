---
id: tree-dfs-inorder-traversal
title: DFS Inorder Traversal
module: tree
pattern_label: Depth-First Search
complexity_label: O(n) / O(h)
estimated_minutes: 20
exit_criteria:
  - 能寫出先造訪左子樹、再根節點、再右子樹的遞迴函式。
---
## Concept

DFS Inorder Traversal 是一種深度優先搜尋策略，針對二元樹進行拜訪。其核心順序為：先遞迴走訪左子樹，接著處理根節點，最後遞迴走訪右子樹。對於二元搜尋樹而言，這種遍歷順序具有一項非常關鍵的數學性質，即拜訪節點的數值順序剛好會由小到大排序。

## Thinking

在思考 Inorder Traversal 的遞迴流程時，應當將二元樹想像成由無數個根節點與左右子樹組成的巢狀結構。當我們抵達任一節點時，我們不急著記錄其數值，而是優先深入其左子樹的最底部。當左子樹完全走訪完畢並返回後，才處理當前的根節點，最後再將控制權轉移至右子樹。這種先左、次根、後右的邏輯，能夠完整保留節點之間的大小關係與階層脈絡。

## Pattern Recognition

當題目涉及二元搜尋樹（BST）且需要取得排序後的元素清單、驗證一棵樹是否為合法的 BST，或是尋找樹中第 K 小的數值時，這便是辨識出 Inorder Traversal Pattern 的強烈信號。由於其天然的排序特性，通常不需要額外呼叫排序演算法即可直接達成目標。

## Common Mistakes

最常見的錯誤是搞混三種深度優先搜尋的拜訪順序，將 Inorder 的左-根-右誤寫為 Preorder 的根-左-右，或 Postorder 的左-右-根。另一個常見失誤是在遞迴函式中沒有正確傳遞或收集累加的結果陣列，導致每一次遞迴呼叫都重新建立空陣列，最終無法回傳完整的走訪序列。

## Complexity

時間複雜度為 O(n)，其中 n 代表二元樹中的節點總數，因為每一個節點都會被精確拜訪一次。空間複雜度在最壞情況下（例如鏈狀結構的歪斜樹）為 O(n)，而在平衡二元樹的情況下則為 O(h)，其中 h 代表樹的高度，主要取決於遞迴呼叫堆疊所消耗的記憶體空間。

## Digest

DFS Inorder Traversal 是一種系統性走訪二元樹的策略，依循左子樹、根節點、右子樹的順序進行。在處理二元搜尋樹相關問題時，這個 Pattern 能夠直接產生遞增的數值序列，是解開許多範圍查詢與順序統計問題的關鍵鑰匙。掌握遞迴堆疊的運作原理與陣列收集技巧，能確保實作過程穩定且高效。

## TypeScript Tip

```typescript
class TreeNode {
  val: number;
  left: TreeNode | null;
  right: TreeNode | null;
  constructor(val: number) {
    this.val = val;
    this.left = null;
    this.right = null;
  }
}
function getInorder(root: TreeNode | null): number[] {
  const res: number[] = [];
  const dfs = (node: TreeNode | null) => {
    if (!node) return;
    dfs(node.left);
    res.push(node.val);
    dfs(node.right);
  };
  dfs(root);
  return res;
}
const node = new TreeNode(2);
node.left = new TreeNode(1);
node.right = new TreeNode(3);
const res = getInorder(node);
if (res.length !== 3) throw new Error("Length mismatch");
```

## Python Tip

```python
class TreeNode:
    def __init__(self, val: int):
        self.val = val
        self.left = None
        self.right = None

def get_inorder(root: TreeNode | None) -> list[int]:
    res = []
    def dfs(node: TreeNode | None):
        if not node:
            return
        dfs(node.left)
        res.append(node.val)
        dfs(node.right)
    dfs(root)
    return res

node = TreeNode(2)
node.left = TreeNode(1)
node.right = TreeNode(3)
assert get_inorder(node) == [1, 2, 3], "Assertion failed"
```

## Takeaway

牢記 Inorder Traversal 的左-根-右順序，對二元搜尋樹而言就是取得排序序列的捷徑。

## Tomorrow Preview

明天我們將探討 DFS Preorder Traversal（前序走訪），學習如何優先處理根節點再處理左右子樹，這在樹結構的序列化與還原問題中扮演極其重要的角色。

## Today's Challenge

- **94** · 題號 94 要求回傳二元樹的中序走訪結果，這正是 DFS Inorder Traversal 的標準定義與直接應用。
  - Hint: 撰寫一個輔助遞迴函式，依序呼叫左子樹、記錄當前節點值、呼叫右子樹。
- **230** · 題號 230 針對二元搜尋樹尋找第 K 小的元素，利用 Inorder Traversal 能產生遞增序列的特性，走訪到第 K 個元素即可提前終止。
  - Hint: 在遞迴走訪時透過計數器追蹤目前已經拜訪了幾個節點，當計數達到 K 時記錄該節點數值。
