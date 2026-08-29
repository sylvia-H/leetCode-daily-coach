---
id: dfs-recursive-implementation
title: 遞迴式 DFS 實作
module: dfs-bfs
pattern_label: DFS Recursive
complexity_label: O(V + E) / O(V)
estimated_minutes: 15
exit_criteria:
  - 能寫出標準的遞迴式 DFS 結構
  - 理解遞迴基底條件與遞迴呼叫的關係
---
## Concept

遞迴式 DFS (Depth-First Search) 是一種利用程式語言底層的呼叫堆疊 (Call Stack) 來隱式維護走訪狀態的圖形與樹狀結構搜寻策略。其核心精神是一路深入探索直到無路可走，隨後進行回溯 (Backtracking) 以走訪其他分支。在實作上，程式碼會進入當前節點、標記其為已造訪、並對所有未造訪的相鄰節點或子節點遞迴呼叫自身。這種寫法邏輯直觀，能自然地將複雜結構的走訪轉換為函式堆疊的壓入與彈出。

## Thinking

在著手設計遞迴式 DFS 時，必須遵循三個核心思考步驟：第一，明確定義遞迴函式的參數與返回值，通常參數包含當前處理的節點、狀態容器或圖形結構；第二，設定明確的遞迴基底條件 (Base Case)，例如當節點為空、超出邊界或已經被造訪過時應立即終止，防止無限遞迴；第三，在函式主體中處理當前節點的邏輯，並迴圈走訪所有鄰居，若鄰居未被造訪則遞迴呼叫函式。透過這樣的分治與遞進思維，便能完整遍歷整張圖或整棵樹。

## Pattern Recognition

當題目要求尋找從根到葉的路徑、探索所有相連的群組、計算樹的高度或深度、或是進行窮舉與狀態空間搜尋時，通常具備明顯的 DFS 遞迴特徵。特別是當問題結構本身定義為自我相似（例如二元樹的左右子樹亦為二元樹），或是需要深入到底部再處理回傳值的場景，遞迴式 DFS 往往是最自然且精簡的解法。

## Common Mistakes

最常見的錯誤是遺漏遞迴基底條件 (Base Case)，導致函式不斷自我呼叫而引發堆疊溢位 (Stack Overflow)。其次是沒有正確記錄或檢查已造訪的節點 (Visited State)，在含有環路的圖形結構中造成無限迴圈。此外，未能在遞迴呼叫後正確復原狀態（在需要回溯的演算法中），或是在全域變數與區域變數的生命週期管理上發生混淆，亦是開發者常犯的錯誤。

## Complexity

時間複雜度為 O(V + E)，其中 V 代表頂點 (Vertices) 數量，E 代表邊 (Edges) 數量，每個頂點與邊在最壞情況下皆會被走訪一次；空間複雜度為 O(V)，主要取決於遞迴呼叫堆疊的最大深度，在最深鏈狀圖的情況下可能達到 O(V)。

## Digest

本單元深入探討遞迴式 DFS 的核心原理與實作技巧。遞迴式 DFS 藉由程式語言內建的呼叫堆疊隱式追蹤走訪歷程，非常適合處理具備遞迴性質的資料結構如二元樹與圖。在設計時，必須嚴格定義基底條件與已造訪狀態的記錄，以防範無限遞迴。我們同時分析了 TypeScript 與 Python 在遞迴深度上的硬體與語言限制，並透過經典的二元樹與圖論題目展示標準程式碼架構。掌握此模式能為後續的圖論與回溯演算法打下穩固基礎。

## TypeScript Tip

```typescript
function maxDepth(root: { val: number; left: any; right: any } | null): number {
  if (root === null) return 0;
  const leftDepth = maxDepth(root.left);
  const rightDepth = maxDepth(root.right);
  return Math.max(leftDepth, rightDepth) + 1;
}
const tree = { val: 1, left: { val: 2, left: null, right: null }, right: null };
if (maxDepth(tree) !== 2) throw new Error("assertion failed");
```

## Python Tip

```python
import sys
sys.setrecursionlimit(2000)

def max_depth(root: dict | None) -> int:
    if root is None:
        return 0
    return max(max_depth(root.get("left")), max_depth(root.get("right"))) + 1

tree = {"left": None, "right": None}
assert max_depth(tree) == 1, "assertion failed"
```

## Takeaway

遞迴式 DFS 的精髓在於善用呼叫堆疊與基底條件，編寫時務必確認終止條件與已造訪記錄，防範堆疊溢位。

## Tomorrow Preview

明天的課程將進入迭代式 DFS (Iterative DFS)，探討如何使用顯式的堆疊 (Explicit Stack) 資料結構來模擬遞迴呼叫堆疊，從而避免深層遞迴帶來的 Stack Overflow 風險，並掌握手動管理堆疊狀態的進階技巧。

## Today's Challenge

- **200** · 島嶼數量問題需要從陸地出發，透過遞迴式 DFS 深度探索並標記所有相連的陸地，是驗證圖論走訪能力的核心題型。
  - Hint: 遍歷整個網格，當遇到 '1' 時啟動 DFS，將相鄰的 '1' 遞迴標記為已訪問或修改為 '0'，並累計島嶼數量。
- **104** · 二元樹結構天生具備遞迴定義，透過遞迴式 DFS 走訪左右子樹並計算深度，是學習樹狀結構遞迴的最佳入門題。
  - Hint: 利用遞迴分別計算左子樹與右子樹的最大深度，當前節點的最大深度為兩者較大值加上一。
