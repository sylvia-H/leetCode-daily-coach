---
id: queue-matrix-multi-source-bfs
title: Matrix Multi-Source BFS
module: queue
pattern_label: Multi-Source BFS
complexity_label: O(m * n) / O(m * n)
estimated_minutes: 20
exit_criteria:
  - 能在 BFS 迴圈開始前，先把所有起始來源加入佇列。
  - 能就地（in-place）更新網格值，或改用距離矩陣。
---
## Concept

Matrix Multi-Source BFS 是單源 BFS 在網格（Grid）上的直接延伸。單源 BFS 從一個起點逐層向外走，第 k 層恰好是距離起點 k 步的所有格子；但許多題目問的是「每個格子到最近的某類源點有多遠」，而源點可能成百上千個。若對每個源點各跑一次單源 BFS 再逐格取最小值，源點數最壞與格子數同階，總時間會劣化到 `O((m*n)^2)`。Multi-Source BFS 的改動只有一處：啟動前把「所有」源點一次放入 Queue、距離設為 0，之後執行與單源完全相同的迴圈。為什麼這樣是對的？想像在網格外加一個虛擬超級源點（Virtual Super Source），用長度 0 的邊連向每個真實源點——從它出發的單源 BFS，走一步後的狀態恰好就是「所有源點同時在第 0 層」。於是單源 BFS 的層級性質原封不動繼承過來：Queue 內的距離值任何時刻只有 d 與 d+1 兩種、單調不減；任一格子第一次被觸及時寫下的距離，必然就是它到最近源點的最短距離，之後永遠不需要回頭修正。

## Thinking

拿到題目後分四步。第一步，掃過整個 Matrix 找出所有源點（值為 0 的格子、初始腐爛的橘子），全部推入 Queue；同時建一個同尺寸的距離矩陣，源點位置填 0，其餘填 -1 代表未訪問——這個 -1 讓距離矩陣同時兼任 visited 標記，不必另外維護 Set。第二步，跑標準 BFS 迴圈：取出佇列頭的座標，檢查上下左右四個鄰居；越界或距離不是 -1 就跳過，否則把鄰居距離設為當前距離加一，並在入隊的當下就完成寫入。第三步，Queue 清空後距離矩陣即為答案；若題目問「全部擴散完成要多久」，答案就是距離矩陣的最大值——同層格子會在同一輪被觸及，層數即時間。第四步，收尾檢查：若「應被擴散到的目標格」仍停留在 -1（障礙與空格本來就不在擴散對象內），代表它被隔開、任何源點都到不了，依題意回報無法完成。

## Pattern Recognition

三個訊號指向 Multi-Source BFS。一、輸入是二維網格，問「每個格子」到「最近的某種狀態」的距離，而不是特定兩點之間的路徑。二、情境帶有擴散、傳染、淹沒的意象：多個起點同時向外影響周遭，問最少步數或最早完成時間。三、每走一格的成本都相同。第三點是分水嶺——格子間移動成本若不相等，BFS 的層級性質就失效，得改用 Dijkstra。反過來說，若題目只有單一起點，那就是前一課的單源最短路；Multi-Source 只是把初始化從一個點換成一批點，迴圈本體完全共用。

## Common Mistakes

第一個錯誤是對每個源點各跑一次 BFS 再取最小值——結果正確但時間爆炸，最壞 `O((m*n)^2)`，大測資必然逾時；正解是一次全部入隊。第二個是標記時機：等到出隊時才標記已訪問，同一格會被多個鄰居搶先重複入隊——隨機網格實測入隊次數約放大近兩倍，最壞可達每格被其每一個鄰居各推一次（棋盤式源點實測放大約 2.5 倍）——答案仍然正確，但白白多做工；入隊當下就把距離寫進矩陣才是正確做法。第三個是初始化與邊界疏漏：忘記把源點距離設為 0；漏掉邊界檢查時，TypeScript 讀到 undefined 會當場拋錯，Python 的負索引卻會靜默回繞到另一側（dist[-1] 是最後一列），拿到錯的距離而不報錯，更難察覺。第四個發生在擴散類題目：迴圈結束不代表任務完成，被障礙包圍的目標格從頭到尾不會入隊，必須再確認「應被擴散到的目標格」是否仍有 -1（障礙與空格不計）；用層數當時間時也要記得源點本身在第 0 層，別多算一輪。

## Complexity

時間複雜度為 O(m * n)：每個格子至多入隊一次、出隊一次，每次出隊只檢查四個鄰居，總操作次數與格子數成正比；把所有源點一次入隊並不改變這個上界，因為源點也只是「入隊一次」的格子。空間複雜度為 O(m * n)：距離矩陣佔 m * n，Queue 在最壞情況（幾乎所有格子同層）也可能同時容納與格子數同階的座標。

## Digest

Multi-Source BFS 解決「網格中每格到最近源點的距離」：啟動前把所有源點以距離 0 一次放入 Queue，其餘格子設 -1，之後跑與單源完全相同的 BFS。正確性來自一個等價視角——想像一個以長度 0 的邊連向所有源點的虛擬超級源點，多源 BFS 就是從它出發的單源 BFS，「首次觸及即最短」的性質完全繼承。距離矩陣同時兼任 visited 標記，入隊當下就寫入距離，可避免同格重複入隊。整體時間與空間皆為 O(m * n)。實作時注意佇列效能：TypeScript 用陣列搭配 head 指標模擬出隊，Python 用 collections.deque 的 popleft()，兩者皆為 O(1)。擴散類題目最後記得確認應被擴散到的目標格是否仍是 -1——到不了就依題意回報無法完成。

## TypeScript Tip

別用 shift() 出隊——成本與佇列長度成正比。改用 head 指標配陣列，出隊 O(1)。

```typescript
function bfs(g: number[][]): number[][] {
  const m = g.length, n = g[0]!.length, q: [number, number][] = [];
  const d: number[][] = g.map(r => r.map(v => v === 0 ? 0 : -1));
  let head = 0;
  for (let r = 0; r < m; r++) for (let c = 0; c < n; c++) if (g[r]![c] === 0) q.push([r, c]);
  while (head < q.length) {
    const [r, c] = q[head++]!;
    for (const [dr, dc] of [[1,0],[-1,0],[0,1],[0,-1]] as const) {
      const nr = r + dr, nc = c + dc;
      if (nr < 0 || nr >= m || nc < 0 || nc >= n || d[nr]![nc] !== -1) continue;
      d[nr]![nc] = d[r]![c]! + 1; q.push([nr, nc]);
    }
  }
  return d;
}
if (JSON.stringify(bfs([[0,1,1],[1,1,1],[1,1,0]])) !== "[[0,1,2],[1,2,1],[2,1,0]]")
  throw new Error("bad");
```

## Python Tip

切勿用 list.pop(0) 出隊——它搬移整串元素，成本與佇列長度成正比。務必用 collections.deque，popleft() 維持 O(1)；產生器一行即可完成多源入隊。

```python
from collections import deque

def nearest_zero(g: list[list[int]]) -> list[list[int]]:
    m, n = len(g), len(g[0])
    dist = [[0 if v == 0 else -1 for v in row] for row in g]
    q = deque((r, c) for r in range(m) for c in range(n) if g[r][c] == 0)
    while q:
        r, c = q.popleft()
        for nr, nc in ((r + 1, c), (r - 1, c), (r, c + 1), (r, c - 1)):
            if 0 <= nr < m and 0 <= nc < n and dist[nr][nc] == -1:
                dist[nr][nc] = dist[r][c] + 1
                q.append((nr, nc))
    return dist

assert nearest_zero([[0, 1, 1], [1, 1, 1], [1, 1, 0]]) == [[0, 1, 2], [1, 2, 1], [2, 1, 0]]
```

## Takeaway

多源最短距離不必多次 BFS：所有源點以距離 0 同時入隊，等價於從虛擬超級源點出發的單源 BFS，一趟 O(m * n) 完成。

## Tomorrow Preview

明天是 queue 模組的收官課：Sliding Window Maximum with Monotonic Queue。我們會維護一個值單調遞減的 Monotonic Queue，讓每個固定大小的 Sliding Window 都能以攤銷 O(1) 取得最大值，整體以 O(n) 解決區間極值問題。

## Today's Challenge

- **542** · 求每個格子到最近的 0 的距離，所有 0 同時作為源點向外擴散，一次 BFS 取代逐格搜尋，是 Multi-Source BFS 的教科書應用。
  - Hint: 把所有 0 入隊、其餘格子設 -1，首次觸及即最短距離。
- **994** · 腐爛從所有初始腐爛的橘子同時向四周蔓延，求全部腐爛的最短時間，即多源 BFS 的最大層數。
  - Hint: 先數新鮮橘子並把腐爛者全部入隊；擴散中遞減計數，結束後仍有新鮮橘子就回報 -1。
