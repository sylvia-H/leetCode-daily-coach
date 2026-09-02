---
id: graph-topological-sort-bfs-kahns
title: Graph Topological Sort BFS (Kahn's Algorithm)
module: graph
pattern_label: Kahn's Algorithm
complexity_label: O(V + E) / O(V)
estimated_minutes: 15
exit_criteria:
  - 能計算所有節點的 in-degree，將 in-degree 為 0 的節點加入佇列並逐層處理。
---
## Concept

Kahn's Algorithm 是 Topological Sort 的第二種做法。昨天用 DFS post-order 反轉得到順序；今天改用 BFS 的思路，從「沒有先修」的節點開始一層一層往外剝。核心資料是 in-degree（入度）：節點 v 的入度＝指向 v 的邊數＝v 尚未被滿足的先修數。做法只有三步：算出每個節點的入度；把入度為 0 的節點全部放進佇列；反覆彈出一個節點寫進結果，並把它每條出邊指向的鄰居入度減 1，減到 0 的鄰居就入佇列。

它為什麼是對的？關鍵不變式：**執行過程中 `indeg[v]` 永遠等於「v 的先修中尚未被彈出的個數」**。初始時沒有節點被彈出，`indeg[v]` 就是完整的先修數；每彈出一個節點 u，就對 u 的每個鄰居減 1，恰好對應「u 這個先修完成了」，不變式得以維持。於是 `indeg[v] == 0` 的意思是「v 的所有先修都已寫進結果」，此時輸出 v，任何指向 v 的邊的起點都排在 v 前面——這正是拓樸順序的定義。佇列裡永遠只裝這種節點，所以彈出順序天生合法，不必像 DFS 版那樣事後反轉。

有環時會怎樣？假設環上有節點被彈出，看**第一個**被彈出的環節點 c：彈出當下它的入度必為 0，但它在環上的前驅還沒被彈出（c 是第一個），那條邊仍計在 `indeg[c]` 裡，入度至少是 1，矛盾。所以環上的節點一個也進不了佇列，佇列會在處理完環外可達的節點後提早空掉，彈出計數嚴格小於節點數 n。反過來，若圖是 DAG 而佇列空掉時仍有節點沒彈出，每個這種節點都有一個「也沒被彈出」的前驅（彈出過的前驅已扣掉），沿著沒彈出的前驅一路回溯，有限集合裡必定繞回同一個節點——那就是環，與 DAG 矛盾。因此「彈出數等於 n」與「無環」互為充要，一個計數器同時完成排序與判環。

## Thinking

拿到先修關係輸入時，先把 `[a, b]` 讀成「要修 a 得先修 b」，建一條 b → a 的邊並讓 `indeg[a]` 加 1。接著掃一遍入度陣列，把所有為 0 的節點一次放進佇列——是**全部**，不是挑一個；它們彼此沒有依賴，誰先誰後都合法。主迴圈就是 BFS：彈出 u、推進 order（或 `count++`）、走訪 `adj[u]`，對每個鄰居 v 做 `indeg[v]--`，**只在減到剛好 0 的那一刻**才把 v 入佇列。迴圈結束後比較 order 長度是否等於 n：相等就回傳順序（判定題回傳 true）；否則圖有環，回傳空陣列或 false。

這個過程之所以叫「逐層處理」：初始佇列是第 0 層（沒有任何先修的節點），它們彈完後入佇列的是第 1 層（先修全在第 0 層），依此類推。第 k 層的節點正是「最長先修鏈長度為 k」的節點——這個層次結構是 DFS 版本沒有的副產品，若題目問「最少幾輪能做完」，答案就是層數。

## Pattern Recognition

訊號與昨天相同：有向依賴、要一個合法順序、或要判斷能否完成。什麼時候偏好 Kahn 而非 DFS 版？需要順序又想省掉反轉與三色狀態時；需要「分層」資訊，例如平行排程、最少輪數時；想要字典序最小的合法順序時——把佇列換成 min-heap，每次彈出可用節點中編號最小者，結果仍合法；圖很深、遞迴會爆堆疊時，Kahn 天生是迭代的。反之，若解法本來就在遞迴中順手收集順序，DFS 版更貼身。

## Common Mistakes

第一，**每次遞減就入佇列，而不是只在歸零時入佇列**。反例：n = 3，邊 0 → 2、1 → 2。初始佇列 [0, 1]；彈出 0 時 `indeg[2]` 從 2 減成 1，若此時就推入 2，結果會是 [0, 1, 2, 2]——2 被輸出兩次，長度 4 ≠ 3，程式反而誤判為「有環」。圖真的有環時更糟（0 → 1 → 2 → 0 加一條 3 → 1）：入度會減成負數、節點無止盡地重複入佇列，迴圈永不終止。第二，**忘記比較計數與 n**。反例：n = 3，邊 1 → 2、2 → 1，節點 0 孤立。order 只有 [0] 佇列就空了，不檢查長度就會回傳「可以完成」——但 1 和 2 互相卡死。第三，初始佇列只放一個入度 0 的節點：同樣以 0 → 2、1 → 2 為例，只放 0 會得到 [0] 就停，把 DAG 誤判為有環。第四，邊方向建反（a → b 而非 b → a）。誠實地說，這對只問能否完成的題目**無害**——環反過來還是環，true / false 不變；但一旦題目要你輸出順序，你會交出完全顛倒的序列。第五，JavaScript 用 `shift()` 當 dequeue、Python 用 `list.pop(0)`，每次 O(n)，整體退化成 O(n^2)；用 head 索引走陣列或 `collections.deque` 才是 O(1)。

## Complexity

時間 O(V + E)：建鄰接表與入度掃一遍所有邊 O(E)；初始掃入度陣列 O(V)；主迴圈每個節點最多彈出一次、每條邊恰好讓某個入度減 1 一次，合計 O(V + E)。空間 O(V + E)：鄰接表 O(V + E)，入度陣列、佇列與結果各 O(V)。若把佇列換成 min-heap 求字典序最小順序，時間變成 O((V + E) log V)。

## Digest

Kahn's Algorithm 用入度做拓樸排序：算好每個節點的入度，把入度 0 的節點全部入佇列，反覆彈出、把鄰居入度減 1、減到 0 才入佇列。不變式是 `indeg[v]`＝v 尚未被彈出的先修數，所以佇列裡永遠是先修都已輸出的節點，彈出順序天生合法、不必反轉。有環時環上節點的入度永遠到不了 0，佇列提早空掉，彈出計數小於 n——一個計數器同時完成排序與判環。三個易錯點：只在歸零時入佇列、初始要放入全部入度 0 的節點、最後一定比對計數。時間 O(V + E)。

## TypeScript Tip

用 head 索引取代 `shift()`，佇列即結果；斷言驗「邊的起點在終點前」與「有環回傳 null」。

```typescript
import assert from 'node:assert/strict';

function kahn(n: number, edges: [number, number][]): number[] | null {
  const adj: number[][] = Array.from({ length: n }, () => []);
  const deg = new Array<number>(n).fill(0);
  for (const [u, v] of edges) { adj[u]!.push(v); deg[v]! += 1; }
  const q: number[] = [];
  for (let i = 0; i < n; i++) if (deg[i] === 0) q.push(i);
  for (let h = 0; h < q.length; h++) {
    for (const v of adj[q[h]!]!) if (--deg[v]! === 0) q.push(v);
  }
  return q.length === n ? q : null;
}

const e: [number, number][] = [[0, 2], [1, 2], [2, 3]];
const o = kahn(4, e) ?? [];
for (const [u, v] of e) assert.ok(o.indexOf(u) < o.indexOf(v));
assert.equal(kahn(3, [[0, 1], [1, 2], [2, 0]]), null);
```

## Python Tip

`deque.popleft()` 是 O(1)；回傳 `None` 代表有環。

```python
from collections import deque

def kahn(n: int, edges: list[tuple[int, int]]) -> list[int] | None:
    adj = [[] for _ in range(n)]
    indeg = [0] * n
    for u, v in edges:
        adj[u].append(v)
        indeg[v] += 1
    q = deque(i for i in range(n) if indeg[i] == 0)
    order = []
    while q:
        u = q.popleft()
        order.append(u)
        for v in adj[u]:
            indeg[v] -= 1
            if indeg[v] == 0:  # 只在歸零時入佇列
                q.append(v)
    return order if len(order) == n else None

edges = [(0, 2), (1, 2), (2, 3)]
o = kahn(4, edges)
assert o is not None and len(o) == 4
pos = {v: i for i, v in enumerate(o)}
assert all(pos[u] < pos[v] for u, v in edges)
assert kahn(3, [(0, 1), (1, 2), (2, 0)]) is None
```

## Takeaway

入度 0 ＝ 先修全已輸出，彈出即合法；只在歸零時入佇列；彈出數小於 n 就是有環。

## Tomorrow Preview

Graph 模組到今天收官：從表示法、DFS／BFS 走訪、連通元件、環偵測，到兩種 Topological Sort，你已握有處理依賴關係問題的完整工具箱。之後課程會另起新主題，動身前先把這兩天的兩種拓樸排序各自手寫一遍。

## Today's Challenge

- **207** · 這題你已在有向圖環偵測那課用 DFS 三色法判過有無環；今天用 Kahn 的入度計數再判一次，差別是它順便產出一個合法修課順序，且判環只需比較「彈出節點數是否等於 n」，不必維護遞迴堆疊狀態。
  - Hint: `[a, b]` 建 b → a 的邊並讓 a 的入度加 1；入度 0 的課全部入佇列，彈出時把後續課的入度減 1、歸零才入佇列；最後彈出數等於 numCourses 才回傳 true。
