---
id: tree-symmetric-tree-check
title: Symmetric Tree Check
module: tree
pattern_label: Mirror Image DFS
complexity_label: O(n) / O(h)
estimated_minutes: 20
exit_criteria:
  - 能比較左子樹的 left 與右子樹的 right，並比較 left 與 right。
---
## Concept

一棵二元樹「對稱」，意思是把它沿著根節點的中軸左右翻轉後與原樹重合。這句話可以精確化為：根的左子樹與右子樹互為鏡像。而「互為鏡像」本身有遞迴定義——兩個節點 a 與 b 互為鏡像，若且唯若兩者同為空；或兩者皆非空、數值相等，且 a 的左子樹與 b 的右子樹互為鏡像、a 的右子樹與 b 的左子樹互為鏡像。整個問題就這樣從「一棵樹的性質」化約成昨天學過的「兩個節點之間的關係」。

## Thinking

原函式的簽名只收一個 root，但鏡像關係天生是「一對節點」的問題，所以標準作法是另寫一個接收兩個節點 (a, b) 的輔助函式，主函式回傳 mirror(root.left, root.right)；root 為空的空樹視為對稱。

輔助函式內部的三段判斷與昨天完全相同：同空回傳 true、單空回傳 false、皆非空才比較數值。差別只在遞迴的配對方向。為什麼要交叉？想像鏡子的效果：左半邊最外側的東西，映到右半邊也在最外側。所以 a 的 left（外側）要對 b 的 right（外側），a 的 right（內側）要對 b 的 left（內側）。若改成左對左、右對右，驗證的其實是「左右子樹完全相同」——那是形狀平移，不是鏡射。

正確性同樣來自定義：mirror(a, b) 的四個條件（同空、值相等、外側互為鏡像、內側互為鏡像）就是鏡像定義的逐字翻譯，遞迴只是把大問題拆成兩個更小的同型問題，直到空節點觸底。

疊代版則把節點成對入列：每次取出一對 (a, b) 做三段判斷，通過後將 (a.left, b.right) 與 (a.right, b.left) 兩對交叉入列。與遞迴版邏輯一致，只是把堆疊換成佇列。

## Pattern Recognition

當題目要求驗證資料結構是否以某個中軸左右對稱、或要求「翻轉後仍等於自己」時，就是 Mirror Image DFS 的訊號。另一個實務線索是簽名不匹配：題目給你一個 root，但子問題需要同時追蹤兩個位置——這時「主函式包一層、輔助函式收兩個指標」就是標準解法骨架。它與昨天的 Same Tree 只差在配對方向：平行配對驗證「相同」，交叉配對驗證「鏡像」。

## Common Mistakes

最典型的錯誤是沿用平行走訪的慣性，比較 a.left 與 b.left（同側比較）——這驗證的是兩個子樹相同而非互為鏡像：真正對稱的樹會被判為不對稱，而左右子樹一模一樣、兩側同向偏斜的樹反而會被誤判為對稱。第二個錯誤是想逐層收集數值、檢查每層是否回文：不記錄 null 佔位時，缺孔位置不同的兩層可能產生相同的數值序列而漏判。第三個錯誤是忘了空樹與單節點樹都是對稱的，root 為空時直接當例外處理或回傳 false。最後，別把對稱檢查與樹的反轉混為一談：檢查是唯讀的比對，不需要也不應該實際改動任何指標。

## Complexity

時間複雜度 O(n)：每個節點恰好參與一次配對比較，n 為節點總數。空間複雜度 O(h)：遞迴深度等於樹高，平衡樹約 O(log n)，歪斜樹最壞 O(n)；疊代版的佇列在最寬一層可達 O(n)。

## Digest

Symmetric Tree Check 把「一棵樹是否對稱」化約成「左右子樹是否互為鏡像」。輔助函式收一對節點 (a, b)：同空為真、單空為假、皆非空則比較數值，並交叉遞迴——外側對外側 mirror(a.left, b.right)、內側對內側 mirror(a.right, b.left)。同側比較驗證的是相同而非鏡像，這是與 Same Tree 唯一的分歧點。時間 O(n)、空間 O(h)。

## TypeScript Tip

空值判斷可合併為 `a === b`：同為 null 時相等、單空時不等，之後型別已收斂可安全讀 `.val`。

```typescript
import assert from "node:assert";
class TreeNode { constructor(public val: number, public left: TreeNode | null = null, public right: TreeNode | null = null) {} }
function isSymmetric(root: TreeNode | null): boolean {
  const mirror = (a: TreeNode | null, b: TreeNode | null): boolean => {
    if (a === null || b === null) return a === b;
    return a.val === b.val && mirror(a.left, b.right) && mirror(a.right, b.left);
  };
  return root === null || mirror(root.left, root.right);
}
const s = new TreeNode(1, new TreeNode(2, null, new TreeNode(3)), new TreeNode(2, new TreeNode(3)));
assert(isSymmetric(s));
assert(!isSymmetric(new TreeNode(1, new TreeNode(2), new TreeNode(3))));
```

## Python Tip

巢狀 `mirror(a, b)` 封裝雙節點遞迴；空值判斷合併為 `a is b`——同為 None 才成立。

```python
class TreeNode:
    def __init__(self, val=0, left=None, right=None):
        self.val, self.left, self.right = val, left, right

def is_symmetric(root: TreeNode | None) -> bool:
    def mirror(a, b):
        if a is None or b is None:
            return a is b
        return a.val == b.val and mirror(a.left, b.right) and mirror(a.right, b.left)
    return root is None or mirror(root.left, root.right)

s = TreeNode(1, TreeNode(2, None, TreeNode(3)), TreeNode(2, TreeNode(3)))
assert is_symmetric(s)
assert not is_symmetric(TreeNode(1, TreeNode(2), TreeNode(3)))
```

## Takeaway

對稱即左右子樹互為鏡像：輔助函式收一對節點，外側對外側、內側對內側交叉遞迴，同側比較驗的是相同不是鏡像。

## Tomorrow Preview

明天進入 Invert Binary Tree：今天我們「驗證」鏡像關係而不動樹，明天則實際動手把每個節點的左右子樹對調，產生一棵鏡像樹——兩課合起來，你會同時掌握鏡像的判定與建構。

## Today's Challenge

- **101** · 要求判斷二元樹是否為自身的鏡像，正是雙指標交叉配對的原型題：外側對外側、內側對內側，一次練熟 Mirror Image DFS。
  - Hint: 寫一個收兩個節點的輔助函式，先做同空與單空判斷，再比較數值並交叉遞迴 (a.left, b.right) 與 (a.right, b.left)。
