---
id: sliding-window-permutation-in-string
title: Permutation in String (Exact Frequency Match)
module: sliding-window
pattern_label: Fixed/Variable Window + Frequency Comparison
complexity_label: O(n) / O(1)
estimated_minutes: 20
exit_criteria:
  - 能為目標 pattern 與滑動視窗分別初始化頻率陣列。
  - 能透過追蹤已匹配的字元數，在 O(1) 時間內有效率地比較頻率結構。
---
## Concept

Permutation in String 探討的是如何在主字串中尋找子字串的排列組合，亦即 Anagram。當我們面對這類需要檢查某個固定長度字串的所有字元頻率是否完全吻合時，最直覺的想法是逐一檢查每一個視窗。然而，暴力法會導致重複計算頻率。透過維護一個固定大小的 Sliding Window，我們可以藉由進入視窗與離開視窗的邊界字元更新，將頻率比較的複雜度從每個視窗都重新計算的 O(n * k) 降至整體的 O(n)。這種 Exact Frequency Match 的核心在於利用固定長度的陣列或雜湊表來追蹤目前視窗內的字元狀態，並透過增量更新來實現高效能的比對。

## Thinking

在思考 Permutation in String 這類問題時，首要任務是釐清題目要求的子字串長度是固定的。既然 s1 的排列組合意味著長度必須完全等於 s1 的長度，這自然引導出 Fixed Size Sliding Window 的思維模型。我們可以建立一個大小為 26 的頻率陣列來記錄 s1 中各字元的出現次數，同時維護另一個大小同為 26 的頻率陣列來記錄 s2 中當前滑動視窗內的字元分佈。每當視窗向右滑動一格，左側移出視窗的字元頻率減一，右側新加入視窗的字元頻率加一。與其每次都費時比對整個長度為 26 的陣列，不如維護一個變數來追蹤已經完全匹配的字元數量（Matched Count），當該變數等於特定條件時即可判定找到解。

## Pattern Recognition

當題目要求在一個字串中尋找另一個字串的 Permutation、Anagram 或 Substring Match，且字串長度固定時，應立即聯想至 Fixed Size Sliding Window 結合 Frequency Comparison 的 Pattern。辨識線索包括：第一，尋找的目標是集合的排列而非特定順序的連續子字串；第二，子字串的長度被嚴格限制為目標字串的長度。此時，利用陣列進行 O(1) 的頻率狀態更新與比對便成為最佳解法。

## Common Mistakes

最常見的盲點與效能瓶頸在於每一次滑動視窗時，都使用迴圈去完整比較兩個大小為 26 的頻率陣列是否相等，這會使總時間複雜度退化為 O(26 * n)，雖然在大 O 表記法中仍是 O(n)，但在常數時間上會大幅落後。另一個常見錯誤是沒有妥善處理視窗邊界的增減邏輯，導致當字元頻率剛好跨越匹配閾值時，匹配計算器（Match Counter）未能正確加總或扣除，進而造成漏掉正確的 Anagram 或產生誤判。

## Complexity

時間複雜度為 O(n)，其中 n 為主字串 s2 的長度。因為我們僅需走訪 s2 一次，且每次視窗滑動的更新操作均為常數時間 O(1)。空間複雜度為 O(1)，因為英文字母總數固定為 26 個，頻率陣列的大小為常數級別，不隨輸入字串長度增長。

## Digest

今日重點聚焦於 Permutation in String（LeetCode 567）。我們探討了如何運用 Fixed Size Sliding Window 搭配頻率陣列，在 O(n) 時間內高效檢查子字串排列組合。核心技巧在於使用匹配計數器（Match Counter）來避免每次滑動時重新掃描整個 26 字元頻率陣列，從而實現 O(1) 的狀態轉移。無論在 TypeScript 或 Python 中，善用數值陣列與字元碼轉換（charCodeAt / ord）均能帶來極佳的執行效能。

## TypeScript Tip

在 TypeScript 中處理英文字母頻率時，使用 `Int32Array(26)` 不僅記憶體配置緊湊，效能也優於一般 JavaScript Object 或 Map。透過 `charCodeAt(i) - 97` 可以將字元快速對應至 0 到 25 的索引。程式碼示範：
```typescript
const freq = new Int32Array(26);
const charCode = "a".charCodeAt(0);
freq[charCode - 97]++;
if (freq[0] !== 1) throw new Error("Failed");
```

## Python Tip

在 Python 中，雖然可用 `collections.Counter` 簡化程式碼，但在高效能場景下，使用長度為 26 的串列配合 `ord()` 函數更能精準控制運算開銷。程式碼示範：
```python
freq = [0] * 26
idx = ord('a') - ord('a')
freq[idx] += 1
assert freq[0] == 1, "Failed"
```

## Takeaway

掌握固定視窗與頻率陣列的增量比對，能將字串排列檢索優化至線性時間 O(n)。

## Tomorrow Preview

明天我們將進一步探討當視窗大小不再固定、轉為 Variable Size Sliding Window 時的經典題型：Longest Substring Without Repeating Characters。我們將學習如何動態調整視窗邊界，並處理重複字元的剔除機制。

## Today's Challenge

- **567** · 本題要求檢查 s2 中是否存在 s1 的任一排列組合子字串，完美符合固定長度視窗與字元頻率精確匹配的 Pattern。
  - Hint: 維持一個大小等於 s1 長度的滑動視窗，並以匹配計數器追蹤 26 個字母的頻率吻合狀態。
