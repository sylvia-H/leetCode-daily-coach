---
id: graph-topological-sort-dfs
title: Graph Topological Sort DFS
module: graph
pattern_label: Topological Sort
complexity_label: O(V + E) / O(V)
estimated_minutes: 15
exit_criteria:
  - 能在造訪完某節點的所有後代後，將該節點前插或推入結果列表。
---
## Concept

Topological Sort（拓樸排序）是把一張有向無環圖（DAG）的所有頂點排成一列，使每一條邊 u → v 的 u 都排在 v 前面。它回答的是「一堆有先後限制的工作該用什麼順序做」：先修課、建置相依、任務排程都是。

DFS 版的做法一句話講完：對每個頂點做 DFS，**在它的所有後代都走完之後**才把它推入清單（post-order），最後把清單反轉。反轉後為什麼就是合法拓樸序？關鍵命題是：**只要邊 u → v 存在，v 一定比 u 先完成**。DFS 在 u 檢查這條邊時，v 只有三種狀態：若 v 未造訪，會立刻遞迴進去，DFS(v) 必然在 DFS(u) 返回之前結束；若 v 已完成，它更早就完成了；若 v 正在造訪中，代表 v 還在遞迴堆疊上、是 u 的祖先，存在 v ⇝ u 的路徑，加上 u → v 就構成環——在 DAG 裡這種情況不可能發生。所以每一條邊都滿足「v 先完成」，依完成順序倒過來排，u 自然落在 v 前面。

有環時，論證的第三種情況會真的發生：u 指到的 v 正在造訪中，v 會比 u 晚完成，反轉後 v 排在 u 前面、違反 u → v；事實上環上的邊本來就不可能同時滿足。因此本課直接沿用前一課的三態標記：一走到狀態為「造訪中」的頂點就回報有環，整個排序宣告無解。

## Thinking

拿題目 210 的輸入形式走一遍。`prerequisites` 的一組 `[a, b]` 表示「修 a 之前必須先修 b」，所以邊是 b → a（先修指向課程）；輸出要的是每個先修都排在它的課程前面。

第一步，建鄰接串列並準備狀態陣列：0 未造訪、1 造訪中、2 已完成，再加一個 post 清單。第二步，寫遞迴 dfs(u)：進入時把 u 標成 1；逐一看鄰居 v，狀態 1 直接回報有環，狀態 2 略過，狀態 0 遞迴進去；鄰居全部處理完，把 u 標成 2 並推入 post。第三步，外層迴圈對 0 到 n-1 每個狀態為 0 的頂點呼叫 dfs——這一步不可省，因為圖可能不連通、起點也未必是源頭，而題目要求所有課程都要出現。任一次 dfs 回報有環就回傳空陣列，否則回傳 post 的反轉。

以 5 門課、限制 [[1,0],[2,0],[3,1],[3,2]] 為例：邊是 0→1、0→2、1→3、2→3，4 是孤立頂點。從 0 出發：進 1、進 3，3 沒有鄰居，最先完成；回到 1，完成；回到 0 看 2，進 2，2 的鄰居 3 已完成、略過，2 完成；0 完成。接著 1、2、3 都是狀態 2，跳過；4 單獨完成。post 是 [3, 1, 2, 0, 4]，反轉得 [4, 0, 2, 1, 3]，每條邊的先修都在前面。這裡也看到「狀態 2 的鄰居要略過」的必要：2 → 3 指到已完成的 3，那不是環，只是兩條路徑匯流。

明天會看另一種不靠遞迴的做法：從「沒有任何先修的課」開始一層層剝；今天先把 post-order 這條路走穩。

## Pattern Recognition

題目出現「先修／相依／必須在某事之前完成」、要求輸出一個合法的執行順序、或要判斷是否可能完成，就把每條限制畫成有向邊，先問「這是 DAG 嗎」。只問「能不能完成」是前一課的判環；要「給出一種順序」就是今天的拓樸排序，而且判環順帶做完。另一個線索是題目註明「答案不唯一、任一合法順序皆可」——這正是拓樸序的特徵，也說明判分程式只檢查相對順序，不比對固定序列。

## Common Mistakes

每一條都能用小輸入重現。第一，進入時就推入（pre-order）或做完忘了反轉：2 門課、限制 [[0,1]]（邊 1 → 0），外層從 0 開始，pre-order 得 [0, 1]，先修 1 卻排在後面；post-order 恰好也是 [0, 1]，忘了反轉輸出的就是這個錯序，反轉後的 [1, 0] 才對。第二，只用布林 visited：在 DAG 上它其實會得到正確順序，壞在無法判環——[[0,1],[1,0]] 互為先修，布林版照樣輸出 [0, 1] 而不是空陣列。第三，反過來把「鄰居已造訪」一律當成環：菱形 0→1、0→2、1→3、2→3，走完 0→1→3 後從 2 再看到 3 就誤報有環、回傳空陣列；已完成的鄰居只是路徑匯流，必須略過。第四，少了外層迴圈只從 0 出發：3 門課、限制 [[1,0]]，只會拿到 [0, 1]，孤立的課程 2 消失、長度不符。第五，邊的方向與反轉沒有綁在一起：[[1,0]] 建成 1 → 0 再反轉會輸出 [1, 0]；建「先修 → 課程」就要反轉，建「課程 → 先修」則 post-order 本身已是答案，兩者擇一。第六，遞迴深度：2000 門課排成一條長鏈會遞迴 2000 層，CPython 預設上限 1000 會拋 RecursionError，本機測試要先調高 sys.setrecursionlimit 或改用明確堆疊。

## Complexity

時間 O(V + E)：每個頂點恰好被標成造訪中與已完成各一次，每條邊在起點處理時被檢查一次，最後的反轉是 O(V)。空間 O(V)：狀態陣列、post 清單與遞迴堆疊各占 O(V)，遞迴最深的情況是一條長鏈；輸入本身的鄰接串列 O(V + E) 不計入。若用前端插入（JavaScript 的 unshift、Python 的 list.insert(0, x)）取代反轉，每次插入都要搬動整段陣列，總成本退化成 O(V^2)；尾端推入再一次反轉、或改用 deque 的 appendleft，才是線性。

## Digest

DFS 版拓樸排序：對每個頂點做 DFS，等它的所有後代都完成後才推入清單（post-order），最後反轉。它成立的理由是「邊 u → v 存在時，v 一定比 u 先完成」——v 未造訪就會被遞迴進去先做完，v 已完成則更早；v 正在造訪中則代表有環，在 DAG 中不可能。有環時這個保證失效，所以沿用三態標記，撞到造訪中的頂點就回報無解。實作要點：外層迴圈對所有頂點啟動 DFS（圖可能不連通、孤立頂點也要出現）、已完成的鄰居只是路徑匯流要略過、邊的方向與是否反轉要綁在一起。時間 O(V + E)，空間 O(V)。

## TypeScript Tip

st 0 未訪、1 造訪中、2 完成；斷言驗長度、順序與有環回空。

```typescript
import assert from 'node:assert';

function topo(n: number, pre: number[][]): number[] {
  const adj = Array.from({ length: n }, (): number[] => []);
  for (const [a, b] of pre) adj[b!]!.push(a!);
  const st = new Uint8Array(n);
  const out: number[] = [];
  const dfs = (u: number): boolean => {
    if (st[u]) return st[u] === 2;
    st[u] = 1;
    for (const v of adj[u]!) if (!dfs(v)) return false;
    st[u] = 2;
    out.push(u);
    return true;
  };
  for (let i = 0; i < n; i++) if (!dfs(i)) return [];
  return out.reverse();
}

const pre = [[1,0],[2,0],[3,1],[3,2]];
const o = topo(5, pre);
assert.equal(o.length, 5);
for (const [a, b] of pre) assert.ok(o.indexOf(b!) < o.indexOf(a!));
assert.deepEqual(topo(2, [[0,1],[1,0]]), []);
```

## Python Tip

`all(...)` 配產生器會在第一個 False 就短路，剛好對應「一發現環就停」。

```python
def topo(n: int, pre: list[list[int]]) -> list[int]:
    adj: list[list[int]] = [[] for _ in range(n)]
    for a, b in pre:
        adj[b].append(a)  # 先修 b → 課程 a
    st = [0] * n  # 0 未訪 1 造訪中 2 完成
    out: list[int] = []

    def dfs(u: int) -> bool:
        if st[u]:
            return st[u] == 2  # 1 ⇒ 撞到祖先：有環
        st[u] = 1
        if not all(dfs(v) for v in adj[u]):
            return False
        st[u] = 2
        out.append(u)
        return True

    if not all(dfs(i) for i in range(n)):
        return []
    return out[::-1]

pre = [[1, 0], [2, 0], [3, 1], [3, 2]]
res = topo(5, pre)
assert len(res) == 5  # 孤立的 4 也要出現
assert all(res.index(b) < res.index(a) for a, b in pre)
assert topo(2, [[0, 1], [1, 0]]) == []
```

## Takeaway

後代全部完成才推入、反轉 post-order 即拓樸序；邊 u → v 保證 v 先完成，撞到造訪中的頂點就是環、回空陣列。

## Tomorrow Preview

明天學拓樸排序的另一條路 Kahn's Algorithm：用 in-degree 與佇列，從沒有先修的課開始一層層剝除，不靠遞迴也能排序並判環。

## Today's Challenge

- **210** · 要回傳修完全部課程的一種合法順序、無法完成時回傳空陣列，正是「DAG 給一個拓樸序、有環回報無解」的完整流程，判環與排序一次做完。
  - Hint: [a, b] 是「先修 b 才能修 a」，建邊 b → a；三態 DFS 從每一門課出發，後代完成才推入，撞到造訪中就回傳空陣列，最後反轉。答案不唯一，判分只看相對順序。
