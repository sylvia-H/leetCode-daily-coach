---
id: heap-array-representation
title: Array Representation of Binary Heap
module: heap
pattern_label: Array-based Tree Indexing
complexity_label: O(1) index access / O(n) space
estimated_minutes: 15
exit_criteria:
  - >-
    Can correctly calculate left child, right child, and parent indices for any
    index i.
---
## Concept

Array Representation of Binary Heap 是一種將完全二元樹（Complete Binary Tree）儲存在一維陣列中的有效資料結構技術。透過數學公式計算節點之間的相對位置，我們不需要使用傳統的指標（Pointer）與節點物件，就能直接在陣列中模擬出樹狀結構。在 0-based indexing 的系統中，給定任意節點的索引值 i，其左子節點的索引為 2i + 1，右子節點的索引為 2i + 2，而其父節點的索引則為數學整數除法 (i - 1) // 2。這種線性化的儲存方式不僅大幅減少了記憶體指標的額外開銷，還能利用陣列的連續記憶體空間提升快取區域性（Cache Locality）。

## Thinking

當我們面對需要頻繁尋找最大值或最小值的動態資料集時，優先佇列（Priority Queue）與 Binary Heap 是核心的實作基礎。思考的起點在於如何以最省時省空間的方式表達一棵動態增長的完全二元樹。我們不需要定義包含 left, right, parent 指標的節點類別，而是觀察完全二元樹從上到下、從左到右的特性，發現它能完美映射到陣列的線性結構中。在實作思考時，首要任務是釐清目前採用的索引系統是 0-based 或是 1-based，因為這會直接影響子節點與父節點的數學計算公式。此外，還必須隨時檢驗邊界條件，例如當索引值 i 等於 0 時代表根節點，它沒有父節點；或者當計算出的子節點索引大於或等於陣列長度時，代表該子節點並不存在，藉此確保程式碼在走訪與維護堆積屬性時不會發生陣列存取越界的錯誤。

## Pattern Recognition

識別這個 Pattern 的關鍵線索在於問題涉及層級結構、父子節點關係，且要求高效的動態插入與最值提取。當題目暗示需要維護動態資料的極值，且資料結構的邏輯形態是一棵完全平衡的二元樹時，就應該立刻聯想到 Array-based Tree Indexing。這種模式常見於 Heapify、Heapsort、Dijkstra 最短路徑演算法的優先佇列實作，以及各類 Top K 問題。透過將樹狀指標轉化為陣列索引運算，程式碼得以維持在 O(1) 的存取時間複雜度與 O(n) 的空間複雜度，同時避免了指標導向資料結構所帶來的記憶體碎片化問題。

## Common Mistakes

最常見的錯誤是混淆了 0-based 與 1-based indexing 的公式。在 0-based indexing 中，左子節點為 2i + 1、右子節點為 2i + 2；但在 1-based indexing 中，左子節點則是 2i、右子節點為 2i + 1，兩者不可混用。另一個常見的錯誤是忽略了邊界條件檢查，導致在尋找葉節點的子節點時發生 Index Out of Bounds 的例外狀況。此外，在進行向上調整（Percolate Up / Bubble Up）或向下調整（Percolate Down / Sinking Down）時，未妥善處理整數除法的向下取整特性，也會導致父節點計算錯誤，破壞整個 Binary Heap 的結構完整性。

## Complexity

時間複雜度方面，透過陣列索引計算父子節點位置的運算為 O(1)。在空間複雜度方面，由於所有節點皆連續儲存於一維陣列中，總體空間複雜度為 O(n)，其中 n 為樹中的節點總數。

## Digest

Array Representation of Binary Heap 是一種利用陣列線性儲存完全二元樹的經典技巧。在 0-based 系統中，父子節點的數學關係為：左子節點 2i + 1、右子節點 2i + 2、父節點 (i - 1) // 2。這種設計消除了指標的記憶體開銷，提供 O(1) 的索引存取與優異的快取效能。

## TypeScript Tip

```typescript
class MinHeap {
  private heap: number[] = [];

  public push(val: number): void {
    this.heap.push(val);
    this.siftUp(this.heap.length - 1);
  }

  private siftUp(i: number): void {
    let parent = Math.floor((i - 1) / 2);
    while (i > 0 && this.heap[i] < this.heap[parent]) {
      [this.heap[i], this.heap[parent]] = [this.heap[parent], this.heap[i]];
      i = parent;
      parent = Math.floor((i - 1) / 2);
    }
  }

  public size(): number {
    return this.heap.length;
  }
}

const mh = new MinHeap();
mh.push(5);
if (mh.size() !== 1) throw new Error("assertion failed");
```

## Python Tip

```python
class MinHeap:
    def __init__(self) -> None:
        self.heap: list[int] = []

    def push(self, val: int) -> None:
        self.heap.append(val)
        self._sift_up(len(self.heap) - 1)

    def _sift_up(self, i: int) -> None:
        parent = (i - 1) // 2
        while i > 0 and self.heap[i] < self.heap[parent]:
            self.heap[i], self.heap[parent] = self.heap[parent], self.heap[i]
            i = parent
            parent = (i - 1) // 2

    def size(self) -> int:
        return len(self.heap)

mh = MinHeap()
mh.push(5)
assert mh.size() == 1, "assertion failed"
```

## TypeScript Corner

```typescript
function getLeftChild(i: number): number {
  return 2 * i + 1;
}

function getRightChild(i: number): number {
  return 2 * i + 2;
}

function getParent(i: number): number {
  return Math.floor((i - 1) / 2);
}

const parentIdx = getParent(2);
if (parentIdx !== 0) throw new Error("assertion failed");
const leftIdx = getLeftChild(0);
if (leftIdx !== 1) throw new Error("assertion failed");
```

## Python Corner

```python
def get_left_child(i: int) -> int:
    return 2 * i + 1

def get_right_child(i: int) -> int:
    return 2 * i + 2

def get_parent(i: int) -> int:
    return (i - 1) // 2

assert get_parent(2) == 0, "assertion failed"
assert get_left_child(0) == 1, "assertion failed"
```

## Takeaway

透過數學公式將樹狀結構映射至一維陣列，以 O(1) 索引存取實現高效能 Heap 操作。

## Tomorrow Preview

明天我們將探討 Heapify 演算法與建構二元學習堆積的完整流程，學習如何在 O(n) 時間內將一個無序陣列轉化為合法的 Binary Heap。

## Today's Challenge

本篇為觀念課，沒有對應的 LeetCode 練習題。請把時間花在把上面的觀念想透。
