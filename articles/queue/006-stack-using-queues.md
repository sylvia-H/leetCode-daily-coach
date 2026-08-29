---
id: stack-using-queues
title: Implement Stack using Queues
module: queue
pattern_label: Queue-to-Stack Transformation
complexity_label: O(n) push / O(1) pop
estimated_minutes: 15
exit_criteria:
  - Reorder queue elements so the newest element stays at the front.
  - Analyze the time trade-off between costly push vs costly pop.
---
## Concept

Implement Stack using Queues 探討如何僅透過標準的 Queue 介面（即先進先出 FIFO 的資料結構）來模擬 Stack 的行為（即後進先出 LIFO）。由於 Queue 的操作限制在尾端推入（enqueue）與前端彈出（dequeue），我們必須透過策略性的元素重排（Rotation），讓最新加入的元素永遠維持在 Queue 的前端，以達成 Stack 的 pop 與 top 操作。

## Thinking

當我們嘗試用 Queue 實作 Stack 時，核心挑戰在於順序的逆轉。Stack 的特性是最後進入的元素（Newest Element）必須最先被取出。如果我們採用 push 時進行昂貴操作（Costly Push）的策略：每當有新元素加入時，先將其推入 Queue 的尾端，隨後將該新元素之前的所有舊元素依序從前端取出並重新推回尾端（Rotation）。透過這個重排步驟，新加入的元素會被移動到 Queue 的最前端。這樣一來，pop 與 top 操作只需直接對 Queue 的前端進行，時間複雜度便能降為 O(1)。

## Pattern Recognition

當題目要求使用某種資料結構去模擬另一種性質完全相反的資料結構（例如用 Queue 模擬 Stack，或反之），且介面受到嚴格限制時，即為典型的 Queue-to-Stack Transformation 模式。辨識線索在於介面僅能使用 push、pop、top、empty，且底層資料結構缺乏直接存取尾端或支援逆序走訪的能力。此時必須決定要在 push 階段還是 pop 階段付出時間成本來維護順序。

## Common Mistakes

最常見的錯誤是在進行元素旋轉（Rotation）時搞混 Queue 的方向，導致新元素沒有確實移動到最前端，或者在旋轉過程中遺漏了部分元素。另一個常見誤區是誤以為雙向佇列（Deque）的所有雙向操作都可以直接使用，因而違反了題目僅允許使用標準 Queue 介面（push, pop, size, empty）的限制。此外，未能在 push 階段正確計算旋轉次數（例如沒有記錄加入新元素之前的 Queue 大小），導致進入無窮迴圈。

## Complexity

時間複雜度：push 操作為 O(n)，因為每次加入新元素都需要將先前的 n 個元素重新旋轉一遍；pop 操作為 O(1)，top 操作為 O(1)，empty 操作為 O(1)。空間複雜度：O(n)，用以儲存總共 n 個元素。

## Digest

本單元探討如何使用 Queue 模擬 Stack。透過 Queue-to-Stack Transformation，我們學習到在 push 階段進行元素旋轉（Rotation），使最新加入的元素保持在前端。這樣能確保 pop 與 top 的時間複雜度維持在 O(1)。我們同時比較了成本分攤在 push 與 pop 的優劣，並掌握了 TypeScript 與 Python 實作時的細節。

## TypeScript Tip

使用 TypeScript 實作時，陣列的 shift 方法會使後續元素往前搬移，屬於 O(n) 操作。配合我們在 push 時的旋轉，每次推入新元素會進行多次搬移。

```typescript
function verifyQueueSimulation(): void {
  const queue: number[] = [1, 2, 3];
  const shifted = queue.shift();
  if (shifted !== 1) throw new Error("assertion failed");
  if (queue.length !== 2) throw new Error("assertion failed");
}
verifyQueueSimulation();
```

## Python Tip

Python 的 collections.deque 是雙向佇列，其 popleft 與 append 操作均為 O(1)。在實作旋轉時，善用 deque 可以維持高效的資料流向。

```python
from collections import deque

def verify_deque_rotation():
    d = deque([1, 2, 3])
    d.append(d.popleft())
    assert list(d) == [2, 3, 1], "assertion failed"
verify_deque_rotation();
```

## Takeaway

透過 Queue 模擬 Stack 的關鍵在於利用旋轉將新元素置於前端，達成 LIFO 語意。

## Tomorrow Preview

明天我們將探討相反的經典題型：Implement Queue using Stacks。我們將分析如何利用兩個 Stack 的協同運作，實現均攤時間複雜度（Amortized Time Complexity）為 O(1) 的佇列操作。

## Today's Challenge

- **225** · 本題為標準的 Queue-to-Stack 實作題，完美對應利用 Queue 介面模擬 Stack LIFO 行為的轉換模式。
  - Hint: 在每次 push 新元素後，將前面所有的舊元素依序 dequeue 並重新 enqueue 到尾端。
