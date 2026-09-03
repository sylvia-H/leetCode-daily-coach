---
id: tree-maximum-depth-bottom-up
title: Maximum Depth of Binary Tree (Bottom-Up)
module: tree
pattern_label: Bottom-Up DFS
complexity_label: O(n) / O(h)
estimated_minutes: 20
exit_criteria:
  - 能回傳左右子樹深度的最大值加 1。
---
## Concept

求二元樹最大深度是 Bottom-Up DFS 的入門題。這一題你在先前的 Queue BFS 層序走訪已經解過一次——當時是靠佇列逐層向外擴散、數外層迴圈跑了幾輪；本課換成遞迴在回溯階段由子樹回傳值向上聚合，同一題目、兩種資料流向。深度定義為「從根節點到最遠葉節點的路徑上的節點數」，而它有一條漂亮的遞迴關係：任一節點的深度等於左右子樹深度較大者加 1，空樹深度為 0。

為什麼成立？根到最遠葉的路徑從當前節點出發後，只能進入其中一側子樹——進入哪側，往下的長度就是那側的深度；取 `max` 同時涵蓋兩種可能，再加上當前節點自己這一層。這正是「全域問題拆成同形子問題、由下而上組合」的思考方式。

## Thinking

先定 base case：`null` 回傳 0。這個 0 不是隨便選的——空樹沒有節點、路徑長為 0；更重要的是它讓葉節點自動得到 `1 + max(0, 0) = 1`，不需要為葉節點另寫特例。接著是遞迴步驟：分別取得左、右子樹的最大深度，回傳 `1 + max(left, right)`。組合邏輯放在兩個遞迴呼叫之後——正是昨天的後序骨架，保證彙整時左右結果已經就緒。

正確性用結構歸納說清楚：空樹正確；假設左右子樹回傳的深度都正確，「較深一側加 1」恰好是以當前節點為根的子樹深度；於是每一層都正確，一路歸納到整棵樹。

## Pattern Recognition

當一個全樹屬性能寫成「左右子樹同名屬性的組合」時，就是 Bottom-Up DFS：深度是 `1 + max(left, right)`，節點數是 `1 + left + right`，之後的平衡檢查、樹比較都套同一骨架。辨識線索：子問題與原問題同形、父節點必須等子節點的回傳值才能作答、答案在回溯階段成形。

## Common Mistakes

第一，base case 回傳 1 而非 0——整棵樹會多算一層，空樹也會錯回 1。第二，為葉節點另寫「回傳 1」的特判——特判本身多餘，更危險的是它常伴隨漏掉 `null` 檢查，遇到只有單側子節點的節點時，就會對 `null` 存取欄位而出錯。第三，把左右深度相加——那是把兩條不同路徑的長度疊在一起，只有取 `max` 符合「單一路徑」的定義。第四，混用兩種風格：bottom-up 靠回傳值組合，若同時又用全域變數累加深度，資料流混亂、難以驗證；想用累加器，明天的 top-down 寫法才是它的位置。

## Complexity

時間複雜度 O(n)：n 為節點總數，每個節點恰被造訪一次、每次組合為常數時間。空間複雜度 O(h)：h 為樹高，對應遞迴呼叫堆疊的最大深度；平衡樹為 O(log n)，最壞的斜樹退化為 O(n)。

## Digest

最大深度的遞迴式：`depth(node) = 1 + max(depth(left), depth(right))`，`null` 回傳 0。取 `max` 是因為根到最遠葉的路徑只能落在較深的一側；加 1 是把當前節點自己算進路徑；`null` 回傳 0 讓葉節點自然得 1、免寫特例。正確性由結構歸納保證：子樹正確則父節點正確。這是 bottom-up DFS 最小而完整的範例，之後的平衡檢查與樹比較都沿用同一骨架。時間 O(n)、空間 O(h)（最壞斜樹 O(n)）。

## TypeScript Tip

函式保持純粹：不碰全域狀態，同一輸入永遠同一輸出，邊界直接可驗：

```typescript
import assert from "node:assert";

class TreeNode {
  constructor(
    public val: number,
    public left: TreeNode | null = null,
    public right: TreeNode | null = null,
  ) {}
}

function maxDepth(root: TreeNode | null): number {
  if (!root) return 0;
  return Math.max(maxDepth(root.left), maxDepth(root.right)) + 1;
}

const skew = new TreeNode(1, null, new TreeNode(2, null, new TreeNode(3)));
const branch = new TreeNode(1, new TreeNode(2, new TreeNode(4)), new TreeNode(3));
assert.strictEqual(maxDepth(skew), 3);
assert.strictEqual(maxDepth(branch), 3);
assert.strictEqual(maxDepth(null), 0);
```

## Python Tip

內建 `max()` 搭配明確的 base case，一行組合就完成聚合：

```python
class TreeNode:
    def __init__(self, val=0, left=None, right=None):
        self.val = val
        self.left = left
        self.right = right

def max_depth(root) -> int:
    if root is None:
        return 0
    return max(max_depth(root.left), max_depth(root.right)) + 1

t = TreeNode(3, TreeNode(9), TreeNode(20, TreeNode(15), TreeNode(7)))
assert max_depth(t) == 3
assert max_depth(None) == 0
```

## Takeaway

最大深度 = `1 + max(左深, 右深)`，`null` 回傳 0；後序保證組合時子樹結果已就緒。

## Tomorrow Preview

明天看同一問題的 Top-Down 解法：把「目前深度」當參數向下傳、在葉節點更新答案，與今天的 bottom-up 對照兩種資料流向；接下來的平衡樹檢查與 Same Tree 驗證也會沿用今天的骨架。

## Today's Challenge

- **104** · 遞迴式 `1 + max(left, right)` 的最直接練習：一行組合邏輯就能完整走過 bottom-up 聚合的流程。
  - Hint: `null` 回傳 0 即可讓葉節點自然得到 1，不需要為葉節點寫特例。
