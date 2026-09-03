---
id: tree-same-tree-validation
title: Same Tree Validation
module: tree
pattern_label: Parallel Tree Traversal
complexity_label: O(n) / O(h)
estimated_minutes: 15
exit_criteria:
  - 能在兩棵樹的結構與節點值完全相同時回傳 true，否則回傳 false。
---
## Concept

兩棵二元樹「完全相同」的定義是：每一個對應位置上，節點要嘛同時存在且數值相等，要嘛同時為空。要驗證這件事，我們讓同一個函式同時握著兩個指標 p 與 q，從兩棵樹的根出發、同步往下走——這就是 Parallel Tree Traversal：走訪的單位不是單一節點，而是「一對」位置對應的節點。它是後續驗證鏡像對稱、判斷子樹包含關係的共同基礎：前者改變配對方向，後者則從每個起點各跑一次同一套比對。

## Thinking

站在任何一對 (p, q) 上，情況恰好有三種，互斥且窮盡：

一、兩者皆為 null：這個分支雙方同時走到盡頭，沒有任何差異，回傳 true。
二、恰有一方為 null：一邊有節點、另一邊沒有，形狀已經分歧，回傳 false。
三、兩者皆非 null：此時才能安全讀取 .val。若數值不等，回傳 false；若相等，剩下的問題就縮小成「p 與 q 的左子樹是否相同」與「右子樹是否相同」兩個形式一模一樣、但規模更小的子問題。

為什麼這樣遞迴是對的？因為「相同」的定義本身就是遞迴的：根值相等、左子樹相同、右子樹相同，三者同時成立才叫相同。演算法只是把定義逐字翻譯成程式，用邏輯 AND 串接三個條件；AND 的短路特性還附帶了提前終止——任一處失配，false 會立刻一路傳回頂層，不做多餘的走訪。

不想用遞迴，也可以用佇列改寫成疊代版：把 (p, q) 成對入列，每次取出一對做上述三段判斷，皆非 null 且值相等時再把 (p.left, q.left) 與 (p.right, q.right) 各自成對入列。判斷邏輯完全一致，只是把呼叫堆疊換成顯式佇列。

## Pattern Recognition

看到「比較兩個獨立的樹狀結構是否一致」「判斷一棵樹是否為另一棵樹的子樹」這類題目，就是 Parallel Tree Traversal 的訊號。它的具體特徵是：函式簽名同時收兩個節點指標，且每次遞迴同步推進兩者。單指標走訪處理的是「一棵樹自身的性質」，雙指標走訪處理的是「兩棵樹（或同一棵樹兩個部位）之間的關係」。明天的 Symmetric Tree 就是把配對方式從「左對左、右對右」改成交叉配對的變形。

## Common Mistakes

第一個常見錯誤是判斷順序不對：還沒確認兩者皆非 null 就讀取 .val，會在空節點上觸發執行期例外；三個基本情況必須照「同空、單空、比值」的順序寫，後面的判斷才站得住。第二個錯誤是想繞開雙指標：各自做一次走訪再比對序列——不帶 null 標記的走訪序列無法唯一決定樹形，結構不同的兩棵樹可能產生相同序列而被誤判。第三個錯誤是直接拿節點物件做相等比較，比到的是參考（記憶體位址）而非內容，兩棵內容相同的獨立樹會被誤判為不同。

## Complexity

時間複雜度 O(n)：每一對節點至多被比較一次，實際比較數值的節點對數不超過兩棵樹中較小那棵的節點數，失配時還會因短路提前結束。空間複雜度 O(h)，h 為樹高，來自遞迴呼叫堆疊：平衡樹約為 O(log n)，完全歪斜的樹退化為 O(n)。

## Digest

Same Tree Validation 用一個函式同時握住兩棵樹的對應節點 (p, q) 平行下降。每一對節點只有三種情況：同為 null 回傳 true、恰一方為 null 回傳 false、皆非 null 則比較數值並以邏輯 AND 串接左右子樹的遞迴結果。正確性直接來自「相同」的遞迴定義；短路使失配時提前終止。時間 O(n)、空間 O(h)。

## TypeScript Tip

以 `TreeNode | null` 聯集型別表達空節點；前兩個 if 完成 narrowing 後，編譯器即可保證後續 `.val` 存取安全。

```typescript
import assert from "node:assert";
class TreeNode {
  constructor(
    public val: number,
    public left: TreeNode | null = null,
    public right: TreeNode | null = null,
  ) {}
}
function isSameTree(p: TreeNode | null, q: TreeNode | null): boolean {
  if (p === null && q === null) return true;
  if (p === null || q === null) return false;
  return p.val === q.val
    && isSameTree(p.left, q.left)
    && isSameTree(p.right, q.right);
}
const a = new TreeNode(1, new TreeNode(2));
const b = new TreeNode(1, new TreeNode(2));
const c = new TreeNode(1, null, new TreeNode(2));
assert.strictEqual(isSameTree(a, b), true);
assert.strictEqual(isSameTree(a, c), false);
```

## Python Tip

用 `is None` 判空比 truthiness 更精確；`and` 的短路讓失配的分支不再往下遞迴。

```python
class TreeNode:
    def __init__(self, val=0, left=None, right=None):
        self.val = val
        self.left = left
        self.right = right

def is_same_tree(p: TreeNode | None, q: TreeNode | None) -> bool:
    if p is None and q is None:
        return True
    if p is None or q is None:
        return False
    return (p.val == q.val
            and is_same_tree(p.left, q.left)
            and is_same_tree(p.right, q.right))

a = TreeNode(1, TreeNode(2))
b = TreeNode(1, TreeNode(2))
c = TreeNode(1, None, TreeNode(2))
assert is_same_tree(a, b) is True
assert is_same_tree(a, c) is False
assert is_same_tree(a, TreeNode(1, TreeNode(3))) is False
```

## Takeaway

先照「同空為真、單空為假」處理空值，再比較節點值，最後用 AND 串接左右子樹的遞迴結果。

## Tomorrow Preview

明天進入 Symmetric Tree Check：同樣是雙指標平行走訪，但把配對方式改成交叉——左子樹的 left 對右子樹的 right——用鏡像版的比對驗證一棵樹是否左右對稱。

## Today's Challenge

- **100** · 要求逐節點判斷兩棵樹的結構與數值是否完全一致，是 Parallel Tree Traversal 最直接的應用，三種空值情境一次練齊。
  - Hint: 先處理兩者皆空與單邊為空，再比較節點值，最後用 AND 串接左右子樹的遞迴呼叫。
