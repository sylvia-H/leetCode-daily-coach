---
id: array-linear-scan
title: Array Linear Scan and Traversal
module: array
pattern_label: Linear Scan
complexity_label: O(n) / O(1)
estimated_minutes: 12
exit_criteria:
  - 能寫出安全走訪陣列邊界的迴圈
  - 能正確在走訪過程中累積狀態
---
## Concept

Linear Scan（線性掃描）是用一條迴圈、按索引 0 到 n - 1 的順序，把陣列中每個元素恰好檢查一次的走訪方式。它看似平凡，卻有一個重要的正當性論證：在未排序的陣列上，**任何一個沒被讀過的元素都可能改變答案**——它可能是更大的最大值，也可能讓總和不同。所以凡是「答案取決於所有元素」的問題（總和、最值、計數、建構前綴陣列），至少要把每個元素讀一次，O(n) 不只是線性掃描的成本，更是這類問題的下界。換句話說，線性掃描不是不得已的暴力，而是這些問題的**最佳解**。掃描真正的產出通常不是元素本身，而是走訪過程中**累積的狀態**：一個累加器、一個目前最大值、或一個逐步長出來的結果陣列。

## Thinking

線性掃描的骨架只有三件事：初始化、迭代、收尾。狀態變數必須在迴圈**外**初始化（例如 `sum = 0`），每輪迭代只做一件事——用當前元素更新狀態。它的正確性可以用迴圈不變式（Loop Invariant）說清楚：以累加總和為例，不變式是「第 i 輪迭代開始前，sum 恰等於前 i 個元素之和」。初始時 i = 0、sum = 0，空和成立；每輪把 `arr[i]` 加進 sum，不變式在 i + 1 上繼續成立；迴圈結束時 i = n，不變式直接告訴我們 sum 就是全部 n 個元素之和。邊界條件同樣由不變式決定：條件寫 `i < n`，最後一輪處理的是索引 n - 1，恰好覆蓋整個合法範圍、不多不少。多趟掃描也完全合法：先由左至右算前綴、再由右至左算後綴，兩趟仍是 O(n)——固定趟數不改變複雜度等級。

## Pattern Recognition

看到這些特徵就是線性掃描的主場：一、答案需要看過全部元素才能確定（總和、最值、出現次數、前綴或後綴統計）；二、資料未排序，沒有結構可以讓 Binary Search 這類技巧「跳著看」；三、每個元素的處理只依賴目前累積的狀態，不需要回頭重看。反過來說，若題目要在已排序資料中找目標，或要動態維護一段兩端都會移動的區間，那是 Binary Search、Two Pointers 或 Sliding Window 的守備範圍，硬用單向掃描會做很多不必要的工。

## Common Mistakes

第一是 Off-by-one：條件誤寫成 `i <= n` 會越界存取索引 n；反過來寫成 `i < n - 1` 則漏掉最後一個元素——用不變式檢查「最後處理的索引是誰」就能抓出來。第二是狀態初始化的位置錯誤：把 `sum = 0` 寫進迴圈裡，每輪都被歸零，前面的累積全部作廢。第三是邊掃描邊改變陣列長度：走訪途中刪除元素會讓後方元素前移，索引與內容錯位、甚至跳過元素；需要邊掃邊刪時，改成反向走訪或先標記再處理。第四是忘記空陣列：n = 0 時迴圈一次都不執行，函式直接回傳初始狀態，務必確認初始值本身就是空輸入的正確答案。

## Complexity

時間複雜度為 O(n)：每個元素恰被處理一次，單次處理為 O(1)；即使分成兩、三趟掃描，固定趟數仍是 O(n)。空間複雜度為 O(1)——只用常數個狀態變數；若題目要求建構與輸入等長的結果陣列，該輸出佔 O(n)，慣例上通常不計入額外空間。

## Digest

線性掃描用一條迴圈把陣列每個元素恰好檢查一次：狀態變數在迴圈外初始化，每輪用當前元素更新狀態，正確性由迴圈不變式保證——「第 i 輪開始前，狀態已正確總結前 i 個元素」。當答案取決於所有元素（總和、最值、前綴統計）且資料未排序時，O(n) 是下界，線性掃描就是最佳解而非暴力。多趟掃描（先前綴、後後綴）仍是 O(n)。最常見的坑是 Off-by-one、狀態在迴圈內被歸零，以及邊走訪邊增刪元素造成索引錯位。

## TypeScript Tip

累加掃描的標準寫法：需要索引時用傳統 for 迴圈，`noUncheckedIndexedAccess` 下以 `!` 收斂 `number | undefined`。累加器 acc 在迴圈外初始化，體現「狀態外置、逐元素更新」。

```typescript
import assert from "node:assert";

function runningSum(nums: number[]): number[] {
  const result: number[] = [];
  let acc = 0;
  for (let i = 0; i < nums.length; i++) {
    acc += nums[i]!;
    result.push(acc);
  }
  return result;
}

assert.deepStrictEqual(runningSum([1, 2, 3, 4]), [1, 3, 6, 10]);
assert.deepStrictEqual(runningSum([]), []);
```

## Python Tip

不需要索引時 `for x in nums` 最乾淨，要索引再用 `enumerate`。標準函式庫的 `itertools.accumulate` 正是「掃描＋累積狀態」這個模式的現成抽象。

```python
from itertools import accumulate

def running_sum(nums: list[int]) -> list[int]:
    result, acc = [], 0
    for x in nums:
        acc += x
        result.append(acc)
    return result

assert running_sum([1, 2, 3, 4]) == [1, 3, 6, 10]
assert running_sum([1, 2, 3, 4]) == list(accumulate([1, 2, 3, 4]))
assert running_sum([]) == []
```

## Takeaway

當答案取決於每個元素且資料未排序，O(n) 掃描既是下界也是最佳解：狀態外置、逐元素更新、用不變式驗證邊界。

## Tomorrow Preview

明天進入 Prefix Sum：把「掃描時累積的總和」整個存下來，讓任意區間和的查詢從 O(n) 降到 O(1)——這是線性掃描的第一個重要衍生技巧。

## Today's Challenge

- **1480** · 把「累加器」這個掃描狀態逐格寫進結果陣列：每個位置的值等於前一格的累積和加上當前元素，是線性掃描最純粹的示範。
  - Hint: 維護一個累加變數 acc，每走一格先加上當前元素，再把 acc 寫入結果。
- **1929** · 練習掃描與結果陣列的索引對應：走訪一次原陣列，把每個元素同時寫進結果的第 i 格與第 i + n 格。
  - Hint: 建立長度 2n 的結果陣列，一趟迴圈裡完成 ans[i] 與 ans[i + n] 兩次寫入。
- **238** · 不能用除法時，答案要拆成「左側全部的乘積」乘上「右側全部的乘積」——由左至右、再由右至左各掃一趟，示範多趟線性掃描的組合。
  - Hint: 第一趟把每格填成左側前綴積，第二趟反向走訪，用一個變數滾動維護右側後綴積乘進去。
