---
id: tree-dfs-preorder-traversal
title: DFS Preorder Traversal
module: tree
pattern_label: Depth-First Search
complexity_label: O(n) / O(h)
estimated_minutes: 20
exit_criteria:
  - >-
    Write a recursive function that visits the current node first, then left,
    then right.
---
## Concept

DFS Preorder Traversal 是一種二元樹的深度優先搜尋策略，其核心規則為：先訪問根節點（Root），接著遞迴走訪左子樹（Left），最後走訪右子樹（Right）。這種訪問順序確保了父節點總是在其任何子節點之前被處理，非常適合需要自頂向下傳遞狀態或是序列化結構的場景。

## Thinking

在設計 Preorder Traversal 時，思考過程應聚焦於遞迴的兩個核心要素：Base Case 與 Recursive Step。Base Case 用於處理終止條件，即當前節點為空（null 或 None）時直接返回。Recursive Step 則分為三步：首先處理當前節點（例如將其值加入結果集），接著遞迴呼叫左子樹，最後遞迴呼叫右子樹。這種結構能夠自然地利用呼叫堆疊（Call Stack）來保存尚未處理的右子樹狀態。

## Pattern Recognition

當題目要求在處理子節點之前必須先對父節點進行操作、需要將二元樹序列化（Serialize）為字串或陣列，或是需要按照層級由上而下建立結構時，即可辨識出應使用 DFS Preorder Traversal Pattern。其特徵在於運算邏輯位於遞迴呼叫的頂部，即走訪子節點之前。

## Common Mistakes

最常見的錯誤是遺漏 Base Case，導致遞迴無法終止而引發堆疊溢位（Stack Overflow）。另一個常見錯誤是在遞迴過程中錯誤地重置或共用變數狀態，例如在遞迴函式內部重新宣告全域變數或可變陣列，導致收集到的結果不正確。

## Complexity

時間複雜度為 O(n)，其中 n 為二元樹中的節點總數，因為每個節點都會被訪問剛好一次。空間複雜度在最壞情況下（例如鏈狀樹）為 O(h)，其中 h 為樹的高度，此時呼叫堆疊深度達到 h；在平衡二元樹的情況下，空間複雜度為 O(log n)。

## Digest

DFS Preorder Traversal 遵循 Root -> Left -> Right 的順序。其核心在於先處理當前節點再遞迴子節點，時間複雜度 O(n)，空間複雜度 O(h)。實作時務必注意 Base Case 以防堆疊溢位。

## TypeScript Tip

在 TypeScript 中編寫樹狀結構演算法時，妥善運用介面（Interface）或類別定義型別，並搭配明確的型別守衛（Type Guard）如 `node === null`，能有效提升程式碼的強健性與可讀性。

```typescript
interface NodeInterface {
  val: number;
  left: NodeInterface | null;
  right: NodeInterface | null;
}

function validateTree(root: NodeInterface | null): boolean {
  if (root === null) return true;
  return typeof root.val === 'number';
}

const testNode: NodeInterface = { val: 10, left: null, right: null };
if (!validateTree(testNode)) {
  throw new Error("TypeScript type validation failed");
}
```

## Python Tip

Python 開發者在處理樹狀結構遞迴時，若樹的深度極大，應留意 Python 預設的遞迴深度限制（`sys.setrecursionlimit`），必要時可改用迭代法（Iterative Stack）來避免達到系統極限。

```python
import sys

def check_recursion_limit() -> int:
    current_limit = sys.getrecursionlimit()
    assert current_limit > 0, "Recursion limit must be positive"
    return current_limit

limit = check_recursion_limit()
print(f"Current limit: {limit}")
```

## TypeScript Corner

TypeScript 在實作 Preorder Traversal 時，必須妥善處理節點可能為 null 的情況。藉由 TypeScript 的型別系統與選擇性鏈結（Optional Chaining），可以確保程式碼在型別安全的前提下安全執行。

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

function preorderTraversal(root: TreeNode | null): number[] {
  const result: number[] = [];
  function dfs(node: TreeNode | null): void {
    if (node === null) return;
    result.push(node.val);
    dfs(node.left);
    dfs(node.right);
  }
  dfs(root);
  return result;
}

const root = new TreeNode(1, null, new TreeNode(2, new TreeNode(3), null));
const res = preorderTraversal(root);
if (res[0] !== 1 || res[1] !== 2 || res[2] !== 3) {
  throw new Error("Assertion failed: incorrect preorder sequence");
}
```

## Python Corner

Python 實作時通常會使用巢狀的輔助函式，並利用外層函式的變數來收集結果，或者透過預設引數傳遞累積值。注意在 Python 中若需修改整數等不可變物件，應使用容器或非區域變數。

```python
class TreeNode:
    def __init__(self, val=0, left=None, right=None):
        self.val = val
        self.left = left
        self.right = right

def preorderTraversal(root: TreeNode | None) -> list[int]:
    result = []
    def dfs(node: TreeNode | None) -> None:
        if not node:
            return
        result.append(node.val)
        dfs(node.left)
        dfs(node.right)
    dfs(root)
    return result

root = TreeNode(1, None, TreeNode(2, TreeNode(3), None))
res = preorderTraversal(root)
assert res == [1, 2, 3], "Assertion failed: incorrect preorder sequence"
```

## Takeaway

掌握 Preorder Traversal 的 Root-Left-Right 順序，並時刻注意 Base Case 的撰寫以避免堆疊溢位。

## Tomorrow Preview

明天將探討 DFS Inorder Traversal（中序遍歷），學習如何先走訪左子樹、訪問根節點、最後走訪右子樹，這在 Binary Search Tree（BST）中具有保持元素排序的重要應用。

## Today's Challenge

- **144** · 本題直接要求回傳二元樹的前序遍歷結果，是檢驗是否掌握 Root -> Left -> Right 順序的標準題目。
  - Hint: 先將根節點的值存入結果陣列，接著遞迴處理左子樹，最後處理右子樹。
- **114** · 利用前序遍歷訪問節點的順序，將二元樹的右側節點暫存後，重新調整左右指標，把整棵樹原地展開為串列狀。
  - Hint: 可以透過反向的前序遍歷（右 -> 左 -> 根），利用一個指標逐步串接已處理的節點。
