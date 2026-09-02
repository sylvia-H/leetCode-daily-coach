---
id: tree-balanced-binary-tree-check
title: Balanced Binary Tree Check
module: tree
pattern_label: Bottom-Up Validation
complexity_label: O(n) / O(h)
estimated_minutes: 25
exit_criteria:
  - 能及早偵測不平衡並將失敗向上傳遞，不做多餘的高度計算。
---
## Concept

高度平衡二元樹（Height-Balanced Binary Tree）的定義是遞迴的：**每一個**節點的左右子樹高度差絕對值不超過 1，且左右子樹本身也必須高度平衡。請注意「每一個節點」——只看根節點的高度差是不夠的，失衡可能藏在任何一層子樹裡。前兩課我們用 Top-Down 與 Bottom-Up 兩種方式計算 Maximum Depth；本課把 Bottom-Up 的高度計算再升級一步：在**同一次**後序走訪（Post-order Traversal）中，一邊算子樹高度、一邊驗證平衡條件，一旦發現失衡就用訊號向上傳遞、提早收工。這個「計算指標＋驗證性質」二合一的手法，就是 Bottom-Up Validation。

## Thinking

最直覺的寫法是先寫一個獨立的 `height()`，再對每個節點檢查 `abs(height(left) - height(right)) <= 1`，並遞迴檢查左右子樹。它為什麼慢？因為 `height()` 每次呼叫都要走訪整棵子樹：深度為 d 的節點會被它的每個祖先重算一次，在鏈狀樹上總工作量是 `1 + 2 + ... + n`，也就是 `O(n^2)`。關鍵觀察是：檢查平衡所需要的高度，正是遞迴算高度時「順路」就能產生的資訊，根本不必分開跑兩趟。於是我們設計一個輔助函式：**若子樹平衡就回傳其高度，若失衡就回傳 -1**。選 -1 當失敗訊號是安全的，因為本課約定空樹高度為 0，任何合法高度都不小於 0，-1 不可能與真實高度撞值。遞迴步驟為：左子樹回 -1 → 立刻回 -1（右子樹連走訪都省了）；右子樹回 -1 → 回 -1；高度差超過 1 → 回 -1；否則回 `max(hl, hr) + 1`。正確性可用歸納法說清楚：空樹平衡、回傳 0；若左右皆非 -1，代表兩側子樹內**每個節點**都已通過檢查，再補上當前節點自己的高度差條件，恰好逐字覆蓋定義的全部條款。

## Pattern Recognition

當題目要求驗證「整棵樹的所有子樹」都滿足某項性質，而該性質又依賴子樹的量化指標（高度、節點數、總和、最大最小值）時，就是 Bottom-Up Validation 的強烈訊號——分開計算指標必然造成重複走訪。此 Pattern 的共通形狀是：後序走訪＋**複合回傳值**，讓遞迴函式同時帶回「指標」與「是否合法」，在單次走訪中完成收集與驗證。同類題型包括：驗證 BST 時回傳子樹的值域範圍、計算樹直徑時順路回傳高度、判斷子樹和性質等。

## Common Mistakes

第一，只檢查根節點的高度差：左右高度相同、但失衡藏在子樹內部的樹會被誤判為平衡，這是漏掉定義中遞迴條款的直接後果。第二，獨立的 `height()` 搭配逐節點檢查：答案正確，但鏈狀樹上退化為 `O(n^2)`。第三，sentinel 撞值：用 0 當失敗訊號，會與「空樹高度為 0」這個合法回傳值衝突，讓合法葉節點被當成錯誤。第四，忘記傳遞訊號：收到子樹的 -1 之後沒有立刻回傳，反而讓 -1 參與 `max(hl, hr) + 1` 的運算——失敗訊號被算式沖掉，整個提早終止機制就失效了。寫完後用一棵「根節點高度差合法、深層失衡」的樹自我測試，最能抓出前述錯誤。

## Complexity

時間複雜度為 O(n)：整棵樹只做一次後序走訪，每個節點恰好被處理一次，失衡時還能提早終止、少走一部分節點。空間複雜度為 O(h)，h 為樹高，來自遞迴呼叫堆疊：偏斜樹最壞為 O(n)，完全平衡時為 O(log n)。

## Digest

Balanced Binary Tree Check 驗證每個節點的左右子樹高度差是否都不超過 1。直覺的 Top-Down 寫法對每個節點重算高度，鏈狀樹上退化為 O(n^2)；Bottom-Up Validation 則在單次後序走訪中同時計算高度與驗證平衡：輔助函式在子樹平衡時回傳高度、失衡時回傳 -1，收到 -1 立刻向上傳遞並跳過剩餘檢查。-1 之所以安全，是因為合法高度必不小於 0，訊號永遠不會與真實高度混淆。這種「指標＋合法性」複合回傳的設計，是各類樹狀性質驗證題的通用骨架。

## TypeScript Tip

用 -1 當 sentinel 可避免額外物件配置，但收到 -1 必須立刻 return，不能讓它流進 `Math.max`。

```typescript
class TreeNode {
  left: TreeNode | null = null;
  right: TreeNode | null = null;
  constructor(public val: number) {}
}
function check(node: TreeNode | null): number {
  if (node === null) return 0;
  const hl = check(node.left);
  if (hl === -1) return -1;
  const hr = check(node.right);
  if (hr === -1) return -1;
  if (Math.abs(hl - hr) > 1) return -1;
  return Math.max(hl, hr) + 1;
}
const root = new TreeNode(1);
root.left = new TreeNode(2);
root.left.left = new TreeNode(3);
root.left.left.left = new TreeNode(4);
if (check(root.left.left) !== 2) throw new Error("height misjudged");
if (check(root) !== -1) throw new Error("subtree -1 must bubble up");
```

## Python Tip

Python 慣用 tuple 回傳 `(是否平衡, 高度)`，展開賦值讓狀態傳遞一目了然；失衡時高度已無意義，回 0 即可。

```python
def check(node) -> tuple[bool, int]:
    if node is None:
        return True, 0
    ok_l, h_l = check(node.left)
    if not ok_l:
        return False, 0
    ok_r, h_r = check(node.right)
    if not ok_r:
        return False, 0
    return abs(h_l - h_r) <= 1, max(h_l, h_r) + 1

class Node:
    def __init__(self, val, left=None, right=None):
        self.val, self.left, self.right = val, left, right

deep = Node(1, Node(2, Node(3, Node(4))), Node(5, Node(6), Node(7)))
assert check(deep)[0] is False, "deep imbalance must propagate"
assert check(Node(1, Node(2, Node(3)), Node(4)))[0] is True
```

## Takeaway

先驗子樹、再驗自己：後序走訪一邊算高度一邊檢查，用 -1 把失衡一路傳回根節點，O(n) 一次完成。

## Tomorrow Preview

明天進入 Same Tree Validation：同步走訪兩棵樹，逐節點比較結構與數值是否完全一致。你會發現它與今天同屬「遞迴驗證」家族——差別在於驗證對象從單棵樹的量化指標，變成兩棵樹之間的結構對應。

## Today's Challenge

- **110** · 驗證整棵樹是否高度平衡，正是 Bottom-Up Validation 的原型題：把高度計算與平衡檢查合併進同一次後序走訪，避免 O(n^2) 的重複運算。
  - Hint: 讓遞迴函式在子樹平衡時回傳高度、失衡時回傳 -1；收到 -1 就立刻向上傳遞，跳過所有剩餘計算。
