---
id: graph-cycle-detection-undirected
title: 無向圖環路偵測
module: dfs-bfs
pattern_label: Cycle Detection
complexity_label: O(V + E) / O(V)
estimated_minutes: 20
exit_criteria:
  - 能理解無向圖中遇到已造訪鄰居且該鄰居不是父節點即代表有環
  - 能寫出帶有 parent 參數的 DFS 偵測函式
---
## Concept

這一課的判準與題目（261），你在 graph 模組的〈Graph Detect Cycle in Undirected Graph〉已經學過：**走訪時遇到一個已造訪的鄰居，而它不是我們剛剛走過來的那個節點（parent），就有環**。那一課已經證明它不會誤報（回到 parent 的邊是來時路，不是第二條路）也不會漏報（環上最晚造訪的節點必定觸發），並講了「n 個節點恰 n−1 條邊時，連通與無環互為充要」。今天不重講證明，補三件先課沒展開的事：

一、把昨天連通分量計數的外層迴圈接上判環：同一趟 DFS 同時得到分量數與有沒有環，並用等式「無環 ⇔ 分量數 = n − E」互相驗算——先課的 n−1 捷徑是它分量數為 1 的特例。
二、看清楚判準觸發那一刻的 DFS 樹：在無重邊的圖上、DFS 一判到就停時，那個已造訪的鄰居 w 一定是 u 還在遞迴中的祖先，環就是樹上 w 到 u 的路徑加邊 u–w，長度可以直接算出。
三、重邊與自環：鄰接串列保留重複時，節點版判準照樣判得到。

先課把 component 稱為「元件」，昨天稱「連通分量」，本課沿用昨天的說法。

## Thinking

**分量數與邊數的等式。** 把 E 條邊一條一條加進 n 個孤立節點：一條邊若接起兩個不同分量，分量數減 1；若兩端已在同一分量，分量數不變，但這條邊閉合了一個環。加完後 分量數 = n − (E − 閉環邊數)，因此 **無環 ⇔ 分量數 = n − E**，E 要算進每一條邊（重邊、自環都算）。分量數由昨天的外層迴圈算：對 0 到 n−1 逐一檢查，未造訪就分量數加一並發起 `dfs(s, -1)`；判環只是 DFS 多帶一個 parent。兩個數字對不上，不是有環就是程式有錯——最便宜的自我檢查。

**觸發那一刻的 DFS 樹。** 前提：無重邊、用 DFS（BFS 沒有這個性質）。看任一條非樹邊 u–w，設 w 先被造訪。w 的遞迴返回前一定會掃到 u：u 若尚未造訪就成為 w 的子節點，這條邊就是樹邊，矛盾；u 若已造訪，它是在 w 遞迴期間被造訪的，是 w 的後代。所以非樹邊只連祖先與後代，不會橫跨兩棵子樹。每條非樹邊會被看到兩次：先從後代 u 這端看到祖先 w（w 還在遞迴堆疊上），等 u 的子樹全部返回後，再從 w 這端看到已完成的 u。一判到就停，觸發時 w 必是 u 的祖先，環 = 樹上 w 到 u 的路徑 + 邊 u–w，長度 = depth[u] − depth[w] + 1；每個節點記下深度就能順手算出環長。

**重邊與自環。** 重邊 0–1、0–1：從 0 走到 1，1 把清單裡兩個 0 都當 parent 跳過，這一端確實漏了；但回到 0，清單裡第二個 1 已造訪且不是 parent，判到了。自環 u–u：u 看到自己，已造訪又不是 parent，判到。前提是鄰接串列保留重複——用 Set 建鄰接表會把長度 2 的環吃掉。有重邊時第一次觸發可能來自祖先那一端，環長公式失效（算出 0），判環本身不受影響。

## Pattern Recognition

訊號與先課相同：判斷無向圖是否為樹、是否為森林（每個分量都是樹）、加哪條邊會形成環、能否只用分量數與邊數回答「有沒有環」。題目再問「環有多長」「有沒有奇數長度的環」時，就是今天的深度公式——這正是明天二分圖判定的鑰匙。何時只從 0 出發就夠？問「圖有沒有環」時不夠，其他分量的環看不到；問「是不是樹」時夠，因為造訪數不等於 n 本身就已否決「樹」。這一點已用 n ≤ 5 的全部 1,099 張簡單圖窮舉驗證：先課那份只從 0 出發的 `validTree` 與「分量數 = 1 且無環」逐張一致。

## Common Mistakes

三條都用下方 Tip 的程式碼實測。一、忘記跳過 parent：把 TypeScript 的 `if (w === parent) continue;` 刪掉，`scan(2, [[0, 1]])` 得 `[1, true]`，一條邊被判成環；把它移到已造訪判斷之後，結果相同。Python 刪掉 `if w == parent:` 與 `continue` 那兩行，`cycle_len(3, [[0, 1], [1, 2]])` 回傳 2，一條邊被當成長度 2 的環。二、問「有沒有環」卻只從 0 出發：把 TypeScript 外層迴圈整行換成 `let comps = 1; dfs(0, -1);`，`scan(5, [[0, 1], [2, 3], [3, 4], [4, 2]])` 得 `[1, false]`，第二個分量的三角形沒被看到。三、鄰接表用 Set 去重：把 `number[][]` 換成 `Set<number>[]`、`push` 換成 `add`，`scan(2, [[0, 1], [0, 1]])` 從 `[1, true]` 變成 `[1, false]`；此時等式仍抓得到——分量數 1 ≠ n − E = 0。

## Complexity

時間 O(V + E)：外層迴圈 O(V)，每個節點只進 DFS 一次，每條邊從兩端各掃一次（重邊各算各的）。空間 O(V)：visited 或 depth 陣列加上遞迴深度，鏈狀圖的深度達 V。先課提醒過 Python 預設遞迴上限約 1000 層，它給的 BFS 版判環同樣正確；但今天的祖先性質與環長公式只在 DFS 成立，BFS 的非樹邊會橫跨子樹。

## Digest

判準沿用先課：DFS 遇到已造訪且不是 parent 的鄰居就有環。今天三件增量。一、接上昨天的外層迴圈，一趟 DFS 同時得到連通分量數與有無環，再用等式驗算：把邊逐條加入，不閉環的邊讓分量數減 1、閉環的邊不減，所以「無環 ⇔ 分量數 = n − E」（E 含重邊與自環）；先課的 n−1 捷徑是分量數為 1 的特例。二、在無重邊的圖上、用 DFS 且一判到就停時，觸發判準的已造訪鄰居 w 必是 u 還在遞迴中的祖先（無向圖 DFS 的非樹邊只連祖先與後代），環 = 樹上 w 到 u 的路徑加邊 u–w，長度 = depth[u] − depth[w] + 1。三、鄰接串列保留重複時，節點版判準對重邊與自環照樣判得到；用 Set 去重會吃掉長度 2 的環。問「有沒有環」要對每個未造訪節點發起 DFS；問「是不是樹」只從 0 出發即可。時間 O(V + E)，空間 O(V)。

## TypeScript Tip

一趟得到分量數與有無環。

```typescript
import { deepEqual as eq } from 'node:assert';

function scan(n: number, edges: [number, number][]): [number, boolean] {
  const adj: number[][] = Array.from({ length: n }, () => []);
  for (const [u, v] of edges) { adj[u]!.push(v); adj[v]!.push(u); }
  const seen = new Set<number>();
  let cyc = false;
  const dfs = (u: number, parent: number): void => {
    seen.add(u);
    for (const w of adj[u]!) {
      if (w === parent) continue; // 來時路
      if (seen.has(w)) cyc = true;
      else dfs(w, u);
    }
  };
  let comps = 0;
  for (let s = 0; s < n; s++) if (!seen.has(s)) { comps++; dfs(s, -1); }
  return [comps, cyc];
}

eq(scan(5, [[0, 1], [2, 3], [3, 4], [4, 2]]), [2, true]);
eq(scan(3, [[1, 2]]), [2, false]);
eq(scan(2, [[0, 1], [0, 1]]), [1, true]);
```

## Python Tip

depth 兼任 visited，一判到就停、回傳環長（無重邊）。

```python
def cycle_len(n, edges):
    adj = [[] for _ in range(n)]
    for u, v in edges:
        adj[u].append(v); adj[v].append(u)
    depth = [-1] * n
    def dfs(u, parent):
        for w in adj[u]:
            if w == parent:
                continue
            if depth[w] >= 0:  # w 是祖先
                return depth[u] - depth[w] + 1
            depth[w] = depth[u] + 1
            if (r := dfs(w, u)) is not None:
                return r
    for s in range(n):
        if depth[s] < 0:
            depth[s] = 0
            if (r := dfs(s, -1)) is not None:
                return r

assert cycle_len(4, [[0, 1], [1, 2], [2, 3], [3, 1]]) == 3
assert cycle_len(3, [[0, 1], [1, 2]]) is None
assert cycle_len(5, [[0, 1], [2, 3], [3, 4], [4, 2]]) == 3
```

## Takeaway

判準不變：已造訪且非 parent 就有環；再用分量數 = n − E 驗算，無重邊時觸發的 w 是祖先、環長 = depth[u] − depth[w] + 1。

## Tomorrow Preview

明天是二分圖判定：用 BFS 或 DFS 做著色法，把相鄰節點交替塗成 0 與 1，遇到已著色的鄰居和自己同色就不是二分圖。它和今天的關係很直接——同色衝突發生時，那條邊閉合的正是一個奇數長度的環；今天的環長公式會告訴你為什麼「有奇環」與「不能二分」是同一件事。

## Today's Challenge

- **261** · 你在 graph 模組已用今天的判準解過這題：樹 = 連通且無環。今天再解一次，改用分量數與邊數驗算——樹就是「分量數 = 1 且 E = n − 1」，兩個數字缺一不可。
  - Hint: 先數邊，不是 n − 1 條直接回 false；再從 0 出發 `dfs(0, -1)`（帶 parent 跳過來時路，已造訪就回報有環），最後確認造訪數等於 n。此題保證無重邊，節點版判準足夠。
