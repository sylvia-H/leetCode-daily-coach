---
id: graph-connected-components
title: Graph Connected Components
module: graph
pattern_label: Connected Components
complexity_label: O(V + E) / O(V)
estimated_minutes: 12
exit_criteria:
  - 能走訪所有節點，對未造訪的節點啟動 DFS/BFS 以計數 components。
---
## Concept

無向圖的 Connected Component（連通分量）是一個**極大**的節點集合：集合內任兩個節點之間都存在路徑，而且再也塞不進任何一個外部節點而不破壞這個性質。「極大」是定義的核心——三角形 0-1-2 裡的 {0, 1} 雖然彼此連通，卻不是一個 component，因為 2 還能加進來。

為什麼整張圖能被乾淨地切成若干個 component？因為「u 到 v 有路徑」在無向圖上是一種等價關係：自己到自己（長度 0 的路徑）、u 到 v 有路則 v 到 u 也有（邊沒有方向）、u 到 v 且 v 到 w 有路則 u 到 w 有路（把兩條路接起來）。等價關係會把節點切成互不重疊的等價類：每個節點恰好落在一個 component 裡，沒有任何一條邊跨越兩個 component，沒有邊的孤立節點自己就是一個 component。這直接給出計數的方法：從任一節點出發做完整走訪，走到的節點恰好就是它所在的 component；圖有幾個 component，就需要幾次「從未造訪節點重新出發」。

## Thinking

分三步。第一步，若輸入是邊清單，先建 adjacency list，每條邊 (a, b) 要同時放進 adj[a] 與 adj[b]——無向圖的一條邊是雙向的。第二步，準備長度 n 的 visited 陣列與計數器 count = 0，對 s 從 0 到 n-1 逐一檢查：若 visited[s] 已是 true 就跳過；否則 count 加一，並以 s 為起點啟動一次走訪（昨天的 BFS 或前天的 DFS 都行，這裡只需要「到得了」，不需要距離），把所有可達節點標記為已造訪。第三步，外層迴圈結束時 count 就是答案。

正確性只靠一條觀察：每個 component 恰好觸發一次啟動。看該 component 中編號最小的節點 m——外層迴圈走到 m 時，m 一定還沒被造訪，因為能標記它的走訪只可能從同一個 component 的節點出發，而那些節點的編號都比 m 大、還沒輪到；所以 m 會啟動一次。啟動之後，這個 component 的其餘節點全部被標記，外層迴圈再走到它們時只會跳過，不會第二次啟動。於是啟動次數與 component 數一一對應。若題目要的不只是數量，把 count 當作標籤寫進 comp[v]，或在走訪時累計大小，都是同一副骨架的零成本延伸。

## Pattern Recognition

看到「數有幾個」互不相通的群體——島嶼、省份、朋友圈、獨立子網路——就是這個 Pattern；輸入形式不拘，邊清單、adjacency matrix 或二維網格（格子是節點、相鄰同類格子是邊）都先化成「圖 + 走訪」。幾個常見變形其實都在問 component 數：「整張圖是否連通」等於 count 是否為 1；「最少加幾條邊才能把圖連起來」等於 count - 1（每加一條邊最多合併兩個 component）。要小心的是方向：有向圖的強連通分量需要 Kosaraju 或 Tarjan，不是今天的方法；本課只處理無向圖。

## Common Mistakes

第一，只從節點 0 出發走一次就回答。n = 3、邊只有 (0, 1)：從 0 走到 {0, 1} 後回報 1，但節點 2 沒有任何邊、自成一個 component，正解是 2。第二，建 adjacency list 時只放單向。n = 4、邊 (2, 1)、(1, 0)：只寫 adj[2].push(1)、adj[1].push(0)，從 0 出發什麼都走不到，1 與 2 各自再啟動一次，得到 4，正解是 2（{0, 1, 2} 與 {3}）。第三，計數器放錯位置：在走訪內部每標記一個節點就加一，n = 3、邊 (0, 1) 會得到 3——那是節點數，不是 component 數；count 只能在外層迴圈「發現未造訪節點」的那一刻加一。第四，套公式 n 減邊數：這只對森林成立，三角形 0-1-2 有 3 個節點 3 條邊，公式給 0，正解是 1。第五，Python 遞迴 DFS 撞上預設約 1000 層的遞迴深度上限：10^5 個節點串成一條鏈就會拋出 RecursionError，改用 stack 或 deque 的迭代版即可。

## Complexity

時間 O(V + E)：外層迴圈本身 O(V)；所有走訪合計把每個節點標記一次、每條邊從兩端各檢查一次，加總 O(V + E)——不是「V 次走訪各 O(V + E)」，因為已標記的節點只被跳過，不會重新走。空間 O(V)：visited 陣列加上 stack 或佇列的最壞深度；若需要自建 adjacency list，再加 O(V + E)。

## Digest

無向圖的 Connected Component 是「任兩點皆有路徑」的極大節點集合；因為可達性是等價關係，每個節點恰屬於一個 component，孤立節點自成一個。計數骨架：邊清單先雙向建 adjacency list；visited 全部設 false、count = 0；對 0 到 n-1 逐一檢查，未造訪就 count + 1 並以它為起點走訪（DFS 或 BFS 皆可）標記整個 component。正確性：每個 component 編號最小的節點輪到時必未造訪、恰啟動一次，其餘成員被標記後只會跳過。常見錯誤：只從 0 出發、邊只加單向、計數器放進走訪內部、套 n 減邊數的公式（有環就錯）。時間 O(V + E)、空間 O(V)。變形：圖連通等於 count 為 1，最少補邊數等於 count - 1。

## TypeScript Tip

迭代 DFS 用 stack，避開遞迴深度；第二組測資只建單向 adjacency list 會得到 4。

```typescript
function countComponents(n: number, edges: [number, number][]): number {
  const adj: number[][] = Array.from({ length: n }, () => []);
  for (const [a, b] of edges) { adj[a]!.push(b); adj[b]!.push(a); }
  const seen = new Array<boolean>(n).fill(false);
  let count = 0;
  for (let s = 0; s < n; s++) {
    if (seen[s]) continue;
    count++;
    seen[s] = true;
    const stack = [s];
    while (stack.length > 0) {
      const u = stack.pop()!;
      for (const v of adj[u]!) if (!seen[v]) { seen[v] = true; stack.push(v); }
    }
  }
  return count;
}
if (countComponents(5, [[0, 1], [1, 2], [3, 4]]) !== 2) throw new Error("bad");
if (countComponents(4, [[2, 1], [1, 0]]) !== 2) throw new Error("bad");
```

## Python Tip

外層迴圈只做一件事：`if not seen[s]` 就計數並啟動走訪。這裡用 deque 的 BFS，一樣不吃遞迴深度；第二組測資抓單向建圖的錯誤。

```python
from collections import deque

def count_components(n: int, edges: list[list[int]]) -> int:
    adj: list[list[int]] = [[] for _ in range(n)]
    for a, b in edges:
        adj[a].append(b)
        adj[b].append(a)
    seen = [False] * n
    count = 0
    for s in range(n):
        if seen[s]:
            continue
        count += 1
        seen[s] = True
        q = deque([s])
        while q:
            u = q.popleft()
            for v in adj[u]:
                if not seen[v]:
                    seen[v] = True
                    q.append(v)
    return count

assert count_components(5, [[0, 1], [1, 2], [3, 4]]) == 2
assert count_components(4, [[2, 1], [1, 0]]) == 2
```

## Takeaway

對 0 到 n-1 逐一檢查 visited，未造訪就計數加一並啟動走訪；啟動次數就是 component 數。

## Tomorrow Preview

明天是 Graph Detect Cycle in Undirected Graph：同一副走訪骨架，多帶一個 parent 參數——遇到已造訪的鄰居而它不是你的直接父節點，就抓到了一個環。

## Today's Challenge

- **323** · 題目直接給 n 個節點與無向邊清單，要你回答 component 數，正是「外層迴圈 + 對未造訪節點啟動走訪」的原型題；別忘了沒有邊的節點也各算一個。
  - Hint: 每條邊雙向加進 adjacency list；對 0 到 n-1 逐一檢查 visited，未造訪就 count + 1 並以它為起點走訪。
