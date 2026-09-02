---
id: dfs-bfs-core-concept-introduction
title: DFS / BFS 核心觀念介紹
module: dfs-bfs
pattern_label: Graph Search Basics
complexity_label: O(V + E) / O(V)
estimated_minutes: 10
exit_criteria:
  - 能用自己的話解釋 DFS 與 BFS 的走訪順序差異
  - 能辨識何時該用 DFS 何時該用 BFS
---
## Concept

這一課不是第一次認識 DFS 與 BFS。你在 queue 模組已經用佇列把二元樹逐層走完、在網格上做過多起點的擴散；在 graph 模組又分別寫過 Graph DFS Traversal 與 Graph BFS Traversal，還用它們數過連通塊、偵測過環、排過拓樸順序。今天的增量只有一件事：把兩者並排放在同一張圖上，看清楚它們**差在哪一個決定**，以及這個決定分別買到什麼保證。

兩者共用同一副骨架：維護一個「已發現、還沒展開」的候選集合，反覆從裡面取出一個頂點 u、把 u 尚未造訪的鄰居放進去，並用 visited 保證每個頂點只被展開一次。差別只在**從候選集合的哪一端取**：DFS 取最晚放進去的（後進先出，遞迴呼叫堆疊天生就是這樣），所以永遠優先展開最新發現的頂點、沿著一條分支一路走到底，走不動才回頭；BFS 取最早放進去的（先進先出，佇列），所以離起點 1 步的全部展開完，才輪到 2 步的。

同一張圖、同一個起點，兩者造訪到的**頂點集合完全相同**——都是「從起點可達」的那一群，理由和 graph 模組講過的一樣：visited 只收沿邊走到的頂點，結束時又對鄰居封閉。不同的只有**順序**，而順序正是取捨的來源。

## Thinking

拿一個五邊形來看：頂點 0 到 4，邊 0-1、1-3、3-4、4-2、2-0，鄰接清單依編號排列。從 0 出發，DFS 走 0 → 1 → 3 → 4 → 2：它第一次碰到 2 時已經走了 4 步，可是 2 明明就在 0 隔壁。BFS 走 0 → 1、2 → 3、4：2 在第 1 層就被發現。

這個例子把兩者的保證講完了。**在無權重圖（每條邊成本相同）中**，BFS 第一次發現某頂點時所在的層數，就是它到起點的最短步數——graph 模組證過的不變式：佇列裡任何時刻只有距離 d 與 d+1 兩種頂點，且 d 全排在前面。DFS 沒有這條不變式，它第一次到達的路徑只是「先走到的」，長度沒有任何保證；所以問「最少幾步」時 DFS 不是選項——不是效率差，而是答案可能錯。

反過來，DFS 買到的是**路徑本身**：遞迴堆疊在任何時刻就是「從起點到目前頂點的一條完整路徑」，回溯時自動把路徑尾端拆掉。要列舉所有路徑、判斷從根到葉的某個條件、或在狀態空間裡把每個分支試到底，這條「堆疊即路徑」的性質讓 DFS 幾行就寫完（列舉所有路徑時 visited 要在回溯時解除，那是回溯法模組練過的事）；BFS 要做同樣的事，得替每個佇列項目另外存整條路徑，空間立刻膨脹。

於是選擇只看題目要什麼：問「到不到得了」「有幾塊」——兩者都行，挑好寫的；問「最少幾步」「最早幾分鐘」——BFS；問「所有走法」「這條路徑成不成立」——DFS。邊有不同權重時兩者都不保證最短，那是 Dijkstra 的範圍，不在本模組。

## Pattern Recognition

看到「最短」「最少」「最早」且每步成本相同，或情境有逐層擴散的意象（傳染、腐爛、水波、多個來源同時推進）——BFS。看到「所有」「任一條」「能否組成」「回溯」，或題目本質是把選擇樹走完——DFS。只看可達性或連通性的題（有幾座島、A 能否到 B）兩者等價；格子圖與遞迴天生合拍，通常用 DFS，但格子超過幾十乘幾十時遞迴深度會撞上語言的堆疊上限（Python 預設約 1000 層），改 BFS 或顯式堆疊。

## Common Mistakes

第一，用 DFS 回答「最少幾步」。上面的五邊形就是反例：DFS 從 0 第一次到達 2 時記下的步數是 4，正確答案是 1；下方 Python Tip 的 `dfs_depth` 會原樣算出這個 4。

第二，DFS 忘了在進入頂點時標記。把 TypeScript Tip 裡 `dfs` 的 `visited.add(u)` 那一行搬到 `for` 迴圈之後：五邊形上 `dfs(0)` 進 `dfs(1)`，1 的鄰居 0 看起來仍未造訪，於是再進 `dfs(0)`……沿著 0-1 這一條邊來回遞迴，直到堆疊溢位拋出 RangeError。環不是特殊情況，任何一條無向邊本身就是一個來回的環。

第三，BFS 在取出時才標記。把 TypeScript Tip 裡 `bfs` 的 `visited.add(v)` 從入隊處刪掉、改在取出後（`out.push(u)` 之前）寫 `visited.add(u)`：頂點 4 會被 2 與 3 各推進佇列一次，取出時也就處理兩次，輸出變成 `[0, 1, 2, 3, 4, 4]`。就算取出時補一句「已標記就跳過」把答案救回來，入隊次數的上限也已從每頂點一次變成每條邊一次，空間從 O(V) 膨脹到 O(E)。

第四，只從一個起點啟動。兩者都只走得到「可達」的頂點；圖若不連通，得在外層對每個未造訪頂點各啟動一次——graph 模組的 Connected Components 做過，本模組後面會再回來。

## Complexity

時間兩者都是 O(V + E)：每個頂點展開一次，展開時把它的鄰接清單掃一遍，全部清單長度加總是 2E（無向）或 E（有向）。空間都是 O(V)，但吃在不同地方：DFS 吃遞迴深度，BFS 吃佇列同時容納的頂點數。一條 V 個頂點的長鏈，DFS 深度 V、BFS 佇列最多 1 個；一顆中心接 V-1 片葉子的星形，DFS 深度 2、BFS 佇列一口氣塞 V-1 個。最壞情況兩者都是 O(V)，但你面對的圖長什麼樣，決定哪一個先把記憶體吃光——遞迴還多了語言堆疊上限這一條線。

## Digest

DFS 與 BFS 共用同一副骨架——維護「已發現、未展開」的候選集合，取出一個頂點、把未造訪的鄰居放進去，用 visited 保證每個頂點只展開一次；差別只在從哪一端取：DFS 取最晚放進的（堆疊／遞迴），一路深入再回溯；BFS 取最早放進的（佇列），逐層向外。同起點下兩者造訪的頂點集合相同，只有順序不同。在無權重圖（每條邊成本相同）中，BFS 首次發現某頂點的層數就是最短步數；DFS 首次到達的路徑長度沒有保證，五邊形上會把 1 步的鄰居走成 4 步。DFS 的優勢是遞迴堆疊本身就是一條完整路徑，適合列舉所有路徑與回溯。選擇：問最少幾步選 BFS，問所有走法或路徑條件選 DFS，只問可達性兩者皆可。時間都是 O(V + E)、空間 O(V)：DFS 吃遞迴深度（長鏈最深）、BFS 吃佇列寬度（星形最寬）。

## TypeScript Tip

同一張五邊形、同一份鄰接順序：DFS 沿 1 深入到 4 才碰到 2，BFS 在第 1 層就看到 2。

```typescript
import { strict as assert } from "node:assert";

const adj = [[1, 2], [0, 3], [0, 4], [1, 4], [2, 3]]; // 五邊形 0-1-3-4-2-0

function dfs(u: number, visited: Set<number>, out: number[]): number[] {
  visited.add(u); // 進入即標記
  out.push(u);
  for (const v of adj[u] ?? []) if (!visited.has(v)) dfs(v, visited, out);
  return out;
}

function bfs(s: number): number[] {
  const visited = new Set([s]), q = [s], out: number[] = [];
  for (let h = 0; h < q.length; h++) {
    const u = q[h]!;
    out.push(u);
    for (const v of adj[u] ?? []) if (!visited.has(v)) { visited.add(v); q.push(v); } // 入隊即標記
  }
  return out;
}

assert.deepEqual(dfs(0, new Set(), []), [0, 1, 3, 4, 2]);
assert.deepEqual(bfs(0), [0, 1, 2, 3, 4]);
```

## Python Tip

改成記「第一次到達時走了幾步」：BFS 的數字就是最短步數，DFS 的數字只是它剛好走過的路。

```python
from collections import deque

adj = [[1, 2], [0, 3], [0, 4], [1, 4], [2, 3]]  # 五邊形 0-1-3-4-2-0

def dfs_depth(u: int, d: int, depth: dict[int, int]) -> dict[int, int]:
    depth[u] = d  # 進入即標記，順便記下走了幾步
    for v in adj[u]:
        if v not in depth:
            dfs_depth(v, d + 1, depth)
    return depth

def bfs_dist(s: int) -> dict[int, int]:
    dist, q = {s: 0}, deque([s])
    while q:
        u = q.popleft()
        for v in adj[u]:
            if v not in dist:
                dist[v] = dist[u] + 1  # 入隊即標記
                q.append(v)
    return dist

assert bfs_dist(0) == {0: 0, 1: 1, 2: 1, 3: 2, 4: 2}
assert dfs_depth(0, 0, {}) == {0: 0, 1: 1, 3: 2, 4: 3, 2: 4}  # 2 只差 1 步，DFS 走了 4 步才碰到
```

## Takeaway

同一副骨架、只差從哪端取：堆疊給你完整路徑，佇列給你無權圖的最短步數；先問題目要哪一個。

## Tomorrow Preview

接下來本模組把兩者拆開各自深挖。明天是「遞迴式 DFS 實作」：把今天的「堆疊即路徑」落到程式語言的呼叫堆疊上，弄清楚基底條件與遞迴呼叫的關係。稍後的「BFS 與佇列層級走訪」則回到佇列，把逐層向外擴散的標準樣板固定下來。

## Today's Challenge

本篇為觀念課，沒有對應的 LeetCode 練習題。請在紙上把五邊形的 DFS 與 BFS 順序各走一遍，並說出各自的保證來自哪一種資料結構。
