---
id: queue-shortest-path-unweighted
title: Queue Shortest Path in Unweighted Graph
module: queue
pattern_label: Breadth-First Search
complexity_label: O(V + E) / O(V)
estimated_minutes: 20
exit_criteria:
  - 能追蹤已走訪節點，避免環與重複計算。
  - 能隨著佇列擴展逐步遞增距離。
---
## Concept

Queue Shortest Path in Unweighted Graph 是圖論與網格搜尋中的經典演算法模式。在邊權值均等（Unweighted）的圖或二維網格中，Breadth-First Search (BFS) 能夠確保首次拜訪某個節點時的路徑即為最短路徑。透過 Queue 結構進行層級擴展（Level-order traversal），配合距離追蹤與訪問標記，我們能夠有效率地計算出從起點到終點的最少步數。

## Thinking

思考最短路徑問題時，首先要辨識問題是否屬於無權重圖或等權重網格。當目標是尋找「最少步數」、「最短距離」或「最快抵達」時，BFS 是最合適的選擇。核心思路為：1. 將起點放入 Queue 中，並標記為已訪問（Visited）。2. 進入迴圈，當 Queue 不為空時，持續彈出當前節點。3. 檢查當前節點是否為目標，若是則返回對應距離。4. 走訪當前節點的所有相鄰節點，若該鄰居尚未被訪問，則標記為已訪問並放入 Queue 中，同時更新其距離。藉由這種逐層向外擴展的特性，可以保證最先抵達目標的路徑長度最短。

## Pattern Recognition

辨識此 Pattern 的關鍵線索在於題目要求尋找最小步數、最短路徑、最少轉換次數，或是涉及網格擴展（如擴散、最短橋樑、最短路徑迷宮等）且邊權值均為 1 的情境。當看見求極值且路徑權值均等時，應優先聯想到使用 Queue 搭配 Breadth-First Search。

## Common Mistakes

最常見的錯誤是在將節點放入 Queue 時，忘記立即標記為已訪問（Visited），導致同一個節點被重複加入 Queue 中，造成無窮迴圈或記憶體溢出。另一個常見錯誤是將「距離」的更新與 Queue 的彈出時機混淆，正確做法應在擴展鄰居節點時記錄其距離，或者在 Queue 中儲存狀態與距離的組合。

## Complexity

時間複雜度為 O(V + E)，其中 V 為節點數量，E 為邊的數量（在網格中則等同於格點數與方向數）；空間複雜度為 O(V)，主要取決於 Queue 的最大容量以及訪問標記結構所佔用的記憶體空間。

## Digest

Queue Shortest Path in Unweighted Graph 是透過 Breadth-First Search (BFS) 在無權重圖或網格中尋找最短路徑的核心模式。1. 原理與優勢：BFS 能夠保證首次訪問節點時即為最短路徑，因為它是以層級（Level-order）向外擴展。2. 狀態管理：使用 Queue 儲存待處理節點，並利用 Set 或布林陣列紀錄已訪問（Visited）節點，防止重複拜訪與死循環。3. 程式碼架構：初始化 Queue 與 Visited，進入 While 迴圈彈出節點，走訪合法鄰居並更新距離後推入 Queue。4. 經典應用：涵蓋二元樹最小深度、網格最短路徑、雙向擴展最短橋樑等題型。

## TypeScript Tip

```typescript
// In TypeScript, use a proper Queue implementation or shift() for small arrays
function bfsQueueExample(): void {
    const queue: number[] = [1];
    const visited = new Set<number>([1]);
    while (queue.length > 0) {
        const current = queue.shift();
        if (current === undefined) break;
        if (current === 1) {
            queue.push(2);
            visited.add(2);
        }
    }
    if (!visited.has(2)) throw new Error("Assertion failed");
}
bfsQueueExample();
```

## Python Tip

```python
# In Python, always use collections.deque for O(1) pops from the left
from collections import deque

def py_deque_example():
    queue = deque([1])
    visited = {1}
    while queue:
        current = queue.popleft()
        if current == 1:
            queue.append(2)
            visited.add(2)
    assert 2 in visited, "Assertion failed"

py_deque_example()
```

## Takeaway

掌握 BFS 與 Queue 搭配 Visited Set 的組合，是解決無權重圖最短路徑與網格最小步數問題的不二法門。

## Tomorrow Preview

明天我們將探討 Dijkstra's Algorithm，當圖中的邊具有不同的權值（Weighted Graph）時，標準的 BFS 將不再適用，我們需要引入 Priority Queue 來處理帶權最短路徑問題。

## Today's Challenge

- **111** · 尋找二元樹的最小深度即是尋找從根節點到最近葉子節點的最短路徑，使用 Breadth-First Search 可以確保一遇到葉子節點即可返回當前深度。
  - Hint: 利用 BFS 逐層走訪樹節點，當遇到左右子節點皆為空的節點時，即為最近的葉子節點。
- **934** · 尋找兩個島嶼之間的最短橋樑需要計算網格中的最短距離，利用 BFS 從第一個島嶼開始向外擴展，直到觸碰第二個島嶼為止。
  - Hint: 先用 DFS 將第一座島嶼的所有座標標記入 Queue，再以此 Queue 作為起點進行 BFS 擴展尋找最短距離。
