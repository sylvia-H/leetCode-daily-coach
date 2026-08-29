---
id: queue-circular-buffer
title: Queue Circular Buffer
module: queue
pattern_label: FIFO Queue
complexity_label: O(1) / O(n)
estimated_minutes: 20
exit_criteria:
  - Use modulo arithmetic to wrap around array indices.
  - Distinguish between full and empty states in a circular buffer.
---
## Concept

Queue Circular Buffer 是一種使用固定大小的陣列來實作先進先出（FIFO）資料結構的方法。透過模運算（Modulo Arithmetic），當陣列的指標到達結尾時，會自動循環回到開頭，達成空間重複利用的效果，避免傳統 Queue 在佇列移動時造成的記憶體浪費。

## Thinking

在設計 Circular Buffer 時，核心在於維護兩個指標：head（指向佇列前端）與 tail（指向佇列尾端），以及記錄當前元素數量的 size 或容量 capacity。每次進行入隊（enqueue）或出隊（dequeue）操作時，指標的移動均透過 (index + 1) % capacity 來實現循環遞增。為了區分佇列是完全滿了還是完全空的，通常需要額外維護一個計數器，或者在配置陣列時保留一個空間不使用，以此辨識滿載狀態。

## Pattern Recognition

當題目要求設計一個具有固定最大容量、所有主要操作（如入隊、出隊、取得前後端元素）均需達到 O(1) 時間複雜度，且希望避免頻繁記憶體重新分配（Memory Allocation）時，即可識別並套用 Queue Circular Buffer Pattern。

## Common Mistakes

最常見的錯誤在於處理指標循環時忽略了負數情況，或者在判斷佇列已滿（full）與為空（empty）時產生邊界條件（Off-by-one errors）。例如，僅僅依據 head 與 tail 的數值相等就判定狀態，卻無法區分此時是「完全為空」還是「完全塞滿」，導致資料覆蓋或讀取錯誤。

## Complexity

時間複雜度：所有基本操作（enqueue、dequeue、front、rear、isEmpty、isFull）均為 O(1)。空間複雜度：為 O(n)，其中 n 代表預先分配的固定陣列容量大小。

## Digest

Queue Circular Buffer 透過固定大小的陣列與模運算實現高效的 FIFO 資料結構。本質上利用 (index + 1) % capacity 讓指標循環，完美解決傳統陣列實作 Queue 時前端空間浪費的問題。關鍵在於正確管理 head、tail 與 size，以區分滿載與空載狀態。

## TypeScript Tip

```typescript
function testTsTip(): void {
  const arr: number[] = new Array(3).fill(0);
  if (arr.length !== 3) throw new Error("assertion failed");
}
testTsTip();
```

## Python Tip

```python
def test_py_tip():
    arr = [0] * 3
    assert len(arr) == 3, "assertion failed"
test_py_tip()
```

## Takeaway

掌握模運算進行指標循環，並以 size 變數區分 Circular Buffer 的滿載與空載狀態。

## Tomorrow Preview

明天我們將探討 Monotonic Queue（單調佇列），學習如何在滑動視窗中以 O(1) 均攤時間複雜度尋找最大或最小值。

## Today's Challenge

- **622** · 本題直接要求設計一個固定大小的循環佇列，完全對應 Queue Circular Buffer 的架構與模運算需求。
  - Hint: 可以額外使用一個 size 變數來追蹤目前元素數量，能有效簡化判斷佇列是否為空或已滿的邏輯。
