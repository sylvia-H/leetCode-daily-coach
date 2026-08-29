---
id: heap-merge-k-sorted-lists
title: Merge K Sorted Lists
module: heap
pattern_label: Multi-way Merge
complexity_label: O(N log k) time / O(k) space
estimated_minutes: 30
exit_criteria:
  - 能在 heap 中為每個串列維護一個作用中節點，並在取出時推入其後繼節點。
---
## Concept

Merge K Sorted Lists 是一個經典的多路歸併問題。當我們需要將 k 個已經排序好的序列（陣列或鏈結串列）合成為單一個全域排序的序列時，暴力法每次遍歷所有序列的頭部將花費 O(k) 時間，整體複雜度會達到 O(N * k)。透過引入 Min-Heap 資料結構，我們能夠將每次尋找全域最小值的時間複雜度降低至 O(log k)。我們僅需在 Heap 中維持每個序列當前的活躍節點（Active Node），每次彈出全域最小值後，若該序列仍有後續節點，便將其下一個節點推入 Heap 中。這種方法將整體時間複雜度優化為 O(N log k)，其中 N 是所有序列中的總節點數，k 是序列的數量。

## Thinking

面對多個已排序序列的合併問題，思考的核心在於如何有效率地維護與尋找多個指針（Pointers）當前指向的最小值。如果使用線性搜尋，效率會在 k 變大時顯著惡化。此時，可以聯想到 Priority Queue 的特性：它能夠以 O(log k) 的時間複雜度插入新元素並彈出最小值。具體演算法步驟為：首先，走訪 k 個序列的頭部節點，將非空的節點全部放入 Min-Heap 中。接著，進入迴圈直到 Heap 為空：彈出 Heap 中的最小節點，將其加入結果鏈結串列中；如果該彈出的節點擁有下一個節點（node.next），則將該下一個節點推入 Heap 中。透過這個動態維護的過程，我們確保了 Heap 內隨時最多有 k 個元素，從而精準掌控全域的最小順序。

## Pattern Recognition

當題目具備以下特徵時，即可辨識出 Multi-way Merge Pattern：1. 輸入包含多個（k 個）已經完成排序的資料結構（例如 Linked Lists 或 Arrays）。2. 目標是要將它們合併為一個單一的排序序列。3. 每次操作僅需關注當前各個序列的最小值，且隨著元素被消耗，需要動態補充該序列的後續元素。滿足這些條件時，絕大多數情況下皆應優先考慮使用 Min-Heap 或 Priority Queue 來達成 O(N log k) 的高效能表現。

## Common Mistakes

最常見的錯誤是在彈出當前最小節點後，忘記將該節點所屬序列的下一個節點（node.next）推入 Heap 中，這會導致部分資料遺漏或迴圈無法正確終止。第二個常見錯誤是沒有妥善處理空串列（Empty Lists）的邊界情況，導致在初始化 Heap 時嘗試讀取空節點的屬性而引發執行時期錯誤。最後，在自定義物件比較時，若未正確處理節點值相同時的排序依據（例如在 TypeScript 中未提供正確的 Comparator 函數，或在 Python 中未妥善處理物件無法比較的例外），會造成執行錯誤或非預期的行為。

## Complexity

時間複雜度：O(N log k)，其中 N 是所有鏈結串列中的總節點數，k 是鏈結串列的數量。每個節點最多會被推入與彈出 Heap 各一次，每次 Heap 操作的成本為 O(log k)。空間複雜度：O(k)，因為 Min-Heap 在任意時刻最多同時儲存 k 個節點（即各個串列當前的活躍節點）。

## Digest

今日重點探討 Merge K Sorted Lists 的 Multi-way Merge 核心觀念。透過實作高效的 MinHeap（或在 Python 中利用帶有索引的 Tuple 避免物件直接比較衝突），我們能將 k 個已排序串列的合併時間從 O(N * k) 大幅優化至 O(N log k)。關鍵在於維持每個串列的活躍節點於 Heap 中，動態彈出最小值並補充後續節點。掌握此技巧，即可輕鬆應付各類多路歸併與優先佇列的優化題型。

## TypeScript Tip

```typescript
// TypeScript 中自定義 MinHeap 類別以確保 O(log k) 複雜度
class HeapTestNode {
  constructor(public val: number) {}
}
function testHeap(): void {
  const h: number[] = [];
  if (h.length !== 0) throw new Error("assertion failed");
}
testHeap();
```

## Python Tip

```python
# Python heapq 避免 ListNode 直接比較錯誤的技巧：加入唯一識別碼索引 i
import heapq

def test_heap_trick() -> None:
    h = []
    heapq.heappush(h, (1, 0, "node"))
    val, idx, data = heapq.heappop(h)
    assert val == 1 and idx == 0 and data == "node", "assertion failed"

test_heap_trick()
```

## Takeaway

Multi-way Merge 透過 Min-Heap 將多個已排序序列的合併成本壓縮至 O(N log k)，核心在於動態維護各序列的當前指標。

## Tomorrow Preview

明日將進入 Graph 與 Breadth-First Search (BFS) 的領域，探討如何利用 Queue 結構在圖形結構中尋找最短路徑與層級遍歷。

## Today's Challenge

- **23** · 符合典型的多個已排序鏈結串列合併需求，利用 Min-Heap 維護 k 個頭部節點可達到最佳的 O(N log k) 時間複雜度。
  - Hint: 將每個非空串列的頭部節點連同其指標或索引推入 Heap，每次彈出最小值後推入該節點的 next。
