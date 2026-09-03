---
id: graph-bipartite-check
title: 二分圖判定
module: dfs-bfs
pattern_label: Bipartite Graph
complexity_label: O(V + E) / O(V)
estimated_minutes: 20
exit_criteria:
  - 能用兩種顏色對圖進行交替著色
  - 能理解相鄰節點顏色相同即代表無法構成二分圖
---
## Concept

二分圖（Bipartite Graph）：能把所有節點分成兩組，使每一條邊的兩端落在不同組。判定它的工具是著色法（Coloring）——把「分組」寫成顏色 0 與 1，沿著 BFS 或 DFS 走訪，替每個新發現的鄰居塗上與自己相反的顏色；走到一條邊的兩端同色，就判定不是二分圖。骨架你都有了：BFS 那一課的佇列（入隊當下就標記）或昨天的遞迴 DFS；今天唯一的升級是 visited 從「有沒有來過」變成「來過而且是哪一組」，標記時機不變。

這是 dfs-bfs 模組的最後一課，它真正的增量是把昨天的環偵測接上來：**在「自環算長度 1 的環」的約定下，無向圖是二分圖 ⇔ 不含奇數長度的環**——少了這個約定，一張只有自環的圖會被算成無環，卻不是二分圖。昨天遇到「已造訪且非 parent」代表有環；今天著色衝突的那一刻，你撞到的不是任意一個環，而是一個奇環——4-環照樣過關，三角形才被擋下。Thinking 把這條橋的兩個方向都證完。

## Thinking

**流程。** `color` 全填 -1（未著色）。對 0 到 n−1 逐一檢查，未著色者塗 0 並入隊；取出隊首 u，掃它每個鄰居 v：v 未著色就塗 `1 - color[u]` 並入隊（入隊當下就著色，和 BFS 那一課「入隊當下就標記」是同一件事）；v 已著色且與 u 同色，回傳 false。所有分量走完都沒衝突，回傳 true。

**回傳 true 為什麼對。** 前提：每個節點只在入隊當下著色一次、之後不改，且每個分量的節點都會出隊。於是任一條邊 u–v 在 u 出隊時一定被檢查過：v 要嘛當場塗成 `1 - color[u]`，要嘛已著色且經檢查與 u 異色。顏色之後不變，所以最終每條邊兩端異色，顏色 0 與 1 就是合法的兩組。

**衝突 ⇒ 奇環（橋的第一個方向）。** 前提：顏色只沿走訪樹的樹邊指派、每走一條樹邊翻轉一次，因此走訪樹上任兩點若同色，它們之間的樹路徑長度為偶數。衝突邊 u–v 兩端同色，且相鄰必在同一分量、同一棵樹。從 u、從 v 各沿樹往上走到最近共同祖先 w，兩段路徑只在 w 相交、合計長度為偶數；再加上邊 u–v 本身，就得到一個長度為奇數的簡單環。用 BFS 時還能說得更具體：顏色 = 層數 mod 2，而 BFS 那一課證過「無向圖任一條邊兩端最多差一層」，所以同色的 u、v 必在同一層 d，兩段路徑各長 d − k（k 是 w 的層數），環長 2(d − k) + 1。

**奇環 ⇒ 不可二分（第二個方向）。** 任何合法的兩組著色沿環走一圈必須交替；奇數步後回到起點時顏色被翻轉了奇數次，與起點自己同色矛盾。合起來：衝突必帶出奇環，所以無奇環的圖不可能出現衝突，演算法回傳 true 並交出一組合法著色——這就是「無奇環 ⇒ 可二分」；反方向就是本段開頭的論證。演算法回 false ⇔ 有奇環 ⇔ 不是二分圖。昨天的 parent 參數今天不需要——回頭看向 parent 時它的顏色本來就相反，不會觸發衝突；重邊也安全（長度 2 的環是偶環）；自環是長度 1 的奇環，u 看到自己同色，直接擋下。

**不連通。** 各分量互不相鄰、各自獨立著色，每個起點都塗 0 沒有問題；但外層迴圈少不得，否則別的分量的奇環看不到。

## Pattern Recognition

三個訊號：把一群東西分成兩組，且約束全是「這兩個不能同組」（互不喜歡、敵對、必須錯開）——每個約束就是一條邊，題目沒給圖就自己建（886 給的是 `dislikes` 邊清單，先轉鄰接表、兩個方向都加）；問「能不能只用兩種顏色」；問「有沒有奇數長度的環」。反過來，約束是「這兩個必須同組」時走連通分量或 Union-Find；要分三組以上就不是這個 Pattern（一般圖的 3-著色是 NP-complete）。有環但全是偶環，照樣是二分圖——拿昨天的判環結果來回答今天的問題會誤判。

## Common Mistakes

四條都由下方 Tip 的程式碼施加單一改動實測：

- **只從 0 出發**：把 TypeScript 外層 `for (let s = 0; s < graph.length; s++)` 改成 `for (let s = 0; s < 1; s++)`，`isBipartite([[1], [0], [3, 4], [2, 4], [2, 3]])` 回 `true`——第二分量的三角形沒被看到。
- **用 0 同時代表「未著色」**：把 `fill(-1)` 改成 `fill(0)`，每個節點都被當成已著色而跳過，三角形 `[[1, 2], [0, 2], [0, 1]]` 回 `true`。
- **只處理未著色的鄰居**：刪掉 `else if (color[v] === color[u]) return false;`，衝突永遠測不到，同一個三角形回 `true`。
- **邊清單只加一個方向**：Python 刪掉 `adj[b].append(a)`，`can_split(4, [[3, 1], [4, 2]])` 回 `False`——1 從自己這端看不到 3，各自塗 0，等 3 出發才撞見同色的 1；正解是 `True`。

## Complexity

時間 O(V + E)：入隊當下就著色，每個節點至多入隊、出隊各一次，貢獻 O(V)；每條邊在兩端出隊時各被檢查一次，貢獻 O(E)。邊清單輸入要先花 O(V + E) 建鄰接表，量級不變。空間 O(V)：`color` 陣列加上佇列（最多同時裝相鄰兩層）或遞迴堆疊（鏈狀圖深度達 V）。Python 遞迴版在 n 達兩千的鏈狀圖會撞到預設約 1000 層的遞迴上限，換成 BFS 即可，判定邏輯一字不改。

## Digest

著色法：`color` 全填 -1；對每個未著色的節點塗 0 起一趟 BFS 或 DFS，新發現的鄰居塗 `1 - color[u]`（入隊當下就著色），已著色的鄰居與自己同色就回傳 false；所有分量走完回傳 true。回傳 true 為什麼對：每個節點只著色一次、之後不改，且每個分量的節點都會被處理，所以每條邊至少在一端被檢查過且兩端異色。核心命題——**在顏色只沿走訪樹的樹邊指派、每走一條樹邊翻轉一次的前提下**——衝突邊的兩端同色代表它們在樹上的路徑長度為偶數，加上這條邊就是一個奇環；反之奇環上任何交替著色繞一圈都會自相矛盾。因此無向圖是二分圖 ⇔ 無奇環（自環算長度 1 的奇環），4-環這類偶環照樣過關——昨天的「有環」不等於今天的「不能二分」。昨天的 parent 參數不需要，因為 parent 的顏色本來就相反。外層迴圈少不得，別的分量的奇環才看得到。邊清單輸入先轉鄰接表、兩個方向都加。時間 O(V + E)、空間 O(V)。

## TypeScript Tip

`color` 兼任 visited 與分組，`-1` 是未著色。

```typescript
import assert from "node:assert";

function isBipartite(graph: number[][]): boolean {
  const color: number[] = Array(graph.length).fill(-1);
  for (let s = 0; s < graph.length; s++) {
    if (color[s] !== -1) continue;
    color[s] = 0;
    const q = [s]; let head = 0;
    while (head < q.length) {
      const u = q[head++]!;
      for (const v of graph[u] ?? []) {
        if (color[v] === -1) { color[v] = 1 - color[u]!; q.push(v); }
        else if (color[v] === color[u]) return false;
      }
    }
  }
  return true;
}

assert(isBipartite([[1], [0], [3, 5], [2, 4], [3, 5], [2, 4]])); // 4-環在第二分量
assert(!isBipartite([[1, 2], [0, 2], [0, 1]])); // 三角形
assert(!isBipartite([[1], [0], [3, 4], [2, 4], [2, 3]])); // 奇環在第二分量
```

## Python Tip

邊清單先轉鄰接表、兩個方向都加；DFS 版不需要 parent。

```python
def can_split(n, dislikes):
    adj = [[] for _ in range(n + 1)]
    for a, b in dislikes:
        adj[a].append(b); adj[b].append(a)
    color = [-1] * (n + 1)
    def dfs(u):
        for v in adj[u]:
            if color[v] == -1:
                color[v] = 1 - color[u]
                if not dfs(v): return False
            elif color[v] == color[u]:
                return False
        return True
    for s in range(1, n + 1):
        if color[s] == -1:
            color[s] = 0
            if not dfs(s): return False
    return True

assert can_split(3, [[1, 2], [1, 3], [2, 3]]) is False  # 三角形
assert can_split(5, [[2, 3], [3, 4], [4, 5], [5, 3]]) is False  # 1 孤立；奇環不經過起點 2
assert can_split(4, [[3, 1], [4, 2]]) is True  # 邊的方向反著寫
```

## Takeaway

著色衝突就是撞到奇環：無向圖是二分圖 ⇔ 無奇環（自環算奇環）；入隊當下就著色、每個分量各起一次。

## Tomorrow Preview

dfs-bfs 模組到此收束。這條線從遞迴 DFS 起步，接上佇列 BFS，再依序長出最短路徑、網格擴散、連通分量、環偵測，最後把 visited 升級成顏色。之後再遇到「分成兩組且兩兩互斥」的題目，不必重新發明：建圖、著色、看衝突，三步就結束。

## Today's Challenge

- **785** · 輸入已是鄰接表（`graph[u]` 列出 u 的鄰居，兩個方向都在），圖可能不連通、可能含偶環，是著色法最純粹的形狀：不必建圖，直接驗證「回傳 true ⇔ 每條邊兩端異色」。
  - Hint: `color` 全填 -1；對每個未著色的 u 塗 0 後 BFS，鄰居未著色就塗 `1 - color[u]` 並入隊，已著色且同色立刻回傳 false；全部走完回傳 true。
- **886** · 圖是隱式的：`dislikes` 是邊清單、人的編號 1 到 n，「不能同組」正是「這條邊兩端異色」；比 785 多了建圖這一步，其餘完全相同。
  - Hint: 開 n + 1 格的鄰接表，每組 `[a, b]` 兩個方向都加；再對 1 到 n 每個未著色的人做同一套著色，衝突回傳 false、否則回傳 true。
