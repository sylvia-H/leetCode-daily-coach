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

在邊權相等（Unweighted）的圖或網格中，求「從起點到目標的最少步數」是 Breadth-First Search (BFS) 的主場。BFS 以 Queue 逐層向外擴展：先處理距離 0 的起點，再處理距離 1 的所有節點，接著是距離 2，如同水波以同心圓推開。這帶來本課最重要的保證：節點第一次被觸及時，走過的邊數就是它的最短距離。理由在於佇列內的距離值永遠非遞減——取出距離 d 的節點時，只會放入距離 d+1 的新節點，因此不可能之後才冒出一條更短的路徑「追上」已經被發現的節點。要注意，這個保證只在每步代價相同時成立；一旦邊帶有不同權重，「先到」不再代表「最短」，BFS 就不適用了。

## Thinking

拿到題目先確認兩件事：目標是不是「最少步數／最短距離」，以及每一步的代價是否相同。確認後套用固定流程：把起點放入 Queue、立刻標記為已訪問（visited）、距離記為 0；只要 Queue 不為空，就取出一個節點——若它是目標，直接回傳其距離；否則走訪它的所有鄰居，凡未訪問者先標記、再帶著「目前距離加一」放入 Queue。距離有兩種等價的記法：一是佇列直接儲存（節點, 距離）配對；二是沿用先修課的層長快照（size snapshot）——每輪先記下佇列當前長度，只處理這麼多個節點，整層處理完才把距離加一。正確性可以用歸納法說服自己：初始時佇列只有距離 0 的起點；假設某時刻佇列內距離非遞減、且最多橫跨相鄰兩層，那麼取出的必是佇列中距離最小的節點（設其距離為 d），它放入的鄰居距離都是 d+1，不變式繼續成立。於是每個節點首次入列時記下的距離，就是它與起點之間的最短距離，之後不需要任何修正。

## Pattern Recognition

關鍵字：最少步數、最短距離、最少轉換次數、最快抵達。結構上的必要條件是邊權相等——網格題四方向各走一步、單字每次只改一個字母、狀態每次做一種操作，都是「每步代價 1」的無權重圖。看到「求最小值」加上「每步代價相同」，就優先想到 Queue 搭配 BFS；反之若各步代價不同（帶權圖），「先到即最短」的保證失效，那是另一類演算法的範圍。

## Common Mistakes

一、visited 標記時機錯誤：應在「放入佇列的當下」標記，而不是取出時才標記。若出列才標記，同一節點可能在首次出列前被多個鄰居各放入一次；實測網格上入列次數近乎翻倍，稠密圖上更會惡化到與邊數同級。靠出列時再檢查跳過雖能保住答案正確，代價卻不必要。二、完全漏掉 visited：輕則重複入列讓佇列爆量，重則在含環的圖上、當目標不可達或需要走訪全圖時，佇列永遠清不空、程式永不終止。三、圖與樹的差別：樹沒有環、每個節點只有唯一來路，逐層走訪可以不用 visited；一般圖或網格必定可能重複抵達同一點，不可省略。四、距離更新時機混亂：距離應在放入鄰居時就定為「目前距離加一」，或用層長快照逐層計數、整層處理完才加一；若出列時才推算——例如拿「已出列的節點個數」當距離——同一層一有多個節點就立刻錯層。

## Complexity

時間複雜度 O(V + E)：visited 保證每個節點至多入列、出列一次，貢獻 O(V)；每條邊在其兩端節點出列時至多各被檢查一次，貢獻 O(E)。網格中 V = m * n、每格至多四個鄰居，整體即 O(m * n)。空間複雜度 O(V)：visited 結構佔 O(V)，佇列最壞情況（一整層節點同時在列中）同為 O(V)。

## Digest

無權重圖最短路徑 = BFS + visited + 距離追蹤。1. 核心保證：BFS 逐層擴展，佇列內距離值非遞減，節點首次被觸及即為最短距離——此保證僅在每步代價相同時成立。2. 固定流程：起點入列並標記 visited、距離 0；迴圈中取出節點，是目標即回傳距離，否則把未訪問鄰居標記後帶著「距離加一」入列。3. 距離兩種記法：佇列儲存（節點, 距離）配對，或用層長快照（size snapshot）逐層處理、整層結束才加一。4. 鐵則：visited 在入列當下標記，防止重複入列，也避免目標不可達時在環上永不終止。5. 複雜度：時間 O(V + E)、空間 O(V)；網格即 O(m * n)。

## TypeScript Tip

TypeScript 沒有內建 deque，`shift()` 每次是 O(n)；改用讀取指標依序走訪陣列即可維持 O(1) 出列。距離陣列以 -1 代表未訪問，一個結構同時充當 visited 與距離。

```typescript
function shortestPath(adj: number[][], start: number, target: number): number {
  const dist = new Array<number>(adj.length).fill(-1);
  dist[start] = 0;
  const queue = [start];
  for (let i = 0; i < queue.length; i++) {
    const cur = queue[i]!;
    if (cur === target) return dist[cur] ?? -1;
    for (const next of adj[cur] ?? []) {
      if (dist[next] === -1) {
        dist[next] = (dist[cur] ?? 0) + 1;
        queue.push(next);
      }
    }
  }
  return -1;
}
const g = [[1, 2], [0, 3], [0, 3], [1, 2, 4], [3]];
if (shortestPath(g, 0, 4) !== 3) throw new Error("expected 3");
if (shortestPath(g, 4, 4) !== 0) throw new Error("expected 0");
```

## Python Tip

`list.pop(0)` 是 O(n)，一律改用 `collections.deque` 的 `popleft()` 取得 O(1) 出列。用 dict 儲存距離，`in` 檢查同時完成 visited 判斷。

```python
from collections import deque

def shortest_path(adj, start, target):
    dist = {start: 0}
    queue = deque([start])
    while queue:
        cur = queue.popleft()
        if cur == target:
            return dist[cur]
        for nxt in adj[cur]:
            if nxt not in dist:
                dist[nxt] = dist[cur] + 1
                queue.append(nxt)
    return -1

g = {0: [1, 2], 1: [0, 3], 2: [0, 3], 3: [1, 2, 4], 4: [3]}
assert shortest_path(g, 0, 4) == 3
assert shortest_path(g, 4, 4) == 0
assert shortest_path({0: [], 5: []}, 0, 5) == -1
```

## Takeaway

無權重圖求最少步數用 BFS：入列當下標記 visited、距離逐層遞增，首次抵達即最短。

## Tomorrow Preview

明天進入 Matrix Multi-Source BFS：在迴圈開始前把「所有起點」一次放入佇列、距離同為 0，讓多個波前同時向外擴散——這是計算網格中每一格到最近來源距離的標準手法。

## Today's Challenge

- **111** · 二元樹的最小深度就是根節點到最近葉節點的最短路徑：BFS 逐層下探，第一個遇到的葉節點深度即為答案，正是「首次抵達即最短」的最小示範；樹無環，這題甚至不需要 visited。
  - Hint: 佇列儲存（節點, 深度）配對，取出時若左右子節點皆為空，立即回傳當前深度。
- **934** · 求兩座島之間最短的橋，就是網格上的無權重最短距離：從第一座島整體向外逐層擴展，第一次碰到第二座島時，已擴展過的水域層數即為橋長。
  - Hint: 先用 DFS 或 BFS 標記第一座島並把所有格子放入佇列，再逐層向外擴展——這正是明天多源 BFS 的預告。
