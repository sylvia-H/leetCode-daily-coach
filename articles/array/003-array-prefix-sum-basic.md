---
id: array-prefix-sum-basic
title: Basic Prefix Sum Construction
module: array
pattern_label: Prefix Sum
complexity_label: O(n) / O(n)
estimated_minutes: 15
exit_criteria:
  - 能獨立推導並實作前綴和的遞迴關係式
  - 理解空間換取時間的概念
---
## Concept

前綴和（Prefix Sum）是「先付一次線性成本，之後每次查詢都吃到常數時間」的預處理技巧。定義前綴和陣列 P，其中 P[i] 代表原陣列 A 從索引 0 累加到 i 的總和。建好 P 之後，任何連續區間的總和都不必重新走訪，只需要兩個前綴相減：區間 [i, j] 的和 = P[j] - P[i-1]。

它為什麼是對的？關鍵在差分性質：P[j] 是 A[0..j] 的總和，P[i-1] 是 A[0..i-1] 的總和，兩者相減時共同的前段 A[0..i-1] 完全抵銷，剩下的恰好就是 A[i..j]，不多也不少。而這一招能成立，是因為加法有反運算（減法）；這個前提之後會再回來檢驗。

實務上前綴和有兩種常見慣例：「對齊式」讓 P 與 A 等長、P[0] = A[0]；「補零式」讓 P 比 A 多一格、P[0] = 0。本課先用對齊式建立直覺，明天的課會示範補零式如何消除邊界分支。兩者只差一個索引位移，數學內容完全相同。

## Thinking

想在一次掃描內算出所有前綴，關鍵是遞迴關係式 P[i] = P[i-1] + A[i]：累加到 i 為止的總和，等於累加到 i-1 為止的總和，再加上新進來的 A[i]。搭配初始條件 P[0] = A[0]，從左往右掃一遍即可完成建表。

為什麼一次掃描就夠？用迴圈不變式論證：進入第 i 輪時，P[0] 到 P[i-1] 都已經是正確的前綴總和。第 i 輪只讀取剛算好的 P[i-1] 與 A[i]，所以算出的 P[i] 也正確，不變式維持到迴圈結束。每個位置只做一次加法，總計 O(n)——這正是把「重複的區間加總」壓縮成「一次性的累積」的空間換時間策略。

反過來看查詢端的邊界：當 i = 0 時公式退化成 P[j] - P[-1]。P[-1] 在語意上是「空前綴的總和」，值應為 0，因此直接回傳 P[j] 即可。這個必須特判的分支，正是明天補零慣例要消除的東西。

## Pattern Recognition

辨識線索有三層。第一，題目出現「連續子陣列的總和」「區間和」等字眼，而且會被問很多次——只查一次的話直接線性走訪就好，前綴和的回本點在重複查詢。第二，資料是靜態的：查詢期間陣列不被修改，預先算好的 P 才不會失效。第三，運算必須可逆：加法、XOR 這類有反運算的操作可以差分；max、min 一旦合併就丟失資訊、無法還原，不能套這個 Pattern。

## Common Mistakes

- 索引對齊錯誤：公式是 P[j] - P[i-1]，不是 P[j] - P[i]；後者會連 A[i] 一起扣掉，讓區間少了最左邊的元素。
- 忘記 i = 0 的邊界：直接代公式會存取 P[-1]。特別小心 Python——負索引是合法語法，p[-1] 會安靜地拿到陣列最後一個元素，錯得無聲無息，比當場丟例外更難察覺。
- 空陣列未處理：n = 0 時連 P[0] = A[0] 都不成立，初始化前要先判空。
- 數值精度：前綴是越加越大的累積量。Python 的 int 不會溢位，但 TypeScript 的 number 超過 Number.MAX_SAFE_INTEGER（約 9e15）後會失去整數精度，累加大量大數時要有這條紅線的意識。
- 用在會頻繁更新的陣列上：改動任何一個 A[k]，P[k] 之後的每一格都跟著失效，每次更新都得 O(n) 重建，反而比直接走訪更慢。

## Complexity

Time Complexity: O(n)（一次線性掃描建表）; Space Complexity: O(n)（額外的前綴和陣列）。建表後每次區間查詢 O(1)；查詢次數越多，預處理成本攤得越薄。

## Digest

前綴和陣列 P[i] 儲存原陣列從索引 0 到 i 的累加總和，靠遞迴關係式 P[i] = P[i-1] + A[i] 一次線性掃描建成。之後任意區間 [i, j] 的總和用差分 P[j] - P[i-1] 在 O(1) 取得——共同前段相減抵銷，留下的正是目標區間。適用前提：資料靜態、查詢頻繁、運算可逆（加法與 XOR 可以，max 與 min 不行）。i = 0 時記得把空前綴視為 0。這是典型的空間換時間：花 O(n) 空間存下累積結果，換掉每次查詢的重複走訪。

## TypeScript Tip

初始化固定長度陣列後，用一個累加變數由左往右填值：既直接對應 P[i] = P[i-1] + A[i]，也避開 noUncheckedIndexedAccess 下讀取 p[i-1] 可能是 undefined 的型別收斂問題。

```typescript
function buildPrefix(a: number[]): number[] {
  const p: number[] = new Array(a.length);
  let acc = 0;
  for (let i = 0; i < a.length; i++) {
    acc += a[i] ?? 0;
    p[i] = acc;
  }
  return p;
}
const p = buildPrefix([2, -1, 3, 5]);
if (p.join() !== "2,1,4,9") throw new Error("assertion failed");
if ((p[3] ?? 0) - (p[0] ?? 0) !== 7) throw new Error("assertion failed");
```

## Python Tip

itertools.accumulate 直接產出前綴序列，一行完成建表。另外記得：Python 的負索引是合法語法，寫 p[i-1] 之前務必先擋掉 i = 0 的情況。

```python
from itertools import accumulate

a = [2, -1, 3, 5]
p = list(accumulate(a))
assert p == [2, 1, 4, 9], "assertion failed"
assert p[3] - p[0] == sum(a[1:4]), "assertion failed"
```

## Takeaway

一次 O(n) 建表換每次 O(1) 區間查詢：P[i] = P[i-1] + A[i] 建表，P[j] - P[i-1] 差分取區間和。

## Tomorrow Preview

明天進入 Range Sum Query Using Prefix Sum：把今天的差分公式包裝成可重複呼叫的查詢介面，並改用「補零式」前綴和，把 L = 0 的邊界分支徹底消除。之後我們還會在 Hash Table 模組回到前綴和，結合雜湊表統計前綴出現頻率，處理「和為 k 的子陣列個數」這類計數問題。

## Today's Challenge

- **1480** · 題目要求的輸出本身就是前綴和陣列，是把 P[i] = P[i-1] + A[i] 從頭到尾實作一次的最純粹練習。
  - Hint: 宣告與原陣列等長的結果陣列，維護一個累加變數，邊掃邊寫入。
- **560** · 用差分觀點改寫條件：某段子陣列的和為 k，等價於兩個前綴相差 k，再配合雜湊表對歷史前綴計數。
  - Hint: 邊掃邊查「目前前綴減 k」出現過幾次並累加答案；空前綴 0 要先放進雜湊表。
