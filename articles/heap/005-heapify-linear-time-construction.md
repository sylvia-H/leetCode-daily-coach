---
id: heapify-linear-time-construction
title: Linear Time Heap Construction (Heapify)
module: heap
pattern_label: Bottom-up Heapify
complexity_label: O(n) time / O(1) space
estimated_minutes: 25
exit_criteria:
  - Can explain why bottom-up heap construction is O(n) instead of O(n log n).
---
## Concept

Linear Time Heap Construction 亦稱為 Heapify，是指將一個任意順序的陣列在 O(n) 的線性時間複雜度內轉換為 Binary Heap 的演算法。傳統上透過迴圈呼叫插入操作建立 Heap 需要 O(n log n) 時間，而 Bottom-up Heapify 透過從最後一個非葉子節點開始倒序執行 Sift-down 操作，巧妙地利用了樹狀結構高度的數學性質，將總工作量降至 O(n)。

## Thinking

在處理需要頻繁取得最大值或最小值的資料集時，經常需要將無序陣列轉換為 Heap。若逐一將元素插入空的 Heap 中，每次插入花費 O(log n)，總體複雜度為 O(n log n)。然而，如果我們觀察完整二元樹的結構會發現，大多數的節點都集中在底層（葉子節點佔了約一半的數量）。葉子節點本身已經是合法的子樹，不需要進行任何調整。因此，我們只需要從最後一個非葉子節點開始，由下往上、由右至左逐一執行 Sift-down（下濾）操作。藉由這種逆向處理，底層節點只需移動較短的距離，而只有少數接近根節點的元素需要下濾較長距離，數學積分證明此總操作次數為線性級別 O(n)。

## Pattern Recognition

當看到需要將一個完整的、已知的靜態陣列轉換為 Heap，且效能要求嚴格限制為線性時間時，應立即聯想到底層至頂層的 Bottom-up Heapify 模式。辨識線索包含：輸入為無序陣列、需要就地（In-place）轉換、且禁止逐一插入的 O(n log n) 實作方式。

## Common Mistakes

最常見的錯誤是從索引 0 開始正向執行 Heapify，誤以為從根節點向下調整可以建立 Heap。這樣做不僅邏輯錯誤，無法正確滿足 Heap 的結構性質，更會破壞時間複雜度的分析基礎。另一個常見錯誤是索引計算錯誤，例如忽略了從最後一個非葉子節點開始遞減，或者在計算左、右子節點索引時未正確考慮陣列的 0-based 與 1-based 差異。

## Complexity

Time Complexity: O(n) 由於絕大多數節點的高度很低，Sift-down 的成本加總起來為等比級數收斂至 O(n)。Space Complexity: O(1) 只需要在原本的陣列上進行原地修改，不需額外配置線性空間。

## Digest

本單元深入探討 Linear Time Heap Construction（Heapify），剖析為何從最後一個非葉子節點出發進行 Bottom-up 逆向 Sift-down 可以將建構時間從 O(n log n) 壓低至 O(n)。我們釐清了從索引 0 開始的正向錯誤觀念，並透過嚴謹的複雜度分析與雙語程式碼實作，確保讀者能掌握原地建構 Heap 的核心技巧，為未來的高效優先佇列演算法打下穩固基礎。

## TypeScript Tip

```typescript
function verifyMaxHeap(arr: number[]): boolean {
  const n = arr.length;
  for (let i = 0; i <= Math.floor(n / 2) - 1; i++) {
    const left = 2 * i + 1;
    const right = 2 * i + 2;
    if (left < n && arr[i] < arr[left]) return false;
    if (right < n && arr[i] < arr[right]) return false;
  }
  return true;
}
const sample = [10, 5, 8, 1, 2];
if (!verifyMaxHeap(sample)) throw new Error("assertion failed");
```

## Python Tip

```python
def verify_max_heap(arr: list[int]) -> bool:
    n = len(arr)
    for i in range(n // 2):
        left = 2 * i + 1
        right = 2 * i + 2
        if left < n and arr[i] < arr[left]:
            return False
        if right < n and arr[i] < arr[right]:
            return False
    return True
sample = [10, 5, 8, 1, 2]
assert verify_max_heap(sample), "assertion failed"
```

## TypeScript Corner

```typescript
function heapify(arr: number[]): number[] {
  const n = arr.length;
  const lastNonLeaf = Math.floor(n / 2) - 1;

  function siftDown(i: number, length: number) {
    let parent = i;
    while (2 * parent + 1 < length) {
      let left = 2 * parent + 1;
      let right = left + 1;
      let largest = parent;

      if (arr[left] > arr[largest]) {
        largest = left;
      }
      if (right < length && arr[right] > arr[largest]) {
        largest = right;
      }
      if (largest === parent) break;

      [arr[parent], arr[largest]] = [arr[largest], arr[parent]];
      parent = largest;
    }
  }

  for (let i = lastNonLeaf; i >= 0; i--) {
    siftDown(i, n);
  }
  return arr;
}

const testArr = [3, 1, 6, 5, 2, 4];
heapify(testArr);
if (testArr[0] !== 6) throw new Error("assertion failed");
```

## Python Corner

```python
def heapify(arr: list[int]) -> list[int]:
    n = len(arr)
    last_non_leaf = n // 2 - 1

    def sift_down(i: int, length: int):
        parent = i
        while 2 * parent + 1 < length:
            left = 2 * parent + 1
            right = left + 1
            largest = parent

            if arr[left] > arr[largest]:
                largest = left
            if right < length and arr[right] > arr[largest]:
                largest = right
            if largest == parent:
                break

            arr[parent], arr[largest] = arr[largest], arr[parent]
            parent = largest

    for i in range(last_non_leaf, -1, -1):
        sift_down(i, n)
    return arr

test_arr = [3, 1, 6, 5, 2, 4]
heapify(test_arr)
assert test_arr[0] == 6, "assertion failed"
```

## Takeaway

掌握由下而上的 Heapify 技巧，從最後一個非葉子節點逆向執行 Sift-down，即可在 O(n) 時間內完成線性堆積建構。

## Tomorrow Preview

明天我們將探討 Heap 結構的高階應用：Merge k Sorted Lists，學習如何運用 Min-heap 有效合併多個已排序的串列，進一步掌握優先佇列在分治與指標維護上的威力。

## Today's Challenge

本篇為觀念課，沒有對應的 LeetCode 練習題。請把時間花在把上面的觀念想透。
