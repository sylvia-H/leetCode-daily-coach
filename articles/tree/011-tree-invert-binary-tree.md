---
id: tree-invert-binary-tree
title: Invert Binary Tree
module: tree
pattern_label: Tree Transformation
complexity_label: O(n) / O(h)
estimated_minutes: 15
exit_criteria:
  - 能對二元樹中的每個節點交換 left 與 right 指標。
---
## Concept

Invert Binary Tree 是一道經典的二元樹轉換題型，核心目標是將整棵二元樹的左右子樹進行對稱翻轉。換句話說，對於樹中的每一個節點，原本指向左子樹的指標會改為指向右子樹，原本指向右子樹的指標則改為指向左子樹。這種結構上的變動需要我們逐一走訪樹中的所有節點，並在每個節點上執行對調操作。透過遞迴或迭代的方式，我們能夠確保每一個子樹都被完整且正確地鏡像翻轉，最終產出結構完全相反的二元樹。

## Thinking

在思考如何實作 Invert Binary Tree 時，我們首先要建立遞迴的思考框架。對於任意節點而言，如果該節點為空，則直接返回空值，這便是遞迴的 Base Case。若節點存在，我們不需要等待子樹處理完才進行交換，也可以選擇先交換當前節點的左子樹與右子樹指標，接著再遞迴地對這兩個子樹進行同樣的翻轉動作。這種由上至下的處理方式確保了每一個節點的左右子樹指標都能夠被確實對調。在迭代解法中，我們則可以利用佇列或堆疊來輔助走訪，依序將每個節點取出並交換其左右子樹，直到所有節點都處理完畢。

## Pattern Recognition

當我們在題目中看到需要修改、重建、或鏡像對稱整棵樹結構（Tree Structure）的特徵時，通常就可以聯想到 Tree Transformation 的 Pattern。這類題目的共同點在於，答案往往依賴於對子樹處理結果的組合，或者是直接在原樹上進行指標的重定向（In-place Modification）。識別出這個 Pattern 後，我們可以直接思考要採用前序、中序還是後序的遞迴順序，或者是透過層序走訪來逐層交換節點。

## Common Mistakes

在實作二元樹翻轉時，最常見的錯誤是沒有正確儲存或重新指派被交換的參考。舉例來說，如果在沒有暫存變數的情況下直接覆蓋指標，可能會導致遺失原本的子樹參考。另一個常見問題是忘記處理 Base Case，導致遞迴函式在遇到空節點時拋出錯誤。此外，部分開發者在進行原地修改時，誤以為只需要翻轉根節點即可，忽略了必須遞迴深入每一個子樹，導致深層的節點維持原狀。

## Complexity

O(n) / O(h)

## Digest

Invert Binary Tree 是掌握樹狀結構轉換的入門基石。透過理解遞迴的 Base Case 與指標交換技巧，我們能夠輕鬆達成樹的鏡像翻轉。無論是 TypeScript 的暫存變數指派，或是 Python 的同時賦值語法，都能夠優雅地完成節點互換。掌握這個 Pattern 後，面對其他需要修改或重建樹結構的題目將能游刃有餘。

## TypeScript Tip

在 TypeScript 中，利用解構賦值可以讓變數交換變得非常簡潔乾淨。例如：`[root.left, root.right] = [invertTree(root.right), invertTree(root.left)]`。以下為完整的可執行範例：
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

function invertTree(root: TreeNode | null): TreeNode | null {
  if (!root) return null;
  [root.left, root.right] = [invertTree(root.right), invertTree(root.left)];
  return root;
}

const root = new TreeNode(1, new TreeNode(2), null);
const res = invertTree(root);
if (res?.right?.val !== 2) throw new Error("Tip assertion failed");
```

## Python Tip

Python 的語法特性支援同時賦值（Simultaneous Assignment），這使得 `node.left, node.right = node.right, node.left` 的交換操作變得極其直觀且安全。以下為完整的可執行範例：
```python
class TreeNode:
    def __init__(self, val=0, left=None, right=None):
        self.val = val
        self.left = left
        self.right = right

def invertTree(root: TreeNode | None) -> TreeNode | None:
    if root:
        root.left, root.right = invertTree(root.right), invertTree(root.left)
    return root

root = TreeNode(1, TreeNode(2), None)
res = invertTree(root)
assert res.right.val == 2, "Tip assertion failed"
```

## Takeaway

掌握遞迴對調左右子樹的核心邏輯，理解 Tree Transformation 的結構修改模式，並熟練運用原地指標更新。

## Tomorrow Preview

明天我們將探討 Valid Binary Search Tree 驗證二元搜尋樹的進階題型，學習如何透過遞迴帶入上下界來確保樹結構符合特定的排序規則。

## Today's Challenge

- **226** · 此題為經典的 Tree Transformation 題型，完全符合透過遞迴或迭代交換左右子樹以達到整樹鏡像翻轉的 Pattern 特徵。
  - Hint: 注意 Base Case 的處理，並確保每一個節點的左右子樹都有被遞迴呼叫並對調。
