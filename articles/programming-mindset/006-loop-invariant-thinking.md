---
id: loop-invariant-thinking
title: Loop Invariant Thinking
module: programming-mindset
pattern_label: Invariant
complexity_label: O(n) / O(1)
estimated_minutes: 20
exit_criteria:
  - 能說明迴圈開始前、執行中、結束後維持不變的性質
---
## Concept

Loop Invariant Thinking（迴圈不變量思考）是證明與設計正確迴圈的核心方法論。迴圈的本質是透過重複執行的動作，逐步逼近終點。所謂的「不變量」（Invariant）是指一段在迴圈開始前、每一次迭代開始與結束時、以及迴圈結束後都必須保持為真的數學性質或狀態假設。透過明確定義並維持這個性質，我們能夠在不需要全盤追蹤每一次迭代細節的情況下，嚴格證明演算法的正確性。這就像是在進行數學歸納法：先確認初始狀態成立，再證明如果某一步成立則下一步也必然成立，最後結合終止條件得出正確結果。

## Thinking

在面對需要反覆處理資料的演算法時，思考方式不應只是憑直覺寫出 `while` 或 `for` 迴圈然後不斷修改直到測試通過。正確的思考流程應包含四個步驟：第一，定義初始化（Initialization），即在迴圈進入前，不變量是否已經成立？第二，定義維持性（Maintenance），即假設某次迭代前不變量成立，經過迴圈主體的運算後，是否能確保下一次迭代前它依然成立？第三，定義終止性（Termination），即當迴圈結束時，不變量配合終止條件是否剛好推導出我們要的解答？第四，確保進展（Progress），即每一次迭代變數都必須往終止條件推進，避免陷入無限迴圈。

## Pattern Recognition

當需要設計複雜的迴圈結構、雙指標移動、區間縮減（如 Binary Search）、原地陣列修改（如 Two Pointers）、或者排序演算法的分割步驟時，就是應用 Invariant Pattern 的最佳時機。如果你發現自己經常在寫迴圈時搞不清楚邊界條件（Boundary Conditions）該用 `<` 還是 `<=`、指標該從哪裡開始、或者常常寫出 Off-by-one Error，這代表你缺乏清晰的迴圈不變量定義。透過明確寫出「在這個時間點，某個區間保證已經排序完成」或「某個指標左側的所有元素皆小於基準值」，複雜的迴圈邏輯就會變得條理分明。

## Common Mistakes

最常見的錯誤包括：第一，忽略了初始狀態的設定，導致迴圈在第一步就基於錯誤的假設運行；第二，迴圈主體的更新邏輯破壞了不變量，導致每次迭代後狀態發散；第三，混淆了半開區間與閉區間的定義，導致漏掉最後一個元素或發生陣列越界（Index Out of Bounds）；第四，沒有確保迴圈變數有確實向終止條件推進，導致無限迴圈（Infinite Loop）。這些錯誤的根本原因，往往都是在動手寫程式碼前，沒有先用文字或數學式釐清每次迭代前後必須維持的狀態。

## Complexity

時間複雜度：O(n)，其中 n 為資料規模，因為每次迭代都保證有固定的進展，通常線性遍歷整個輸入。空間複雜度：O(1)，因為迴圈不變量通常只需要常數個額外的指標或狀態變數來維持，不隨著資料規模增長。

## Digest

Loop Invariant Thinking 是確保迴圈正確性的理論基石。透過確立初始化、維持性與終止性三個核心支柱，工程師可以擺脫盲目除錯的困境。在 TypeScript 與 Python 的開發中，精準的變數命名與區間定義（如左閉右開或雙閉區間）是落實不變量的關鍵工具。

## TypeScript Tip

```typescript
function findMax(nums: number[]): number {
  if (nums.length === 0) throw new Error("empty array");
  let maxVal = nums[0];
  let i = 1;
  // Invariant: maxVal 為 nums[0...i-1] 中的最大值
  while (i < nums.length) {
    if (nums[i] > maxVal) {
      maxVal = nums[i];
    }
    i++;
  }
  if (maxVal !== 5) throw new Error("assertion failed");
  return maxVal;
}
findMax([1, 5, 3]);
```

## Python Tip

```python
def find_max(nums: list[int]) -> int:
    if not nums:
        raise ValueError("empty array")
    max_val = nums[0]
    i = 1
    # Invariant: max_val 為 nums[0...i-1] 中的最大值
    while i < len(nums):
        if nums[i] > max_val:
            max_val = nums[i]
        i += 1
    assert max_val == 5, "assertion failed"
    return max_val

find_max([1, 5, 3])
```

## Takeaway

迴圈不變量是程式碼正確性的保證。先定義狀態，再設計迴圈，讓每一次迭代都忠實維持不變性質。

## Tomorrow Preview

明天我們將探討如何將迴圈不變量應用於高階的區間搜尋問題，特別是著名的 Binary Search 及其變體，學習如何正確定義左右邊界的不變性。

## Today's Challenge

本篇為觀念課，沒有對應的 LeetCode 練習題。請把時間花在把上面的觀念想透。
