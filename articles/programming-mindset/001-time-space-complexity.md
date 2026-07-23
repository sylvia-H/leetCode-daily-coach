<!-- F5 stub fixture Article：F7 內容產線上線後由生成物取代（FR-027、research R8） -->
---
id: time-space-complexity
title: Time & Space Complexity
module: programming-mindset
pattern_label: Complexity Analysis
complexity_label: O(1) → O(n) → O(n^2)
estimated_minutes: 12
exit_criteria:
  - 能說出常見資料結構操作的複雜度
  - 能判斷一段程式碼的時間複雜度
---

## Concept

時間複雜度（Time Complexity）與空間複雜度（Space Complexity）描述的是「輸入規模變大時，程式需要
的計算步驟與額外記憶體會怎麼成長」。我們用 Big-O 記號來抽象掉常數與硬體差異，只關心成長趨勢：
`O(1)` 恆定、`O(n)` 線性、`O(n^2)` 平方成長。

## Thinking

判斷複雜度的核心問題只有一個：「當輸入變成兩倍大，這段程式碼要跑幾倍久？」如果答案是「差不多久」，
那就是 `O(1)`；如果「久兩倍」，那是 `O(n)`；如果「久四倍」，通常代表程式裡藏了雙層迴圈，是 `O(n^2)`。

## Pattern Recognition

看到巢狀迴圈（迴圈裡面又有迴圈）且內層迴圈的次數跟外層一樣受輸入大小影響，就要提高警覺——那通常是
`O(n^2)`。看到「只走訪一次陣列、邊走邊記錄狀態」的寫法，通常可以做到 `O(n)`。

## Common Mistakes

最常見的誤解是把「程式碼行數少」當成「複雜度低」。例如呼叫一次 `sort()` 表面上只有一行，但排序本身是
`O(n log n)`；如果外面又包一層迴圈，整體就變成 `O(n^2 log n)`，而不是 `O(n)`。

## Complexity

本節本身即複雜度分析的入門，之後每個 Pattern 都會回頭標注時間 / 空間複雜度，作為選擇解法的依據。

## Digest

複雜度是「輸入變大時，成本怎麼成長」的度量。`O(1)` 不隨輸入變化、`O(n)` 跟輸入成正比、`O(n^2)`
通常代表巢狀迴圈。之後遇到的每個 Pattern（Two Pointer、Sliding Window……）本質上都是把某段
`O(n^2)` 的暴力解，降到 `O(n)` 或 `O(n log n)`。

## TypeScript Tip

```typescript
// 巢狀迴圈：兩層都跟 n 有關 → O(n^2)
for (let i = 0; i < n; i++) {
  for (let j = 0; j < n; j++) {
    // ...
  }
}
```

## Python Tip

```python
# 單層迴圈：只跟 n 有關 → O(n)
total = 0
for x in nums:
    total += x
```

## TypeScript Corner

```typescript
function sumOfSquares(nums: number[]): number {
  // 單次走訪，額外空間只有一個累加器 → 時間 O(n)、空間 O(1)
  return nums.reduce((total, x) => total + x * x, 0);
}
```

這段文字在程式碼區塊之後，仍屬於 TypeScript Corner 區塊：`reduce` 內部只走訪一次陣列，
所以即使寫法看起來簡潔，複雜度依然是線性。

## Python Corner

```python
def sum_of_squares(nums: list[int]) -> int:
    # 同上：一次走訪，時間 O(n)、空間 O(1)
    return sum(x * x for x in nums)
```

## Takeaway

問自己：「輸入變兩倍，這段程式碼會跑多久？」答案就是複雜度的起點。

## Tomorrow Preview

明天進入 Reading the Problem：在動手寫程式之前，先把題目的輸入 / 輸出 / 限制條件抽取出來。

## Today's Challenge

- **1** · 暖身用：雖然本課不要求動手解題，但可以先想想 Two Sum 的暴力解是 `O(n^2)`，之後會學到
  如何用雜湊表降到 `O(n)`。
  - Hint: 先寫出雙層迴圈的暴力解，數一數它跑了幾次比較。
