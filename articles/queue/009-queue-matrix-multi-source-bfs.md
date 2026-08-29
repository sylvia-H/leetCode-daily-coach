---
id: queue-matrix-multi-source-bfs
title: Matrix Multi-Source BFS
module: queue
pattern_label: Multi-Source BFS
complexity_label: O(m * n) / O(m * n)
estimated_minutes: 20
exit_criteria:
  - Enqueue all starting sources initially before starting the BFS loop.
  - Update grid values in-place or use a distance matrix.
---
## Concept

Matrix Multi-Source BFS 是一種針對網格（Grid）圖形結構的廣度優先搜尋演算法延伸。傳統的 Breadth-First Search（BFS）通常從單一源點出發，逐層向外擴展以計算最短距離；然而，當問題涉及多個初始源點，且要求計算網格中每一個節點到「最近」某個源點的最短距離時，若對每個節點各自執行一次單源 BFS，會導致時間複雜度過高。Multi-Source BFS 的核心思想是將所有初始源點在演算法啟動前同時放入佇列（Queue）中，並將其初始距離設為 0，讓多個波前（Wavefronts）同步向外擴展。透過這種方式，演算法能夠在單次走訪中，自動利用最短路徑的性質，求出每個格子到任意最近源點的最短距離。

## Thinking

在處理 Multi-Source BFS 問題時，思考流程通常包含以下幾個步驟：首先，掃描整個 Matrix，找出所有符合條件的初始源點（例如數值為 0 的格子、或是腐爛的橘子）。將這些源點的座標全數塞入 Queue 中，並建立一個與 Matrix 大小相同的距離矩陣（Distance Matrix），將這些源點的位置初始化為 0，其餘位置初始化為一個代表未訪問的特殊值（如 -1 或 Infinity）。接著，啟動標準的 BFS 迴圈：從 Queue 中彈出當前座標，並檢查其上下左右四個相鄰方向。如果相鄰格子越界或是已經被訪問過（即距離不為未訪問狀態），則跳過；否則，更新該相鄰格子的距離為當前格子距離加一，並將其推入 Queue 中。重複此過程直到 Queue 為空，此時距離矩陣即記錄了所有格子到最近源點的最短距離。

## Pattern Recognition

要辨識一個題目是否適合使用 Multi-Source BFS，可以觀察幾個關鍵特徵：題目通常給定一個二維網格（Matrix），要求計算網格中「每一個點」到「最近的某種特定狀態（如 0、水域、腐爛源頭）」的最短距離或擴散時間。題目場景常涉及擴散、傳染、流動、最短距離等概念。如果問題敘述中暗示有多個起點同時向外影響周遭環境，且求的是最少步數或最早時間，這就是典型的 Multi-Source BFS 模式。常見的特徵還包括網格中的每個空位最終會被距離它最近的某個源點率先到達。

## Common Mistakes

最常見的錯誤是對於每一個源點分別執行一次單獨的 BFS，這會導致時間複雜度劣化至 O(M^2 * N^2)，在測資較大時必然會逾時（Time Limit Exceeded）。另一個常見錯誤是忘記在將初始源點放入 Queue 時，將對應的距離矩陣或標記狀態設定為 0，或者在走訪相鄰格子時漏掉邊界檢查，導致陣列存取越界（Index Out of Bounds）。此外，有些實作會使用一個 Visited Set，但對於多源點來說，直接在原矩陣或專屬的 Distance Matrix 上記錄已訪問狀態與距離，往往比額外維護一個 Set 更有效率且直觀。

## Complexity

時間複雜度為 O(m * n)，其中 m 為矩陣的列數（Rows），n 為矩陣的行數（Cols）。因為每個格子在 BFS 過程中最多被加入 Queue 一次並被訪問一次，總操作次數與網格的總格子數成線性關係。空間複雜度為 O(m * n)，主要用於儲存 Queue 中的座標以及用來記錄距離與訪問狀態的 Distance Matrix，在最壞情況下，Queue 需要容納網格邊界上所有的格子。

## Digest

Multi-Source BFS 是處理網格最短路徑問題的高效演算法。當問題要求計算所有節點到多個已知源點的最短距離時，切勿對每個源點重複執行獨立的 BFS。正確的做法是將所有初始源點同時初始化進 Queue 中，並將距離設為 0，讓波前同步向外擴展。在實作上，使用一個 Distance Matrix 既能記錄最短距離，又能兼顧訪問標記（Visited Flag）。TypeScript 與 Python 實作時，應注意 Queue 的效能，TypeScript 可使用陣列搭配指標模擬，Python 則建議使用 collections.deque 以確保每次彈出操作為 O(1)。透過掌握這項技巧，能夠有效解決諸如 01 矩陣更新與橘子腐爛擴散等經典網格問題。

## TypeScript Tip

在 TypeScript 中實作 BFS 時，若使用 shift() 進行陣列頭部彈出，其時間複雜度為 O(N)，容易導致效能瓶頸。建議使用指標（Pointer）搭配標準陣列來模擬 Queue，將彈出操作優化為 O(1)。
```typescript
function queueTipExample(): void {
    const queue: [number, number][] = [[0, 0]];
    let head = 0;
    while (head < queue.length) {
        const curr = queue[head++];
        if (!curr) throw new Error("assertion failed");
        break;
    }
}
queueTipExample();
```

## Python Tip

在 Python 中實作 Queue 時，切勿使用標準的 list.pop(0)，因為這會觸發整串元素的搬移，時間複雜度為 O(N)。務必使用 collections.deque，其 popleft() 操作能保持 O(1) 的高效能。
```python
from collections import deque

def py_tip_example() -> None:
    q = deque([(0, 0)])
    curr = q.popleft()
    assert curr == (0, 0), "assertion failed"

py_tip_example()
```

## Takeaway

Multi-Source BFS 的核心在於將所有起點同時入隊並將距離歸零，以 O(m * n) 的線性時間同步計算網格中所有點到最近源點的最短距離。

## Tomorrow Preview

明天我們將探討圖論中的 Topological Sort（拓撲排序），學習如何處理有向無環圖（DAG）中的相依性順序問題，並掌握 Kahn's Algorithm 與深度優先搜尋實作的應用場景。

## Today's Challenge

- **542** · 題目要求計算矩陣中每一個格子到最近的 0 的距離，這正是多個 0 同時作為源點向外擴散的典型 Multi-Source BFS 應用。
  - Hint: 將所有數值為 0 的格子作為初始源點放入 Queue，其餘未訪問格子設為 -1，然後同步進行 BFS。
- **994** · 橘子腐爛的過程是從所有初始腐爛的橘子同時向四周新鮮橘子蔓延，求出所有新鮮橘子完全腐爛所需的最短時間，符合多源同步擴展的特徵。
  - Hint: 先統計新鮮橘子的總數並將所有腐爛橘子入隊，在 BFS 擴散過程中記錄經過的分鐘數並遞減新鮮橘子數。
