---
id: graph-dfs-traversal
title: Graph DFS Traversal
module: graph
pattern_label: Depth-First Search
complexity_label: O(V + E) / O(V)
estimated_minutes: 15
exit_criteria:
  - 能使用 visited set 避免在含環的圖上陷入無窮迴圈。
---
## Concept

Depth-First Search（DFS）是圖的基本走訪法：從起點出發，沿著一條邊走到鄰居，再從鄰居沿邊繼續往前，能走多深就走多深；直到目前頂點沒有未造訪的鄰居，才退回上一個頂點（回溯，backtracking），改試它的下一個鄰居。整個過程只用兩樣東西：一個 visited 集合記錄「已經進來過的頂點」，以及遞迴呼叫堆疊（或顯式堆疊）記住「退回去要回到哪」。

它為什麼正確？看兩個不變式。其一，visited 裡的每個頂點都是從起點可到達的——加入的時機永遠是「沿一條邊從已造訪頂點走過來」，所以不會多收。其二，演算法結束時，visited 裡每個頂點的所有鄰居也都在 visited 裡——每個頂點進來後都掃過整份鄰居清單，未造訪的都被遞迴進去了；於是從起點可達的任何頂點，沿著那條路徑一步步歸納，每一步都在 visited 裡，所以不會漏收。終止性則來自「每個頂點只進來一次」：進入時就標記，之後再從任何一條邊碰到它都直接跳過，含環的圖也繞不了第二圈。

## Thinking

遞迴模板只有幾行：`dfs(u)`：把 u 加入 visited；對 u 的每個鄰居 v，若 v 不在 visited 就 `dfs(v)`。用前兩天的圖走一遍：V = 4，無向邊 (0, 1)、(0, 2)，頂點 3 孤立。`dfs(0)` 標記 0，鄰居 1 未造訪 → `dfs(1)` 標記 1，它的鄰居 0 已造訪，無事可做，回到 0；下一個鄰居 2 → `dfs(2)` 標記 2，回到 0，結束。visited = {0, 1, 2}，頂點 3 從 0 到不了，所以不在裡面。要覆蓋整張圖，就在外層對每個頂點檢查「還沒造訪就從它啟動一次」——每啟動一次，就把一整塊互相連通的區域標記完。

輸入未必以 adjacency list 給你。用 adjacency matrix 時，「u 的鄰居」是掃第 u 列找非 0 的行索引；用格子圖時，頂點是座標 (r, c)，鄰居是上下左右四格中「在界內且符合條件」者，圖根本不用先建出來，這叫隱式圖。格子圖的 visited 可以是一張同尺寸的布林表，也可以直接把走過的格子改寫成不再符合條件的值（例如把陸地 '1' 改成 '0'），省下額外空間，但會改壞輸入，題目允許才這麼做。

遞迴深度可能達到 V，深圖上會撞到語言的堆疊上限；此時把遞迴改成顯式堆疊：彈出 u，若已造訪就跳過，否則標記並把所有鄰居推入。走訪順序會與遞迴版不同，但仍是一次合法的 DFS。

## Pattern Recognition

看到這些問法就想 DFS：「A 能不能到達 B」、「這塊區域有多大」、「有幾塊互不相連的區域」、「把所有可能的走法都試一遍」。共同點是只在乎可達性或窮舉，不在乎路徑長短——需要「最少幾步」時 DFS 給不出保證，那是明天 BFS 的事。輸入形式不限：邊清單、節點物件、矩陣、二維格子，都只是「列舉鄰居」的寫法不同。

## Common Mistakes

第一，標記時機錯：把 `visited.add(u)` 放在遞迴之後、或只在檢查鄰居時比對卻從不加入。無向邊 (0, 1) 本身就是一個來回的環：`dfs(0)` 進到 `dfs(1)` 時 0 還沒被標記，1 的鄰居 0 看起來仍未造訪，於是 `dfs(0)` 再被呼叫，無窮遞迴直到堆疊溢位。標記必須在進入頂點時、掃鄰居之前完成。第二，格子圖的邊界檢查：r = -1 時，JavaScript 的 `grid[-1]` 是 undefined，再取索引會拋 TypeError，所以邊界檢查一定要寫在讀取之前；Python 的負索引卻不報錯，`grid[-1]` 安靜地繞到最後一列，於是「漏寫 `r < 0`」這條檢查完全沒有症狀，頂端與底端的陸地被當成相連，島嶼數少算——下方 Python Tip 的第一組測資少了它就會少算一座島。第三，只從一個起點啟動：頂點 3 孤立的那張圖，只呼叫 `dfs(0)` 就永遠碰不到 3；數島嶼時少了外層迴圈，就只會算到第一座。第四，遞迴深度：Python 預設遞迴上限約 1000 層，一張 32×32 全是陸地的格子會讓 DFS 一路深入 1024 層，直接拋 RecursionError；格子超過幾十乘幾十時，改用顯式堆疊或提高上限。

## Complexity

時間 O(V + E)：每個頂點進入一次（標記後不再進入），每條邊在端點掃鄰居時各被檢查一次（無向圖兩次），所以是頂點數加邊數。若用 adjacency matrix，列舉鄰居每次掃 V 格，整體變成 O(V^2)。格子圖 V = m×n、每格最多 4 條邊，就是 O(m×n)。空間 O(V)：visited 集合 O(V)，遞迴堆疊最深也是 O(V)（一條長鏈）；原地改寫格子時 visited 的空間省下來，堆疊深度不變。

## Digest

DFS 從起點沿一條邊一路深入，沒有未造訪鄰居時回溯，靠 visited 集合擋住環、靠遞迴堆疊記住回頭的路。正確性來自兩個不變式：visited 裡的都可達、結束時 visited 對鄰居封閉，所以不多收也不漏收；每個頂點只進入一次，含環也會終止。模板：進入時標記，再對每個未造訪鄰居遞迴；外層對每個未造訪頂點各啟動一次，才能覆蓋不連通的部分。輸入是矩陣就掃整列找鄰居，是格子圖就用座標當頂點、上下左右當邊，邊界檢查要寫在讀取之前。時間 O(V + E)、空間 O(V)；深圖注意遞迴上限，必要時改顯式堆疊。

## TypeScript Tip

進入時標記；用一張含環的圖驗證不會繞圈，用造訪順序區分 DFS 與 BFS。

```typescript
import { strict as assert } from 'node:assert';

function dfsOrder(adj: number[][], start: number): number[] {
  const visited = new Set<number>();
  const order: number[] = [];
  const dfs = (u: number): void => {
    visited.add(u); // 先標記再深入，環才擋得住
    order.push(u);
    for (const v of adj[u] ?? []) if (!visited.has(v)) dfs(v);
  };
  dfs(start);
  return order;
}

// 0-1-3-2-0 成環，頂點 4 孤立
const adj = [[1, 2], [0, 3], [0, 3], [1, 2], []];
assert.deepEqual(dfsOrder(adj, 0), [0, 1, 3, 2]); // BFS 會是 0,1,2,3
assert.deepEqual(dfsOrder(adj, 4), [4]); // 孤立頂點只有自己
```

## Python Tip

格子圖當隱式圖：先查邊界再讀格子，原地把 '1' 改成 '0' 當作 visited。

```python
def count_islands(grid: list[list[str]]) -> int:
    rows, cols = len(grid), len(grid[0])

    def sink(r: int, c: int) -> None:
        if r < 0 or c < 0 or r >= rows or c >= cols or grid[r][c] != "1":
            return  # 邊界在前：Python 的 grid[-1] 會繞到最後一列
        grid[r][c] = "0"  # 進入即標記
        for dr, dc in ((1, 0), (-1, 0), (0, 1), (0, -1)):
            sink(r + dr, c + dc)

    count = 0
    for r in range(rows):
        for c in range(cols):
            if grid[r][c] == "1":
                count += 1  # 每啟動一次 DFS 就是一座島
                sink(r, c)
    return count

assert count_islands([list("110"), list("000"), list("101")]) == 3  # 漏查任一負索引邊界都會少算
assert count_islands([list("10"), list("01")]) == 2  # 對角不算相連
```

## Takeaway

DFS＝進入即標記、沿邊深入、走不動就回溯；visited 擋環、外層迴圈補起點，時間 O(V + E)。

## Tomorrow Preview

明天學 BFS：改用佇列逐層向外擴散，同樣靠 visited 擋環，但多了一項 DFS 給不了的保證——無權圖的最短步數。

## Today's Challenge

- **200** · 二維格子就是隱式圖：每個 '1' 是頂點，上下左右相鄰的 '1' 之間有邊。從一個未造訪的陸地格啟動 DFS 會把整塊相連的陸地標記完，所以「啟動次數」就是島嶼數；標記時機與邊界檢查順序是這題的全部難點。
  - Hint: 外層雙迴圈掃格子，遇到 '1' 就計數加一並呼叫 DFS；DFS 進入時先判界外或非 '1' 就返回，再把該格改成 '0'，最後遞迴四個方向。
