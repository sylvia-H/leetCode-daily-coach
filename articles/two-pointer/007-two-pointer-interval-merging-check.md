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

Interval Overlap Detection 與 Interval Merging 是一種常見的資料處理與排序應用。當面對多個連續或重疊的時間區間、會議室預約或數字範圍時，暴力比對的時間複雜度高達 O(n^2)。透過「先排序起點、再線性掃描」的策略，我們能將複雜度降低至 O(n log n)。核心精神在於將所有區間按照起點（Start Time）由小到大排序，接著依序走訪每一個區間。在走訪過程中，維護一個當前正在合併的區間（Current Interval），只要下一個區間的起點小於或等於當前區間的終點（End Time），就代表兩個區間發生重疊，此時透過更新當前區間的終點來完成合併；若沒有重疊，則將當前區間推入結果集並切換至下一個區間。這種模式廣泛應用於行事曆管理、資源配置以及計算覆蓋範圍的題目中。

## Thinking

在著手處理區間重疊或合併問題時，第一步通常不是盲目地進行雙迴圈比對，而是思考「排序」帶來的優勢。如果區間是雜亂無章的，我們很難在 O(n) 的時間內判斷某個區間是否與前面的所有區間重疊。因此，第一步絕對是根據每個區間的起點進行升冪排序。排序完成後，區間的相對關係變得清晰：我們只需要關心相鄰的兩個區間。在實作上，我們可以建立一個堆疊或結果陣列（Result Array）。初始化時，將排序後的第一個區間放入結果集。接著迭代剩餘的區間，每次取出結果集的最後一個區間（Tail）與當前遍歷到的區間進行比較。如果 Tail 的終點大於或等於當前區間的起點，代表發生重疊，此時更新 Tail 的終點為兩者終點的最大值；否則，代表沒有重疊，直接將當前區間加入結果集。這種思維確保了我們只需要單向掃描一次陣列，時間效率極高。

## Pattern Recognition

當題目具備以下特徵時，即可強烈懷疑適用 Two Pointers 與 Linear Scan 搭配排序的 Pattern：第一，輸入資料為一組或多組區間（Intervals），每個區間包含起點與終點（例如 [start, end]）。第二，題目要求合併重疊區間、計算總覆蓋長度、尋找空閒時間，或是判斷是否存在任何衝突。第三，區間在原始輸入中通常未經過排序。識別出這些特徵後，第一步即為確立排序機制。常見的變體包含：要求返回合併後的區間、要求插入新區間並合併、或是找出區間交集。掌握「排序起點 + 維護末端指標」這個核心架構，即可輕鬆應對絕大多數的區間類題目。

## Common Mistakes

開發者在實作區間合併時最常犯的錯誤，是忽略了「排序」這個前置步驟，直接進行線性掃描，導致漏掉非連續但實際上重疊的區間。第二個常見錯誤在於更新終點時寫錯邏輯，僅僅將終點設為下一個區間的終點，而沒有考慮當前區間可能完全包覆下一個區間的情況，正確的做法應該是取兩者終點的最大值（Math.max）。第三個錯誤發生在型別處理上，當區間邊界值可能為負數或極大值時，排序的比較函式若寫得不夠嚴謹，會導致 JavaScript 預設的字串排序行為，引發非預期的數字排序錯誤。最後，切記在處理邊界條件時，必須妥善處理空陣列的例外狀況，避免存取未定義的陣列元素。

## Complexity

Time Complexity: O(n log n)，主要來自於對所有區間進行排序的時間開銷，後續的線性掃描僅需 O(n) 時間。Space Complexity: O(n) 或 O(log n)，取決於排序演算法所需的額外空間以及存放結果集所需的記憶體空間。

## Digest

本篇介紹了 Interval Overlap Detection 的核心概念與實作模式。透過「先排序、後掃描」的策略，我們能將 O(n^2) 的暴力檢查優化至 O(n log n)。文章詳細拆解了 Thinking 過程、Common Mistakes 以及 TypeScript 與 Python 的實作細節，幫助讀者建立扎實的區間處理能力。

## TypeScript Tip

```typescript
// TypeScript 實作小技巧：利用陣列解構與型別宣告確保區間資料結構清晰
type Interval = [number, number];
function getEnd(interval: Interval): number {
  return interval[1];
}
const testVal: Interval = [1, 5];
if (getEnd(testVal) !== 5) throw new Error("assertion failed");
```

## Python Tip

```python
# Python 實作小技巧：利用 lambda 運算子精準指定多維度排序的鍵值
intervals = [[2, 3], [1, 4]]
intervals.sort(key=lambda x: (x[0], x[1]))
assert intervals[0] == [1, 4], "assertion failed"
```

## TypeScript Corner

```typescript
function merge(intervals: number[][]): number[][] {
  if (intervals.length === 0) return [];
  intervals.sort((a, b) => a[0] - b[0]);
  const merged: number[][] = [intervals[0]];
  for (let i = 1; i < intervals.length; i++) {
    const currentInterval = intervals[i];
    const lastMerged = merged[merged.length - 1];
    if (currentInterval[0] <= lastMerged[1]) {
      lastMerged[1] = Math.max(lastMerged[1], currentInterval[1]);
    } else {
      merged.push(currentInterval);
    }
  }
  return merged;
}
const output = merge([[1, 3], [2, 6], [8, 10], [15, 18]]);
if (output.length !== 3) throw new Error("assertion failed");
if (output[0][0] !== 1 || output[0][1] !== 6) throw new Error("assertion failed");
```

## Python Corner

```python
def merge(intervals: list[list[int]]) -> list[list[int]]:
    if not intervals:
        return []
    intervals.sort(key=lambda x: x[0])
    merged = [intervals[0]]
    for current in intervals[1:]:
        last_merged = merged[-1]
        if current[0] <= last_merged[1]:
            last_merged[1] = max(last_merged[1], current[1])
        else:
            merged.append(current)
    return merged

output = merge([[1, 3], [2, 6], [8, 10], [15, 18]])
assert len(output) == 3, "assertion failed"
assert output[0] == [1, 6], "assertion failed"
```

## Takeaway

區間重疊問題的關鍵在於排序起點與維護末端指標，善用此 Pattern 可將複雜度降至 O(n log n)。

## Tomorrow Preview

明天我們將探討 Two Pointers 在字串與陣列滑動視窗（Sliding Window）中的進階應用，學習如何動態調整視窗大小以解決字串匹配與子陣列最佳化問題。

## Today's Challenge

- **56** · 本題為區間合併的經典範例，完美對應先排序起點再進行線性掃描與條件合併的 Two Pointers Pattern。
  - Hint: 先依據每個區間的起點進行升冪排序，並使用一個變數追蹤當前合併區間的終點最大值。
