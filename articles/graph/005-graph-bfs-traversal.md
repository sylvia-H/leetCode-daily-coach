---
id: graph-bfs-traversal
title: Graph BFS Traversal
module: graph
pattern_label: Breadth-First Search
complexity_label: O(V + E) / O(V)
estimated_minutes: 15
exit_criteria:
  - 能使用 BFS 在無權重圖中找出最短路徑。
---
## Concept

昨天的 DFS 沿著一條分支一路走到底、走不動才回頭；今天的 Breadth-First Search 反過來：先把離起點 1 步的節點全部看完，再看 2 步的，再看 3 步的。做到這件事的工具是佇列（Queue）——先進先出保證「先被發現的節點先被展開」，而先被發現的節點正是離起點較近的節點。

BFS 真正值錢的性質是：在**無權重圖**（每條邊成本相同）中，節點第一次被放進佇列時所在的層數，就是它到起點的最短距離。理由可以用一條迴圈不變式說清楚：佇列裡任何時刻只會同時存在距離 d 與 d+1 兩種節點，且 d 的全部排在 d+1 前面。起點入隊時只有 d = 0，不變式成立；每次取出一個距離 d 的節點、把它未造訪的鄰居以 d+1 入隊，佇列仍維持「先 d 後 d+1」；當距離 d 的節點全部取完，隊首變成 d+1，不變式往前推一層。既然節點是依距離不減的順序被取出，某節點 v 第一次被觸及，必然是被某個距離最小的鄰居觸及——這個距離加一就是 v 的最短距離，之後永遠不需要修正。DFS 沒有這個性質：它先到達的路徑只是「先走到的」，不是最短的。

## Thinking

拿到 adjacency list 與起點 s 後分四步。第一步，準備一個長度 V 的 dist 陣列全部填 -1，代表尚未造訪；把 dist[s] 設為 0 並將 s 入隊——dist 同時兼任 visited 標記，不必另外開 Set。第二步，主迴圈：只要佇列非空就取出隊首 u，掃過 adj[u] 的每個鄰居 v；若 dist[v] 仍是 -1，就在**入隊的當下**寫入 dist[v] = dist[u] + 1，再把 v 推進佇列。標記的時機是 BFS 唯一容易寫錯的地方：入隊即標記，每個節點只會入隊一次。第三步，若題目要「逐層」處理（例如每一層算一分鐘），不必另外記層數：dist 的值就是層數；或者在每一輪先記下佇列當下的節點數 size（head 指標寫法是 `q.length - head`），只取出這麼多個節點，取完就代表一層結束。第四步，佇列清空後讀答案：dist[t] 是 s 到 t 的最短步數；仍為 -1 的節點代表從 s 到不了。多個起點也不需要新演算法——把所有起點以距離 0 一起入隊，其餘照舊，這就是你在 queue 模組用過的 Multi-Source BFS。

## Pattern Recognition

三個訊號指向 BFS。一、題目問「最少幾步」「最短路徑長度」「最早幾分鐘」，而且每一步成本相同——這是 BFS 的主場，也是它與 DFS 的分工線：DFS 回答「到不到得了」與「有哪些走法」，BFS 回答「最快幾步到」。二、情境帶有逐層擴散的意象：傳染、腐爛、水波，多個來源同時向外推進。三、狀態空間隱含成一張圖：網格的每個格子是節點、上下左右是邊；字串每改一個字元是一條邊。反過來，邊有不同權重時 BFS 的層級性質失效，得改用 Dijkstra；只問連通、不問距離時 DFS 與 BFS 都行，明天就會用到這種情形。

## Common Mistakes

第一，出隊時才標記已造訪。以三角形 0-1、0-2、1-2 從 0 出發為例：取出 0 後把 1、2 以距離 1 入隊；接著取出 1，此時 2 還沒被標記，於是 dist[2] 被改寫成 2 並再次入隊——答案錯了，正確是 1。就算把距離存進佇列項目、出隊時發現已標記就跳過，答案救得回來，佇列裡的重複項仍會讓空間從 O(V) 膨脹到 O(E)（8 個節點的完全圖實測入隊 29 次，正確寫法只要 8 次）。第二，層數多算一輪：起點在第 0 層，若每取完一層就把計數加一，單一起點且沒有任何鄰居的圖會回報 1，正確是 0；改用 dist 的最大值當答案，或只在真的有新節點入隊時才加一。第三，用 DFS 找最短路：同樣的三角形，DFS 從 0 先走到 1、再從 1 走到 2，回報 0 到 2 的距離為 2，但直接的邊只要 1 步。第四，用 `Array.shift()` 或 `list.pop(0)` 出隊：兩者都要搬動整條陣列，單次成本 O(V)，整體從 O(V + E) 劣化為 O(V^2)，10^5 個節點的圖就會逾時。

## Complexity

時間 O(V + E)：每個節點恰入隊一次、出隊一次，出隊時掃一次自己的 adjacency list，所有 list 長度加總是 2E（無向圖）或 E（有向圖）。前提是出隊 O(1)——TypeScript 用 head 指標、Python 用 `deque`。空間 O(V)：dist 陣列 V 個、佇列最多同時容納 V 個節點（星形圖從中心出發時所有葉子同時在隊中）；若把 adjacency list 也算進來則是 O(V + E)。

## Digest

BFS 用佇列逐層走訪圖：起點以距離 0 入隊，之後不斷取出隊首、把未造訪的鄰居以「目前距離 + 1」入隊，並在入隊當下標記。佇列任何時刻只含距離 d 與 d+1 的節點且 d 全排在前面，因此節點首次入隊時的層數就是它到起點的最短距離——這是無權重圖最短路徑的正確性依據，DFS 沒有這個保證。實作要點：dist 陣列填 -1 兼任 visited；標記時機是入隊而非出隊，否則三角形圖就會算出錯的距離；起點在第 0 層，層數別多算一輪；出隊必須是 O(1)（TypeScript 用 head 指標、Python 用 collections.deque），否則 O(V + E) 會劣化成 O(V^2)。時間 O(V + E)、空間 O(V)。多個起點時全部以距離 0 入隊即可，迴圈本體不變。

## TypeScript Tip

用 head 指標取代 shift()，出隊 O(1)；dist 填 -1 兼任 visited。測資含三角形（出隊才標記會把 dist[2] 算成 2）與孤立節點（必須維持 -1）。

```typescript
function bfs(adj: number[][], s: number): number[] {
  const dist = new Array<number>(adj.length).fill(-1);
  const q: number[] = [s];
  let head = 0;
  dist[s] = 0;
  while (head < q.length) {
    const u = q[head++]!;
    for (const v of adj[u] ?? []) {
      if (dist[v] !== -1) continue;
      dist[v] = dist[u]! + 1;
      q.push(v);
    }
  }
  return dist;
}
const adj = [[1, 2], [0, 2, 3], [0, 1], [1], []];
if (bfs(adj, 0).join() !== "0,1,1,2,-1") throw new Error("bad");
```

## Python Tip

用 collections.deque 的 popleft() 出隊，O(1)；list.pop(0) 會搬動整條串列。同一組測資：三角形抓標記時機，孤立節點抓 -1。

```python
from collections import deque

def bfs(adj: list[list[int]], s: int) -> list[int]:
    dist = [-1] * len(adj)
    dist[s] = 0
    q = deque([s])
    while q:
        u = q.popleft()
        for v in adj[u]:
            if dist[v] == -1:
                dist[v] = dist[u] + 1
                q.append(v)
    return dist

adj = [[1, 2], [0, 2, 3], [0, 1], [1], []]
assert bfs(adj, 0) == [0, 1, 1, 2, -1]
```

## Takeaway

BFS 用佇列逐層擴散、入隊當下就標記；無權重圖中節點首次入隊的層數就是最短距離。

## Tomorrow Preview

明天是 Graph Connected Components：今天 BFS 跑完後仍是 -1 的節點，代表另一塊互不相通的區域。明天把外層迴圈接上——對每個未造訪的節點再啟動一次 DFS 或 BFS，數出無向圖裡有幾個 Connected Components。

## Today's Challenge

- **994** · 這題你在 queue 模組已用 Multi-Source BFS 解過；今天把它放回一般圖的 BFS 框架：格子是節點、四鄰是邊、所有初始腐爛橘子是第 0 層的多個起點，每一層就是一分鐘，重點放在入隊即標記與層的界線。
  - Hint: 先數新鮮橘子並把腐爛者全部入隊；擴散中每感染一顆就遞減計數，結束後仍有新鮮橘子回 -1，否則答案是最大層數（起點在第 0 層）。
