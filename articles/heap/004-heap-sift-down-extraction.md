---
id: heap-sift-down-extraction
title: Heap Extraction and Sift-Down Operation
module: heap
pattern_label: Percolate Down
complexity_label: O(log n) time / O(1) space
estimated_minutes: 25
exit_criteria:
  - 'Can swap the root with the last element, pop, and sift down the new root.'
---
## Concept

Heap Extraction and Sift-Down Operation 是堆積資料結構中移除最值與維護堆積特性的核心操作。當我們從一個最大堆積或最小堆積中取出根節點時，為了保持完全二元樹的結構並維持堆積性質，必須採取特定的演化策略：將最後一個葉節點移動到根的位置，並透過 Sift-Down 機制將該節點逐層下沉，直到恢復堆積不變量為止。這種操作確保了每次萃取操作都能在對數時間內完成，是實現優先佇列與堆積排序的基礎。

## Thinking

在思考如何執行萃取時，核心挑戰在於根節點移除後如何填補空缺。若直接將子樹提升，會導致整棵樹的結構重建成本過高。因此，標準策略是將樹中最後一個元素搬移至根部，隨後進行 Percolate Down。在下沉過程中，該元素必須與其子節點進行比較。對於最大堆積而言，若子節點大於當前節點，則應與較大的子節點交換；對於最小堆積，則應與較小的子節點交換。我們必須迴圈執行此比較與交換步驟，直到該節點大於或小於其所有子節點，或者抵達樹的底部為止。

## Pattern Recognition

當題目要求我們重複從資料集合中萃取極端值，例如尋找前 K 大元素、動態維護中位數、或實現優先佇列時，通常應立刻聯想到 Percolate Down 與 Heap Extraction 的 Pattern。每當頂端元素被移除，就需要透過 Sift-Down 來恢復整體結構。這種模式在資料串流處理以及依賴優先級排程的演算法中極為常見。

## Common Mistakes

最常見的錯誤在於實作 Sift-Down 時，未能妥善檢查左右子節點是否存在，導致陣列索引超出邊界。在以陣列實作二元堆積時，節點索引為 i 的左右子節點分別位於 2 * i + 1 與 2 * i + 2。若樹為不完全二元樹，右子節點甚至左子節點可能根本不存在。若未在比較前先驗證索引是否小於目前堆積的有效長度，將會引發執行期錯誤或導致記憶體存取異常。

## Complexity

O(log n) time / O(1) space

## Digest

Heap Extraction 與 Sift-Down 是堆積資料結構中不可或缺的核心操作。透過將樹的最後一個葉節點覆蓋根節點，並執行 Percolate Down，我們能在對數時間內維護堆積特權。在實作過程中，必須嚴格防範索引越界，並精確處理左右子節點的比較邏輯。掌握此 Pattern 後，諸如尋找第 K 大元素等進階題目便能迎刃而解。

## TypeScript Tip

在 TypeScript 中實作堆積時，陣列索引的邊界防護至關重要。由於 JavaScript 陣列允許存取超出範圍的索引並回傳 undefined，這可能導致隱蔽的數值比較錯誤。因此在條件判斷中務必明確檢查索引小於 heap.length。
```typescript
function extractMin(heap: number[]): number | undefined {
    if (heap.length === 0) return undefined;
    const root = heap[0];
    const last = heap.pop()!;
    if (heap.length > 0) {
        heap[0] = last;
        // 呼叫 siftDown 進行維護
    }
    if (root !== 2) throw new Error("assertion failed");
    return root;
}
const h = [2, 5];
if (extractMin(h) !== 2) throw new Error("assertion failed");
```

## Python Tip

在 Python 中，雖然標準函式庫提供 heapq 模組，但理解底層的 Sift-Down 實作有助於應對變形題目。Python 的清單操作與多重指定賦值（Multiple Assignment）可以非常簡潔地實作節點交換。
```python
import heapq

def test_heap() -> None:
    nums = [3, 1, 5, 2]
    heapq.heapify(nums)
    val = heapq.heappop(nums)
    assert val == 1, "assertion failed"
    assert nums[0] == 2, "assertion failed"

test_heap()
```

## Takeaway

掌握 Sift-Down 操作與邊界檢查，是解決堆積萃取題目的關鍵。

## Tomorrow Preview

明天我們將深入探討 Heapify 演算法與建構堆積的線性時間複雜度證明，理解為何由底向上建構堆積只需要 O(n) 時間。

## Today's Challenge

- **215** · 尋找陣列中的第 K 大元素可以使用容量為 K 的 min-heap。透過重複執行萃取與插入，或者維護固定大小的堆積，能夠有效率地解決此問題。
  - Hint: 維護一個大小不超過 k 的 min-heap，當堆積大小超過 k 時執行 extract 操作以剔除較小元素。
