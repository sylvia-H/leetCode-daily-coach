---
id: heap-task-scheduler
title: Task Scheduler with Cooldown
module: heap
pattern_label: Greedy Frequency Heap
complexity_label: O(n log k) time / O(k) space
estimated_minutes: 30
exit_criteria:
  - >-
    Can greedily process the most frequent available tasks while respecting
    cooling timers.
---
## Concept

Task Scheduler with Cooldown 旨在處理帶有冷卻時間限制的任務排程問題。當多個任務具有各自的執行頻率，且相同的任務之間必須間隔一段固定的冷卻週期才能再次執行時，Greedy Frequency Heap 成為最佳的解題策略。透過維護一個最大堆積來追蹤剩餘次數最多的任務，並結合一個儲存冷卻中任務與可用時間點的佇列，我們能夠在每個時間單位做出局部的最佳選擇，從而最小化整體的閒置時間。

## Thinking

在處理這類排程問題時，直覺上我們需要優先處理那些出現頻率最高、且種類最多的任務，因為它們最容易成為瓶頸並導致系統閒置。因此，我們首先統計每個任務的出現次數，並將其放入一個 max-heap 中。在每個時間步驟中，我們從 heap 中取出頻率最高的任務進行執行。執行後，該任務的剩餘次數減少，但由於冷卻時間的限制，它不能立即被再次執行。此時，我們不能直接丟棄它，而是需要將它連同「何時可以再次執行」的時間戳記（當前時間加上冷卻期）一同放入一個 FIFO 的冷卻佇列中。隨著時間的推進，當佇列中的任務冷卻期滿時，我們再將其重新放回 heap 中參與後續的排程競賽。

## Pattern Recognition

當題目具備以下特徵時，應立即聯想至 Greedy Frequency Heap Pattern：第一，任務具有明確的執行頻率或數量限制；第二，相同的任務之間存在必須間隔的冷卻時間（Cooldown Interval）；第三，目標是最小化完成所有任務所需的總時間或總步驟數。這種問題的核心在於局部最佳解的迭代，即「永遠優先處理當前剩餘次數最多的任務」，這正是 Greedy 策略的典型應用場景。

## Common Mistakes

最常見的錯誤在於忘記將冷卻期滿的任務重新放回 max-heap 中，導致程式陷入死循環或漏掉必要的任務執行。另一個常見誤區是誤用簡單的陣列排序來模擬每一秒的狀態，這會導致時間複雜度劣化為 O(N^2) 或更糟。此外，在計算最終總時間時，容易搞錯「實際執行的時間」與「因為冷卻而產生的閒置時間（Idle Time）」之間的數學關係，導致邊界條件出錯。

## Complexity

時間複雜度為 O(n log k)，其中 n 是總任務數量，k 是任務的種類數（即字母表的大小，在此通常為 26）。在最壞情況下，每個任務都需要進出 heap 與 queue 多次，每次操作的時間與樹的高度成對數關係。空間複雜度為 O(k)，因為 max-heap 與冷卻佇列中同時存在的任務種類數不會超過總任務的種類上限 k。

## Digest

Task Scheduler with Cooldown 核心在於結合 Greedy 策略與資料結構。我們使用 max-heap 確保每次都優先執行頻率最高的任務，並透過帶有時間戳記的佇列來管理冷卻中的任務。這種設計能有效減少閒置時間，並將時間複雜度控制在 O(n log k)。掌握此 Pattern 後，面對各類帶有相依性或冷卻限制的資源配置問題將能游刃有餘。

## TypeScript Tip

TypeScript 開發者在處理這類頻率統計與堆積操作時，應注意型別的安全防範。若自行實作 Priority Queue，務必確保比較函數的穩定性。以下為簡化的型別安全模擬範例：

```typescript
function processTasks(tasks: string[]): number {
  const map: Record<string, number> = {};
  for (const t of tasks) {
    map[t] = (map[t] || 0) + 1;
  }
  const values = Object.values(map);
  const maxVal = Math.max(...values);
  if (maxVal <= 0) throw new Error("assertion failed");
  return maxVal;
}
processTasks(["A", "A"]);
```

## Python Tip

Python 的 heapq 預設為 min-heap，因此在處理最大頻率時，必須將計數值取負數（negative values）轉為最小堆積來模擬 max-heap 的行為。以下為標準操作示範：

```python
import heapq


def demo_heap(nums: list[int]) -> int:
    max_heap = [-x for x in nums]
    heapq.heapify(max_heap)
    val = -heapq.heappop(max_heap)
    assert val == 5, "assertion failed"
    return val


demo_heap([1, 3, 5])
```

## TypeScript Corner

在 TypeScript 中，由於標準函式庫未內建 Heap 資料結構，我們通常需要自行實作 Priority Queue 或使用陣列模擬。以下為利用計數與迴圈模擬 Task Scheduler 的完整程式碼，內含斷言以確保正確性。

```typescript
function leastInterval(tasks: string[], n: number): number {
  const freq = new Map<string, number>();
  for (const task of tasks) {
    freq.set(task, (freq.get(task) || 0) + 1);
  }

  const counts = Array.from(freq.values()).sort((a, b) => b - a);
  const maxFreq = counts[0];
  let idleTime = (maxFreq - 1) * n;

  for (let i = 1; i < counts.length; i++) {
    idleTime -= Math.min(maxFreq - 1, counts[i]);
  }

  const result = tasks.length + Math.max(0, idleTime);
  if (result !== 8) throw new Error("assertion failed");
  return result;
}

leastInterval(["A", "A", "A", "B", "B", "B"], 2);
```

## Python Corner

在 Python 中，可以完美結合 heapq 模組與 collections.deque 來實作具備冷卻機制的任務排程器。以下程式碼展示了如何利用 max-heap 與 timestamp queue 模擬任務執行，並包含斷言檢查。

```python
from collections import Counter, deque
import heapq


def leastInterval(tasks: list[str], n: int) -> int:
    count = Counter(tasks)
    maxHeap = [-cnt for cnt in count.values()]
    heapq.heapify(maxHeap)

    time = 0
    q = deque()

    while maxHeap or q:
        time += 1
        if maxHeap:
            cnt = heapq.heappop(maxHeap) + 1
            if cnt != 0:
                q.append((cnt, time + n))
        if q and q[0][1] == time:
            heapq.heappush(maxHeap, q.popleft()[0])

    assert time == 8, "assertion failed"
    return time


leastInterval(["A", "A", "A", "B", "B", "B"], 2)
```

## Takeaway

貪婪策略結合堆積與佇列，是解開冷卻排程問題的唯一金鑰。

## Tomorrow Preview

明天我們將探討 Sliding Window 與 Two Pointers 的進階結合應用，學習如何在動態資料流中維持特定區間的最優性質，敬請期待。

## Today's Challenge

- **621** · 題號 621 正是典型的 Task Scheduler 問題，需要透過 Greedy Frequency Heap 優先處理高頻任務並配合冷卻時間佇列來最小化閒置時間。
  - Hint: 先統計所有任務的出現頻率，並利用負數技巧將 Python 的 min-heap 當作 max-heap 使用。
