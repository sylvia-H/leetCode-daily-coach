---
id: two-pointer-interval-merging-check
title: Interval Overlap Detection
module: two-pointer
pattern_label: Two Pointers - Linear Scan & Compare
complexity_label: O(n log n) / O(n)
estimated_minutes: 15
exit_criteria:
  - 能夠根據區間的起點與終點判斷是否有重疊並進行合併
  - 理解排序在區間處理中的關鍵前置作用
---
## Concept

這類問題給你一組區間（會議時段、預約範圍、數線線段），要求合併重疊或偵測衝突。暴力做法是兩兩比對，O(n^2)。這一課延續昨天的策略骨架——**先排序，再單趟掃描**——但排序服務的目的變了：昨天排序是為了讓兩端極值可以貪婪配對，今天依起點由小到大排序，是為了讓**可能重疊的區間必然相鄰**。排序後維護一個「目前合併段」，每個新區間只需要跟它比一次：起點還搆得到目前段的終點就併入，搆不到就把目前段封存、另起新段。一趟走完，所有重疊關係都被收乾淨。

## Thinking

先依 `interval[0]` 升冪排序，把第一個區間設為目前合併段 cur，逐一走訪其餘區間 next：若 `next[0] <= cur[1]`，兩段重疊，更新 `cur[1] = max(cur[1], next[1])`；否則把 cur 推入結果、讓 next 成為新的 cur。有兩個點必須想通。第一，**終點為何取 max 而不是直接覆寫**：next 可能整段被 cur 包住（如 cur = [1, 10]、next = [2, 3]），覆寫會把終點從 10 縮成 3，後面本該併入的區間就被錯判成分離。第二，**封存為何安全**——這是單趟掃描正確性的核心：起點已排序，當 `next[0] > cur[1]` 時，排在 next 後面的每個區間起點都不小於 next 的起點，同樣搆不到 cur 的終點；換句話說，一旦有一個區間跟目前段斷開，之後的所有區間都跟它斷開，cur 可以放心封存，永遠不必回頭。另外注意重疊判斷用 <= 而不是 <：起點恰等於終點的兩段（[1, 4] 與 [4, 5]）首尾相接，合併語意上算重疊，要併成 [1, 5]。

## Pattern Recognition

輸入是一組 [start, end]、題目談重疊／合併／衝突／覆蓋／空檔，而且輸出不要求保持原始順序——這三個訊號指向「依起點排序＋線性掃描」。同一副骨架能接住整族變體：插入新區間後合併、求區間交集、判斷會議是否衝突、算總覆蓋長度，差別只在掃描時維護的狀態。它與相向雙指標是不同的走法：這裡沒有左右夾擠，而是「讀取位置」一路向右、「結果尾端」原地更新——同向的讀寫兩指標。若題目要求答案對應原始輸入順序、或不允許排序，這套就得繞路（例如先記下原索引再排）。

## Common Mistakes

第一，更新終點用覆寫而不是取 max，包含關係一來就錯（前面 [1, 10] 吞 [2, 3] 的例子）。第二，沒排序就前後比對：重疊的區間可能分散在陣列各處，只比相鄰元素會大量漏判。第三，排序比較函式寫錯：對 number[][] 排序必須寫 `(a, b) => a[0] - b[0]`，漏傳比較函式時 JavaScript 會把子陣列轉成字串按字典序排——Three Sum 課看過的陷阱在二維陣列上照樣咬人。第四，邊界的等號：重疊判斷寫成 `next[0] < cur[1]` 會把首尾相接的區間錯判為分離；空輸入也要先擋，避免取用不存在的第一個區間。

## Complexity

時間複雜度 O(n log n)：排序 O(n log n) 主導，後續掃描僅 O(n)。空間複雜度 O(n)：結果串列在最壞情況（所有區間互不重疊）要存下全部 n 段；排序依語言實作另需 O(log n) 到 O(n) 的輔助空間。

## Digest

區間合併的公式：依起點排序 → 第一段當目前合併段 cur → 逐一比對：`next[0] <= cur[1]` 就併入並取 `cur[1] = max(cur[1], next[1])`，否則封存 cur、以 next 另起新段。以 [[2, 6], [8, 10], [1, 3], [15, 18]] 為例：排序成 [[1, 3], [2, 6], [8, 10], [15, 18]]；2 <= 3 併成 [1, 6]；8 > 6 封存、另起 [8, 10]；15 > 10 再封存——結果 [[1, 6], [8, 10], [15, 18]]。封存安全的理由：起點單調不減，一個區間搆不到 cur 的終點，後面的更搆不到。終點更新記得取 max（防包含）、重疊判斷記得用 <=（首尾相接算重疊）。

## TypeScript Tip

排序在複本上做，res 的尾端元素（`res[res.length - 1]`）就是目前合併段，push 即封存。兩個斷言分別在「max 被改成覆寫」與「<= 被改成 <」時失敗，鎖住包含關係與首尾相接兩個易錯點。

```typescript
import assert from "node:assert";

function merge(intervals: number[][]): number[][] {
  const sorted = [...intervals].sort((a, b) => a[0]! - b[0]!);
  const res: number[][] = [];
  for (const cur of sorted) {
    const last = res[res.length - 1];
    if (last && cur[0]! <= last[1]!) last[1] = Math.max(last[1]!, cur[1]!);
    else res.push([...cur]);
  }
  return res;
}

assert.deepStrictEqual(merge([[2, 3], [1, 10], [4, 5]]), [[1, 10]]);
assert.deepStrictEqual(merge([[1, 4], [4, 5], [6, 7]]), [[1, 5], [6, 7]]);
```

## Python Tip

Python 用 `res[-1]` 直接讀寫串列末端，就是「目前合併段」；`sorted(key=lambda x: x[0])` 依起點排序且不改動輸入。斷言與 TypeScript 版鎖住同樣兩個易錯點。

```python
def merge(intervals: list[list[int]]) -> list[list[int]]:
    res: list[list[int]] = []
    for cur in sorted(intervals, key=lambda x: x[0]):
        if res and cur[0] <= res[-1][1]:
            res[-1][1] = max(res[-1][1], cur[1])
        else:
            res.append(cur[:])
    return res

assert merge([[2, 3], [1, 10], [4, 5]]) == [[1, 10]]
assert merge([[1, 4], [4, 5], [6, 7]]) == [[1, 5], [6, 7]]
```

## Takeaway

依起點排序讓重疊必相鄰；終點取 max、封存不回頭——一趟掃描收乾所有重疊。

## Tomorrow Preview

明天把雙指標帶進含退格符號的字串：Backspace String Compare——從字串尾端倒著走，用計數器抵銷 # 的刪除效果，不建 Stack 就能以 O(1) 空間完成比對。

## Today's Challenge

- **56** · 排序讓重疊必相鄰、單趟掃描維護合併段——這題把本課的封存論證與 max 更新完整練一遍。
  - Hint: 依起點排序後維護目前段終點；新區間起點 <= 終點就取 max 併入，否則輸出並另起新段。
