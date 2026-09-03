---
id: bfs-shortest-path-unweighted
title: 未加權圖的最短路徑
module: dfs-bfs
pattern_label: Shortest Path BFS
complexity_label: O(V + E) / O(V)
estimated_minutes: 20
exit_criteria:
  - 能計算從起點到終點的最小邊數或步數
  - 理解為什麼 BFS 在邊權均等時必然找到最短路徑
---
## Concept

本課與佇列模組的「Queue Shortest Path in Unweighted Graph」主題相同：在每條邊代價相同的圖上，用 BFS 求起點到目標的最少步數。那一課你已經跑過完整流程——起點入隊、入隊當下標記並記距離、出隊時遇到目標即回傳——也用「（節點, 深度）配對」解過最小深度那題。今天不假裝這是新東西，而是換一個角度把同一件事講透：先修課用「佇列內距離非遞減」的直覺說服你首次抵達即最短，本課把它寫成雙邊夾住的證明；用同一份程式碼實測 DFS 為什麼不行、沒有 visited 為什麼連答案都會錯；最後把圖從「給定的鄰接表」推廣到「由狀態與轉移規則隱含定義的圖」，這是單字接龍那題真正的難點。

記號沿用上一課：BFS 給每個節點記的層數寫成 d[v]（起點 0，被層數 k 的節點發現的鄰居記 k + 1，只在入隊當下記一次）；起點到 v 的最短距離寫成 dist(v)，定義為最少邊數。上一課已證：在鄰居入隊當下就標記的前提下，出隊順序的 d 值由小到大。

## Thinking

**定理：每條邊代價相同、鄰居在入隊當下標記並記層數，則對每個可達節點 d[v] = dist(v)。** 兩邊夾。

上界 dist(v) ≤ d[v]：v 是被某個層數 d[v] − 1 的節點發現的，那個節點又被層數 d[v] − 2 的節點發現……一路回到起點，這條鏈是一條真實存在、恰有 d[v] 條邊的路徑，最短距離不會超過它。

下界 d[v] ≤ dist(v)：對 dist(v) = k 歸納。k = 0 是起點。設對所有距離小於 k 的節點成立；取 v 某條最短路徑上的前一個節點 u，dist(u) = k − 1，由歸納 d[u] = k − 1。u 出隊時，若 v 尚未標記，v 此刻記為 d[u] + 1 = k；若 v 已被某個更早出隊的 w 標記，由出隊順序非遞減得 d[w] ≤ d[u]，故 d[v] = d[w] + 1 ≤ k。兩種情況都有 d[v] ≤ k。

合併即 d[v] = dist(v)。「首次抵達即最短」只是推論：目標只會出隊一次，帶著的正是最短距離，看到就能回傳，不必等佇列清空。

**兩個前提各自守住一件事。** 邊權不等：0 到 5 有一條直達邊代價 5，另有 0–4–5 兩條邊各代價 1；BFS 數邊，回傳直達那條（1 條邊），但代價最小的是 2——d[v] 仍等於最少邊數，垮的是「邊數就是代價」這個對應，最少邊數不再是題目要的答案；這個前提保的不是證明，是題意。沒有 visited：不只是效率或終止問題，同一層的節點會把鄰居已記好的層數覆寫成自己的層數加一，答案跟著錯（數字見 Common Mistakes）。

**回傳時機。** 出隊時判目標最穩，起點等於目標時自然回傳 0。改成入隊時判（發現鄰居 n 時若是目標，直接回傳 d[u] + 1）可少處理一層，但必須先單獨處理「起點即目標」：實測把出隊處的判斷移到入隊處後，起點 4 到目標 4 回傳 −1 而非 0，因為起點從不會以鄰居的身分被發現。

**隱含圖。** 節點是狀態、邊是一次合法操作，鄰居不查表而是現場生成：整數狀態每步 +1 或 ×2、單字每次改一個字母。只要每次操作代價相同，定理照用；差別只在鄰居由函式產生，以及 visited 要用 Map 或 dict 而非陣列。

## Pattern Recognition

訊號是「最少步數、最少轉換次數、最短距離」加上「每步代價相同」。第二個條件是硬前提：網格四方向各走一步、單字改一個字母、鎖盤轉一格，都是代價 1；題目若給了不同權重，最少邊數就不是題目要的答案。另一個線索是題目沒有明講圖：狀態就是節點，一次合法操作就是一條邊，先把「狀態長什麼樣、一步能到哪些狀態、目標怎麼判定」三件事定義出來，圖就出來了。相對地，要枚舉所有路徑或算路徑總和時，該用 DFS。

## Common Mistakes

每條都由本篇 Tip 的程式碼施加單一改動實測：

- **用堆疊（等價於 DFS 的取出順序）找最短路**：TypeScript 把 `queue[head++]` 改成 `queue.pop()`，六節點環上 0 到 5 得 4（正解 2），整數狀態 1 到 10 得 5（正解 4）；Python 把 `popleft()` 改成 `pop()`，hit 到 cog 得 5（正解 4）。DFS 先撞到的是「先走到的路」，不是「最短的路」。
- **沒有 visited**：TypeScript 拿掉 `!dist.has(n)` 判斷，1 到 10 得 5（正解 4）——這張隱含圖沒有環、程式照樣終止，錯在同層節點互相覆寫層數；套到有環的六節點環上則永不終止。Python 拿掉 `nxt not in dist`，hit 到 cog 得 22。
- **計數基準沒對齊題意**：Python 把起點記為 `{begin: 0}`，hit 到 cog 得 3（正解 4）——題目要的是序列的單字數（邊數加一），基準在起點就要定好，不要算完再猜要不要加一。
- **把邊數當代價**：對「0 到 5 加一條直達邊」的六節點環呼叫 `fewestSteps(0, …)` 得 1；若那條邊代價是 5，這個 1 不是最小代價。BFS 只能回答邊數。

## Complexity

時間 O(V + E)：入隊當下標記保證每個節點至多入隊、出隊各一次，每條邊在其端點出隊時被檢查常數次。隱含圖要換算：V 是可達狀態數，E 是每個狀態的鄰居數加總——長度 L 的單字有 26 × L 個候選鄰居，鄰居檢查約 O(N × 26 × L) 次，N 為字典大小；每次還要生成並雜湊一個長度 L 的字串，時間再乘一個 L。空間 O(V)：visited 與佇列各佔一份可達狀態。

## Digest

無權圖最短路 = BFS + 入隊當下標記並記層數 + 遇目標即回傳。定理：**在每條邊代價相同、且鄰居入隊當下就標記的前提下**，BFS 記下的層數 d[v] 等於最短距離 dist(v)。證明分兩邊：上界——d[v] 是沿發現鏈回到起點的一條真實路徑的邊數，最短距離不會超過它；下界——對 dist(v) 歸納，最短路徑上的前一節點 u 出隊時，v 若未標記就記為 d[u] + 1，若已被更早出隊的 w 標記則 d[v] = d[w] + 1 ≤ d[u] + 1，兩種情況都不超過 dist(v)。「首次抵達即最短」是推論。前提失效的樣子：邊權不等時邊數不再等於代價；沒有 visited 時同層節點會互相覆寫層數，無環的圖也會算錯。實測：換成堆疊，六節點環 0 到 5 得 4（正解 2）。隱含圖：狀態是節點、一次操作是邊、鄰居現場生成，定理照用。時間 O(V + E)、空間 O(V)。

## TypeScript Tip

鄰居由函式產生：同一份程式碼跑隱含圖與明確的圖。

```typescript
function fewestSteps<S>(start: S, goal: (s: S) => boolean, next: (s: S) => S[]): number {
  const dist = new Map<S, number>([[start, 0]]);
  const queue = [start];
  let head = 0;
  while (head < queue.length) {
    const cur = queue[head++]!;
    if (goal(cur)) return dist.get(cur)!;
    for (const n of next(cur)) {
      if (!dist.has(n)) { dist.set(n, dist.get(cur)! + 1); queue.push(n); }
    }
  }
  return -1;
}
const ring = [[4, 1], [0, 2], [1, 3], [2, 5], [0, 5], [3, 4]];
const got = [
  fewestSteps(1, s => s === 10, s => [s + 1, s * 2].filter(x => x <= 10)),  // 隱含圖
  fewestSteps(0, s => s === 5, s => ring[s] ?? []),
  fewestSteps(0, s => s === 9, s => ring[s] ?? []),
];
if (got.join() !== "4,2,-1") throw new Error(`got ${got}`);
```

## Python Tip

每個位置換 26 個字母、只留字典裡有的；`dist` 從 1 起算，對齊序列的單字數。

```python
from collections import deque
from string import ascii_lowercase

def ladder_length(begin: str, end: str, words: list[str]) -> int:
    pool, dist, queue = set(words), {begin: 1}, deque([begin])  # 起點算 1
    while queue:
        cur = queue.popleft()
        if cur == end:
            return dist[cur]
        for i in range(len(cur)):
            for c in ascii_lowercase:
                nxt = cur[:i] + c + cur[i + 1:]
                if nxt in pool and nxt not in dist:
                    dist[nxt] = dist[cur] + 1
                    queue.append(nxt)
    return 0

assert ladder_length("hit", "cog", ["hot", "dot", "dog", "cot", "cog"]) == 4
assert ladder_length("hit", "cog", ["hot", "dot", "dog", "lot", "log"]) == 0
```

## Takeaway

邊權相同且入隊即標記時，BFS 層數等於最短距離：上界來自真實路徑、下界靠歸納；首次抵達即最短只是推論。

## Tomorrow Preview

明天回到 DFS，搬進二維網格：用方向陣列（dx, dy）列舉上下左右四個鄰居，把邊界檢查寫成固定樣板。

## Today's Challenge

- **111** · 你在佇列模組已用（節點, 深度）配對解過；今天換成層長快照再解一次，並盯緊「葉」的定義：左右子節點皆為空才算，只有一個子節點的節點不是葉。
  - Hint: 外層每輪深度加一，內層取出 size 個節點，遇到左右皆空立即回傳當前深度；root 為空回傳 0。
- **127** · 圖沒有給你：單字是節點、改一個字母且結果在字典裡是一條邊，鄰居要現場生成。每步代價相同，所以 BFS 首次抵達 endWord 的層數就是答案。
  - Hint: 回傳序列的單字數（起點算 1、每過一條邊加一），endWord 不在字典或到不了回傳 0；每個單字對每個位置試 26 個字母，只把在字典且未造訪的放入佇列。
