---
id: graph-topological-sort-bfs-kahns
title: Graph Topological Sort BFS (Kahn's Algorithm)
module: graph
pattern_label: Kahn's Algorithm
complexity_label: O(V + E) / O(V)
estimated_minutes: 15
exit_criteria:
  - >-
    Calculate in-degrees for all nodes, enqueue 0-in-degree nodes, and process
    level by level.
---
## Concept

Topological Sort 是一種針對有向無環圖 Directed Acyclic Graph (DAG) 的線性排序演算法，使得對於每一條有向邊從節點 u 到節點 v，u 在排序中都出現在 v 之前。Kahn's Algorithm 透過重複尋找入度 in-degree 為 0 的節點並將其從圖中移除來實現 Topological Sort。此演算法的核心在於維護每個節點的入度，並利用佇列 Queue 收集所有入度為 0 的節點，逐步擴展至其相鄰節點，同時將相鄰節點的入度減 1。若最終處理的節點數量等於圖中節點總數，則代表圖中無環，排序成功；反之，若存在無法被處理的節點，則代表圖中含有環，無法進行 Topological Sort。

## Thinking

在處理有向圖的依賴關係問題時，若需要確定一個合法的執行順序，通常會聯想到 Topological Sort。使用 Kahn's Algorithm 的思考流程如下：首先，必須建立圖的鄰接表 Adjacency List，同時計算每個節點的入度 In-degree。接著，將所有入度為 0 的節點放入 Queue 中，因為這些節點沒有任何前置依賴，可以優先執行。然後，進入迴圈從 Queue 中彈出節點，將該節點計入已處理的數量，並走訪其所有鄰居節點。對於每個鄰居節點，將其入度減 1，代表解除了該前置依賴。如果在減掉 1 之後，該鄰居節點的入度變為 0，則表示其所有前置依賴皆已解決，隨即將其加入 Queue 中。最後，比較處理過的節點總數與圖中節點總數是否相等，若相等則回傳排序結果，若不等則代表圖中存在環，應回傳空陣列或 false。

## Pattern Recognition

辨識是否應該使用 Kahn's Algorithm 的關鍵線索在於：題目牽涉到有向圖 Directed Graph、節點之間存在明確的依賴關係 Dependencies、需要找出合法的處理順序，或者需要偵測圖中是否存在環 Cycle。常見的應用場景包括課程先修要求、工作排程、編譯順序等。當題目的核心在於「必須先完成 A 才能進行 B」時，這正是 Topological Sort 的典型特徵，而 Kahn's Algorithm 提供了直觀且有效率的 BFS 實作方式。

## Common Mistakes

實作 Kahn's Algorithm 時最常見的錯誤包含：第一，未正確建構鄰接表與計算初始入度，導致部分邊的依賴關係被遺漏。第二，在處理入度減 1 時，忘記檢查減完後是否剛好等於 0，導致入度為 0 的節點無法被推入 Queue 中。第三，忽略了環的檢測，當圖中存在環時，部分節點的入度永遠無法歸零，導致處理的節點總數小於節點總數，若未加檢查會陷入死循環或給出錯誤答案。第四，在 LeetCode 207 等題目中，誤用 throw new Error(

## Complexity

時間複雜度為 O(V + E)，其中 V 代表頂點數量 Vertices，E 代表邊的數量 Edges。在演算法開始時，需遍歷所有邊來建立鄰接表與計算入度，花費 O(V + E) 時間。在 BFS 迴圈中，每個節點與每條邊皆會被訪問剛好一次，因此遍歷過程也是 O(V + E)。空間複雜度方面，鄰接表需要 O(V + E) 空間來儲存圖結構，入度陣列與 Queue 在最壞情況下需要 O(V) 空間來儲存所有節點。整體空間複雜度精確描述為 O(V + E)。

## Digest

今日重點聚焦於圖論中的 Topological Sort 與 Kahn's Algorithm。透過維護節點的 In-degree 與 Queue，我們能夠以 BFS 的方式逐層剝離沒有依賴的節點。此演算法不僅能產出合法的線性順序，還能精準檢測有向圖中是否存在環。掌握這項技巧，能輕鬆應對各類依賴關係排程問題。

## TypeScript Tip

在 TypeScript 中使用陣列模擬 Queue 時，若資料規模較大，頻繁使用 shift() 會導致 O(N^2) 的效能瓶頸。最佳做法是維護一個 pointer (head index) 來讀取元素，如上述實作範例所示，維持 O(N) 的高效能。
```typescript
function testQueueEfficiency(): void {
  const queue: number[] = [1, 2, 3];
  let head = 0;
  const val = queue[head++];
  if (val !== 1) throw new Error("Queue head error");
}
testQueueEfficiency();
```

## Python Tip

在 Python 中，千萬不要使用 list 的 pop(0) 來實作 Queue，因為這會觸發全體元素搬移，時間複雜度為 O(N)。務必使用 collections.deque，其底層實作為雙向鏈結串列，popleft() 確保 O(1) 時間複雜度。
```python
from collections import deque

def test_deque() -> None:
    d = deque([1, 2, 3])
    assert d.popleft() == 1, "Deque popleft error"

test_deque()
```

## Takeaway

Kahn's Algorithm 透過 BFS、In-degree 與 Queue 解決有向圖的依賴排序與環檢測問題，時間複雜度 O(V + E)。

## Tomorrow Preview

明天我們將探討 Topological Sort 的另一種實作方法：使用 Depth-First Search (DFS) 搭配狀態記錄來檢測環並完成排序。相較於 Kahn's Algorithm 的 BFS 迭代風格，DFS 的遞歸實作展現了不同的思維模式，並在某些特定圖論問題中更具優勢。

## Today's Challenge

- **207** · 題目要求判斷是否能完成所有課程，本質上就是檢查有向圖中是否存在環，完全符合 Kahn's Algorithm 的核心應用場景。
  - Hint: 先將先修關係轉為鄰接表與入度陣列，將所有入度為 0 的課程放入 Queue，模擬依賴解除的過程。
