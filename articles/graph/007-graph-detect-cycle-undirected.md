---
id: graph-detect-cycle-undirected
title: Graph Detect Cycle in Undirected Graph
module: graph
pattern_label: Cycle Detection
complexity_label: O(V + E) / O(V)
estimated_minutes: 15
exit_criteria:
  - 能辨識是否有已造訪的鄰居不是目前節點的直接父節點。
---
## Concept

無向圖的環（cycle）是一條沿著互不重複的邊走一圈、回到起點的封閉路徑。用 DFS 判環的判準只有一句：走訪時遇到一個已造訪的鄰居，而它不是我們剛剛走過來的那個節點（parent），就有環。

為什麼「已造訪」不夠，還要排除 parent？因為無向邊是雙向的：從 A 走到 B 之後，B 的鄰居清單裡一定有 A，而 A 早已標記為已造訪。這條 B–A 的邊就是我們來時走的那一條，不是第二條路；把它當成環，任何一條邊都會被判成環。

為什麼排除 parent 之後判準就成立？DFS 實際走過的邊構成一棵 DFS 樹。目前在 u，看到已造訪的鄰居 w 且 w 不是 u 的 parent：邊 u–w 不可能是樹邊（樹邊只有「w 是 u 的 parent」或「u 是 w 的 parent」兩種，後者代表 u 剛才派 w 出去，在無重邊的圖裡 w 在 u 的清單只出現一次，回來後不會再碰到）。而 w 已造訪、又與 u 相鄰，兩者必在同一棵 DFS 樹上，樹上那條 u 到 w 的路徑加上這條非樹邊，就是一個環。反過來若圖有環，看環上最晚被造訪的節點 x：它在環上的兩個鄰居都比它早造訪，其中最多一個是它的 parent，另一個一定觸發判準，所以不會漏報。

## Thinking

拿到邊清單先建 adjacency list（無向邊寫兩側）。DFS 函式帶兩個參數 `dfs(u, parent)`，起點的 parent 填 -1——節點編號是 0 到 n-1，永遠不會撞到。進入 u 先標記已造訪，再掃鄰居 w：w 等於 parent 就跳過；w 已造訪就回報有環；否則遞迴 `dfs(w, u)`，子呼叫回報有環就一路往上傳。「跳過 parent」必須寫在「已造訪就回報」前面，順序反了等於沒排除。

Valid Tree 要的是「樹」，樹＝連通且無環，兩個條件缺一不可。判環之外，還要確認 DFS 從 0 出發造訪到的節點數等於 n，否則 [[0,1],[1,2]] 加一個孤立的 3 會被放行；反過來說，造訪數不等於 n 就已經不是樹，所以這題只從 0 出發就夠——單純問「有沒有環」時才必須對每個未造訪節點各發起一次 DFS。有一條捷徑：n 個節點的圖若恰有 n-1 條邊，「連通」與「無環」互為充要。理由：把邊一條一條加入，不成環的邊每次把兩個元件併成一個，n-1 條不成環的邊剛好把 n 個元件併成 1 個，這就是連通；反之，連通至少需要 n-1 條併接邊，而只有 n-1 條，每一條都在併接，沒有任何一條落在同一元件內，所以無環。因此可以先數邊：不是 n-1 條直接回 false，是的話再驗其中一個條件即可。但只數邊數不行：[[0,1],[1,2],[2,0]] 加孤立的 3 有 3 條邊，卻是三角形加孤點。

BFS 一樣能判環：佇列改存 (節點, parent) 成對資料，出隊後掃鄰居時同樣跳過 parent，遇到已造訪就是環。

## Pattern Recognition

訊號：判斷無向圖是否為樹、能否再加一條邊而不形成環、哪一條邊是多餘的（redundant connection）、或社群關係裡有沒有「繞一圈回來」的路徑。輸入通常是節點數 n 加邊清單。與昨天連通元件的關係：判環用的是同一套 DFS 走訪，只多帶一個 parent 參數；多元件的圖同樣要對每個未造訪節點各發起一次 DFS，否則其他元件裡的環會漏掉。

## Common Mistakes

一、忘記排除 parent（或把「已造訪」判斷寫在「跳過 parent」前面）。最小反例是 n=2、邊 [[0,1]]：從 0 走到 1，1 看到已造訪的 0 就回報有環——一條邊被判成環，任何有邊的圖都會誤判。二、只從節點 0 發起 DFS 就下結論：n=5、邊 [[0,1],[2,3],[3,4],[4,2]]，0 所在的元件無環，2-3-4 的三角形根本沒被看到，回報「無環」是錯的。三、Valid Tree 只判環不驗連通：[[0,1],[1,2]] 加孤立的 3 回報 true，但它不是樹。四、只數邊數就下結論：上面三角形加孤點的例子邊數恰為 n-1 卻不是樹，邊數必須搭配連通或無環其中之一。

## Complexity

時間 O(V + E)：每個節點進入 DFS 一次，每條邊從兩端各被掃到一次。空間 O(V)：visited 集合加上遞迴深度，整張圖排成一條鏈時深度達 V；Python 預設遞迴上限約 1000 層，節點數可能超過時改用 BFS 或拉高上限。

## Digest

無向圖判環的判準：DFS 遇到已造訪的鄰居且它不是 parent，就有環。排除 parent 是因為無向邊雙向，回到來源節點的那條邊是來時路而不是第二條路；排除之後，任何已造訪的非 parent 鄰居都構成非樹邊，樹路徑加上它就是環，且環上最晚造訪的節點必定觸發判準，不會漏報。實作上 `dfs(u, parent)` 起點填 -1，先跳過 parent 再檢查已造訪。Valid Tree＝連通且無環，兩者缺一不可；n-1 條邊時兩條件互為充要，可先數邊再驗其一，但只數邊數不夠（三角形加孤點）。多元件的圖要對每個未造訪節點各發起 DFS。時間 O(V + E)，空間 O(V)。

## TypeScript Tip

DFS 帶 parent 判環，三組測資各針對一種常見錯誤。

```typescript
import assert from 'node:assert';

function validTree(n: number, edges: [number, number][]): boolean {
  const adj: number[][] = Array.from({ length: n }, () => []);
  for (const [u, v] of edges) { adj[u]!.push(v); adj[v]!.push(u); }
  const seen = new Set<number>();
  const hasCycle = (u: number, parent: number): boolean => {
    seen.add(u);
    for (const w of adj[u]!) {
      if (w === parent) continue; // 來時路
      if (seen.has(w) || hasCycle(w, u)) return true;
    }
    return false;
  };
  return !hasCycle(0, -1) && seen.size === n; // 無環且連通
}

assert.ok(validTree(2, [[0, 1]])); // 忘記排除 parent 會誤判
assert.ok(!validTree(4, [[0, 1], [1, 2], [2, 0]])); // 邊數 n-1 但非樹
assert.ok(!validTree(4, [[0, 1], [2, 3]])); // 無環但不連通
```

## Python Tip

BFS 版：佇列存 (節點, parent)，沒有遞迴深度問題，判準與 DFS 相同。

```python
from collections import deque

def valid_tree(n: int, edges: list[list[int]]) -> bool:
    adj: list[list[int]] = [[] for _ in range(n)]
    for u, v in edges:
        adj[u].append(v)
        adj[v].append(u)
    seen = {0}
    queue = deque([(0, -1)])  # (節點, parent)
    while queue:
        u, parent = queue.popleft()
        for w in adj[u]:
            if w == parent:
                continue
            if w in seen:  # 第二條路：有環
                return False
            seen.add(w)
            queue.append((w, u))
    return len(seen) == n  # 還要連通

assert valid_tree(2, [[0, 1]]) is True
assert valid_tree(4, [[0, 1], [1, 2], [2, 0]]) is False
assert valid_tree(4, [[0, 1], [2, 3]]) is False
```

## Takeaway

無向圖判環：已造訪的鄰居不是 parent 就有環；樹＝連通且無環，n-1 條邊時驗其一即可。

## Tomorrow Preview

明天進入有向圖：邊有了方向之後，「排除 parent」這招會失效（A→B 與 B→A 是兩條邊，湊在一起是真的環），單一個已造訪標記也會誤報，需要把「已造訪」拆成兩種狀態來處理。

## Today's Challenge

- **261** · n 個節點的無向圖是不是樹＝連通且無環，兩個條件缺一不可：判環正是今天的 parent 排除法，連通則沿用昨天走訪計數的作法。
  - Hint: 先數邊，不是 n-1 條直接回 false；是的話從 0 出發 DFS（帶 parent），無環且造訪到的節點數等於 n 才是樹（此時兩者互為充要，驗其一即可）。
