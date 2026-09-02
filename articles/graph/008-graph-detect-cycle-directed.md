---
id: graph-detect-cycle-directed
title: Graph Detect Cycle in Directed Graph
module: graph
pattern_label: Cycle Detection
complexity_label: O(V + E) / O(V)
estimated_minutes: 15
exit_criteria:
  - 能區分全域已造訪的節點與目前位於遞迴堆疊中的節點。
---
## Concept

有向圖的環是一條順著邊的方向走、最後回到起點的路徑。昨天的 parent 排除法在這裡失效：無向邊 A–B 是同一條邊的兩面，有向邊 A→B 與 B→A 卻是兩條不同的邊，兩條都在就是一個真正的環；沿用「鄰居是 parent 就跳過」會把它放過。

反過來，只用一個布林 visited 又會誤報。看菱形：0→1、0→2、1→2。從 0 進 1、再進 2，2 沒有出邊，結束；回到 0 掃第二個鄰居 2 時，2 已造訪——但 0→2 只是抵達同一個節點的第二條路，不是走回自己，圖裡沒有環。無向圖不會發生這種情形，因為無向 DFS 在節點結束前一定把它所有鄰居都造訪完了，已造訪的鄰居必定和自己在同一條樹路徑上；有向圖的邊只能單向走，「已造訪」不再保證「有路回到我」。

所以有向圖要把「已造訪」拆成兩種：灰（正在目前的遞迴路徑上、尚未完成）與黑（連同它能到達的所有節點都已處理完畢）。判準：遇到灰色鄰居 w，表示從 w 沿目前路徑能走到 u，再加上 u→w 就是環；遇到黑色鄰居可以直接略過。為什麼黑色安全？w 轉黑時，從 w 出發能到達的每個節點都已完成（也轉黑），而灰色節點還沒完成，所以 w 到不了任何灰色節點，u→w 這條邊接不回目前路徑。為什麼不會漏報？若有環，取環上最先被造訪的節點 x：x 轉黑之前，從它出發可達的節點（包含整個環）都會被走完，環上 x 的前一個節點會在 x 還是灰色時被造訪，掃到 x 就命中判準。

## Thinking

狀態陣列 state：0 白、1 灰、2 黑。`dfs(u)`：u 是灰就回報有環；u 是黑就回報無環；否則把 u 塗灰，遞迴每個出邊鄰居，任一回報有環就往上傳；全部回來後把 u 塗黑。外層對 0 到 n-1 每個節點呼叫 dfs——有向圖沒有「連通」可以依賴，環可能藏在從 0 出發到不了的地方。也可以從「遞迴堆疊」的角度理解：灰色集合就是此刻呼叫堆疊裡的節點，用一個 set 在進入時加入、離開時移除，再配一個 done 集合記黑色，效果完全相同。

Course Schedule：prerequisites 的 [a, b] 表示修 a 之前要先修 b，建成邊 b→a。能修完所有課程 ⇔ 先修圖沒有環。建成 a→b 也行——把所有邊反向，環還是環，只是繞的方向相反；方向要對，是明天要排出順序時的事。

## Pattern Recognition

訊號：先修條件、任務依賴、套件安裝順序、「是否可能全部完成」、死結（deadlock）偵測——凡是「A 必須在 B 之前」這種有方向的限制，問「有沒有矛盾」就是有向圖判環。輸入常是依賴對的清單，要先自己建 adjacency list，並想清楚邊的方向代表什麼。

## Common Mistakes

一、單一布林 visited：菱形 0→1、0→2、1→2 被判成有環；對應 Course Schedule 的 [[1,0],[2,0],[2,1]]，該回 true 卻回 false。二、忘記在離開時塗黑：節點完成後仍是灰色，效果與單布林完全相同，同一個菱形一樣誤報。三、離開時塗回白色（照搬回溯寫法）：答案仍正確，但節點會被反覆重新展開，k 層菱形串起來有 2^k 條路徑，2000 門課直接超時。四、沿用昨天的 parent 排除法：[[1,0],[0,1]] 互為先修是真環，卻因為「鄰居是 parent」被跳過而回報可以修完。五、只從節點 0 出發：n=3、[[2,1],[1,2]] 的環不含 0，不對每個白色節點發起 DFS 就漏掉。六、Python 遞迴深度：2000 門課串成一條鏈深度 2000，超過預設上限 1000 會拋 RecursionError，要拉高上限或改用顯式堆疊。

## Complexity

時間 O(V + E)：每個節點只會由白轉灰、再轉黑各一次，之後再被碰到都是 O(1) 回傳；每條出邊只在它的起點展開時掃一次。空間 O(V)：狀態陣列加上遞迴深度，圖排成一條長鏈時深度達 V。

## Digest

有向圖判環不能沿用無向圖的 parent 排除法（A→B 與 B→A 是真環），單一布林 visited 又會把菱形 0→1、0→2、1→2 這種「兩條路到同一點」誤報成環。正解是三色：白未造訪、灰在目前遞迴路徑上、黑已完成。遇灰即環（從它沿路徑能回到自己）；遇黑安全（黑色節點能到達的一切都已完成，接不回灰色路徑）；有環時環上最先造訪的節點仍是灰色時就會被前一個節點掃到，不會漏報。外層要對每個白色節點發起 DFS。Course Schedule 的 [a, b] 建成 b→a，能修完 ⇔ 無環，邊全部反向答案不變。時間 O(V + E)，空間 O(V)。

## TypeScript Tip

三色 DFS；三組測資各殺掉一種錯誤寫法。

```typescript
import assert from 'node:assert';

function canFinish(n: number, pre: [number, number][]): boolean {
  const adj: number[][] = Array.from({ length: n }, () => []);
  for (const [a, b] of pre) adj[b]!.push(a); // 先修 b → 課程 a
  const state = new Uint8Array(n); // 0 白、1 灰、2 黑
  const dfs = (u: number): boolean => {
    if (state[u] === 1) return true;  // 灰：環
    if (state[u] === 2) return false; // 黑：安全
    state[u] = 1;
    for (const w of adj[u]!) if (dfs(w)) return true;
    state[u] = 2;
    return false;
  };
  for (let u = 0; u < n; u++) if (dfs(u)) return false;
  return true;
}

assert.ok(canFinish(3, [[1, 0], [2, 0], [2, 1]])); // 菱形：無環
assert.ok(!canFinish(2, [[1, 0], [0, 1]])); // 互為先修
assert.ok(!canFinish(3, [[2, 1], [1, 2]])); // 環不含 0
```

## Python Tip

兩個 set 表達灰與黑；最後一組是 2000 層長鏈，不拉高遞迴上限會 RecursionError。

```python
import sys
sys.setrecursionlimit(10_000)

def can_finish(n: int, pre: list[list[int]]) -> bool:
    adj = [[] for _ in range(n)]
    for a, b in pre:
        adj[b].append(a)  # 先修 b → 課程 a
    gray, black = set(), set()
    def dfs(u: int) -> bool:
        if u in gray:
            return True
        if u in black:
            return False
        gray.add(u)
        for w in adj[u]:
            if dfs(w):
                return True
        gray.remove(u)
        black.add(u)
        return False
    return not any(dfs(u) for u in range(n))

assert can_finish(3, [[1, 0], [2, 0], [2, 1]]) is True  # 菱形
assert can_finish(3, [[2, 1], [1, 2]]) is False
assert can_finish(2000, [[i + 1, i] for i in range(1999)]) is True
```

## Takeaway

有向圖判環用三色：遇灰即環、遇黑略過、離開塗黑；parent 排除法與單布林 visited 都會出錯。

## Tomorrow Preview

明天用同一套三色 DFS 做拓樸排序：節點「轉黑的那一刻」其實藏著順序資訊，把它記下來就能排出所有課程的修課順序。

## Today's Challenge

- **207** · 「能否修完所有課程」等價於「先修圖是否無環」；這是有向圖，昨天的 parent 排除法會放過互為先修的兩門課，正好練今天的三色 DFS。
  - Hint: 每對 [a, b] 建邊 b→a；對每個白色節點跑 DFS，遇灰即環、遇黑略過、離開塗黑；任一處發現環就回傳 false。
