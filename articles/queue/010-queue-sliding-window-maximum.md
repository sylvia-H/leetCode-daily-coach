---
id: queue-sliding-window-maximum
title: Sliding Window Maximum with Monotonic Queue
module: queue
pattern_label: Monotonic Queue
complexity_label: O(n) / O(k)
estimated_minutes: 25
exit_criteria:
  - 能從佇列尾端移除比新進元素小的元素。
  - 能從佇列前端移除已滑出 Sliding Window 範圍的元素。
---
## Concept

Sliding Window Maximum 是演算法中的經典問題。當我們需要在大小為 k 的滑動視窗中高效找出最大值時，若使用暴力解法，每次移動視窗需重新掃描 k 個元素，時間複雜度會退化為 O(n * k)。透過 Monotonic Queue（單調佇列），我們可以在 O(n) 的線性時間內維護一個嚴格遞減的佇列，讓每次查詢最大值降至 O(1)。核心精神在於：佇列中不僅儲存數值，更儲存數值的「索引」，並在每次滑動時同步剔除過期的元素與小於當前元素的無效候選者。

## Thinking

思考這個問題時，首先要體會「為什麼普通的 Queue 或 Stack 不夠用」。我們需要的是一個兩端都能操作的資料結構。當遇到一個新元素時，所有小於它的歷史元素在未來都不可能成為最大值，因此可以大膽從佇列的尾端（back）彈出。同時，為了確保視窗大小不超過 k，當佇列前端（front）的索引超出當前視窗範圍（即 i - k >= index）時，必須將其從前端彈出。這樣一來，佇列前端永遠是當前視窗的最大值索引，每次滑動只需進行 O(1) 的常數時間調整。

## Pattern Recognition

當題目要求在一個動態滑動的區間（通常大小固定為 k）內，反覆求取最大值或最小值，且陣列長度很大（如 n = 10^5），暴力解會超時，這就是 Monotonic Queue 的強烈訊號。與一般 Monotonic Stack 用於尋找下一個更大元素不同，Sliding Window 的特性要求資料結構支援從頭部移除超出範圍的元素，因此在 TypeScript 中常使用雙向指標模擬或陣列配合指標，在 Python 中則直接使用 collections.deque。

## Common Mistakes

最常見的錯誤是在佇列中只儲存「數值」而不是「索引」。如果只存數值，當視窗向右滑動時，我們將無法判斷該數值是否已經落在當前視窗範圍之外。另一個常見錯誤是搞混單調佇列的方向：尋找最大值時必須維護「嚴格遞減」的佇列（即新加入的元素會把尾端小於它的元素全部擠掉），若誤建成遞增佇列會導致無法正確取得最大值。

## Complexity

時間複雜度為 O(n)，因為每個元素最多被推入佇列一次、從佇列尾端彈出一次、從前端彈出一次，均攤下來每個元素的操作成本是 O(1)。空間複雜度為 O(k)，因為佇列中最多只會存放當前視窗大小的元素索引。

## Digest

Sliding Window Maximum 透過 Monotonic Queue 在 O(n) 時間內解決。我們在佇列中保持嚴格遞減的索引順序，新元素加入前踢掉尾端較小者，並在前端濾除過期索引，確保每次查詢 O(1)。

## TypeScript Tip

```typescript
// 注意：陣列的 shift() 操作在 JavaScript 中是 O(k)，但在本題中由於每個元素最多被 shift 一次，整體均攤時間仍為 O(n)。
function checkWindow(): void {
  const q: number[] = [0, 1, 2];
  if (q[0] <= 0) q.shift();
  if (q.length !== 2) throw new Error("assertion failed");
}
checkWindow();
```

## Python Tip

```python
from collections import deque
# Python 使用 collections.deque 可以達到 O(1) 的兩端 pop 與 append 操作，是實作 Monotonic Queue 的最佳選擇。
def test_deque():
    d = deque([1, 2, 3])
    d.popleft()
    assert len(d) == 2, "assertion failed"
test_deque()
```

## Takeaway

Monotonic Queue 核心在於存索引、維持嚴格遞減、過期即彈出，將複雜度壓至 O(n)。

## Tomorrow Preview

明天我們將探討 Monotonic Stack 的進階應用，學習如何利用單調堆疊解決柱狀圖中的最大矩形面積問題（Largest Rectangle in Histogram），掌握矩形擴展的邊界判定技巧。

## Today's Challenge

- **239** · 本題為 Monotonic Queue 的教科書級別應用，要求在大小為 k 的滑動視窗中以 O(n) 時間求出每個視窗的最大值。
  - Hint: 佇列中儲存索引，確保對應的數值維持遞減，並在每次迭代檢查前端索引是否已滑出視窗範圍。
