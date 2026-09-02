---
id: graph-connected-components-count
title: 圖形連通分量計算
module: dfs-bfs
pattern_label: Connected Components
complexity_label: O(V + E) / O(V)
estimated_minutes: 15
exit_criteria:
  - 能寫出外層迴圈配合內部 DFS/BFS 計算連通分量的樣板
  - 理解如何透過計數器追蹤獨立群組
---
## Concept

先課 Graph Connected Components 已經用 323 把這個 Pattern 教過一遍：component 是「任兩點皆有路徑」的極大節點集合；可達性是等價關係，所以每個節點恰屬於一個 component、孤立節點自成一個；計數骨架是「對 0 到 n-1 逐一檢查 visited，未造訪就 count 加一並啟動走訪」；正確性靠「每個 component 編號最小的節點輪到時必未造訪」。今天不是第一次教，題目也還是 323，今天的增量是三件事：一、把先課那個依賴節點編號的論證換成一條**迴圈不變式**，並把它成立的前提寫清楚——知道前提，才知道哪一行改掉會讓計數失效；二、補上先課沒展開的邊界：孤立點、自環、重複邊、n 為 0；三、把同一副骨架搬到二維網格——這是 DFS／BFS 模組接手這個 Pattern 的理由，先課只用一句話帶過。

## Thinking

先寫前提，再寫命題。三個前提：(P1) 鄰接表對稱——每條邊 (a, b) 同時放進 adj[a] 與 adj[b]；(P2) visited 是**全域**的，整段程式只建立一次，起點之間不重設；(P3) 每次走訪把「從起點可達且尚未造訪」的節點**全部**標記完才停，不提前離開。

不變式：外層迴圈每一輪開始前，(I1) visited 恰等於「已啟動過的那些 component」的聯集；(I2) count 等於已啟動的 component 個數。開始時兩者都是空的，成立。

歸納一步，輪到節點 s。若 s 已造訪，由 I1 它屬於某個已啟動的 component，跳過，什麼都沒變。若 s 未造訪，令 C 是 s 所在的 component。C 不可能啟動過——否則 C 全體（含 s）都在 visited 裡；而且 C 與 visited 不相交，因為 visited 是其他 component 的聯集，而 component 兩兩不重疊（先課用等價關係證過）。於是從 s 出發：P1 保證可達集合恰是 C（少了對稱，可達集合可能只是 C 的一部分）；P2 與 P3 保證 C 全部被標記。visited 變成舊聯集加上 C、count 加一，I1、I2 都維持。迴圈結束時每個節點都被檢查過且都已造訪，所以每個 component 恰啟動一次，count 就是 component 數。

這段論證**沒有用到節點編號**：外層用任何順序走都行，內層走訪 DFS 或 BFS、遞迴或迭代都行。這正是它能搬到網格的原因——節點換成格子 (r, c)、邊換成「四方向相鄰且同為陸地」、外層迴圈換成 r 套 c 的雙層迴圈，不變式一字不改。

邊界：孤立點沒有邊，輪到它時必未造訪，自己啟動一次、走訪立刻結束，計 1——所以外層一定要走過**每一個節點**，不能只走邊的端點。自環 (u, u) 讓 u 在 adj[u] 出現兩次、重複邊讓同一個 v 出現兩次，但 `if v not in seen` 會把第二次擋掉，計數不受影響。n 為 0 時外層不執行，回 0。

## Pattern Recognition

辨識線索與先課相同：問「有幾個」互不相通的群體——省份、朋友圈、島嶼、獨立子網路——就是它；「圖是否連通」等於 count 是否為 1。今天多兩條：一、節點不是 0 到 n-1 的整數時（座標、字串 key、Map 的鍵），先課靠編號的論證不好直接套，改用今天的不變式；二、輸入是二維網格時不要真的建鄰接表，鄰居就地由座標偏移算出，四個方向各寫一次。方向仍是分水嶺：有向圖的強連通分量要 Kosaraju 或 Tarjan，不在今天範圍。

## Common Mistakes

以下每一條都是拿本篇 Tip 的程式碼改一處實測的結果；前兩條各破壞一個前提，第三條破壞的是「外層要走過每個節點」。

一、visited 隨起點重設（破壞 P2）：把 Python Tip 的 `seen: set[int] = set()` 那一行移進 `for s in range(n):` 迴圈體內、放在 `if s in seen:` 之前，`count_components(4, [[2, 1], [1, 0]])` 得 4——每個節點輪到時都是「未造訪」，count 變成節點數；正解 2。

二、鄰接表只加單向（破壞 P1）：刪掉 Python Tip 的 `adj[b].append(a)` 那一行，同一組測資得 4。但若 n 同樣是 4、邊改成 `[[0, 1], [1, 2]]`，單向版仍得正確的 2——邊恰好都從低編號指向高編號，外層從 0 出發沿單向邊照樣走得完。要抓這個錯，測資必須含「高編號指向低編號」的邊，先課挑 `[[2, 1], [1, 0]]` 就是這個理由。

三、只走邊的端點、漏掉孤立點：把 Python Tip 的 `for s in range(n):` 改成 `for s in {x for e in edges for x in e}:`，`count_components(3, [[1, 1]])` 得 1（只看到節點 1），正解 3。

四、網格只寫部分方向：把 TypeScript Tip 的 `dirs` 刪掉 `[-1, 0]`（上），測資 `["01010", "11110", "00001"]` 得 3；刪掉 `[0, -1]`（左）也得 3；正解 2。外層由上到下、由左到右，先碰到的格子必落在 component 最上一列，但未必是最左的一格；走訪只能沿格子間的路徑前進，可能要先向下、再往上或往左，才走得到同一塊的其他格子，所以四個方向缺一不可。

先課已列的三條——計數器放進走訪內部、套 n 減邊數的公式、Python 遞迴深度——這裡不重複。

## Complexity

時間 O(V + E)：外層迴圈 O(V)；所有走訪合計每個節點標記一次、每條邊從兩端各檢查一次——已造訪的節點只被跳過，不會重走，所以不是「V 次走訪各 O(V + E)」。網格上 V = R * C、E 最多 2 * R * C，合起來 O(R * C)。空間 O(V)：全域 visited 加上 stack 或佇列的最壞深度；網格上就是 O(R * C)；若要自建鄰接表再加 O(V + E)。

## Digest

先課已用 323 教過 connected component 的定義與計數骨架；今天補論證的前提、邊界與網格版。前提：(P1) 鄰接表對稱；(P2) visited 全域、起點之間不重設；(P3) 每次走訪把可達且未造訪的節點全部標記。不變式：每輪外層迴圈開始前，visited 恰是已啟動 component 的聯集、count 是已啟動的個數；輪到未造訪的 s 時，它所在的 component 尚未啟動且與 visited 不相交，走訪恰好標記它整個、count 加一。所以在三個前提下，每個 component 恰啟動一次，count 等於 component 數，且與外層順序、DFS 或 BFS 無關。邊界：孤立點自成一個（外層要走過每個節點，不能只走邊的端點）；自環與重複邊被 `if v not in seen` 擋掉；n 為 0 回 0。網格版：節點是格子、鄰居是四方向的同類格子、外層變雙層迴圈，四個方向缺一不可。時間 O(V + E)、空間 O(V)；網格 O(R * C)。

## TypeScript Tip

網格版：外層是雙層迴圈，鄰居由座標偏移算出；`g[x + dx]?.[y + dy]` 越界時是 undefined，順便擋掉出界。

```typescript
function countIslands(g: string[]): number {
  const seen = g.map((row) => Array.from(row, () => false));
  const dirs: [number, number][] = [[-1, 0], [1, 0], [0, -1], [0, 1]];
  const dfs = (x: number, y: number): void => {
    seen[x]![y] = true;
    for (const [dx, dy] of dirs)
      if (g[x + dx]?.[y + dy] === "1" && !seen[x + dx]![y + dy]) dfs(x + dx, y + dy);
  };
  let count = 0;
  for (let r = 0; r < g.length; r++) for (let c = 0; c < g[r]!.length; c++)
    if (g[r]![c] === "1" && !seen[r]![c]) { count++; dfs(r, c); }
  return count;
}
if (countIslands(["01010", "11110", "00001"]) !== 2) throw new Error("bad");
if (countIslands([]) !== 0) throw new Error("bad");
```

## Python Tip

邊清單版，與先課同一副骨架，這裡用 set 加 stack；三組測資分別抓單向建圖、自環與孤立點、n 為 0。

```python
def count_components(n: int, edges: list[list[int]]) -> int:
    adj: list[list[int]] = [[] for _ in range(n)]
    for a, b in edges:
        adj[a].append(b)
        adj[b].append(a)
    seen: set[int] = set()
    count = 0
    for s in range(n):
        if s in seen:
            continue
        count += 1
        seen.add(s)
        stack = [s]
        while stack:
            u = stack.pop()
            for v in adj[u]:
                if v not in seen:
                    seen.add(v)
                    stack.append(v)
    return count

assert count_components(4, [[2, 1], [1, 0]]) == 2
assert count_components(3, [[1, 1]]) == 3
assert count_components(0, []) == 0
```

## Takeaway

鄰接表對稱、visited 全域不重設、走訪走完整——三個前提下，每個 component 恰啟動一次，啟動次數就是答案。

## Tomorrow Preview

明天是無向圖環路偵測：同一副 DFS 走訪骨架，多傳一個 parent 參數——遇到已造訪的鄰居而它不是父節點，就代表圖中有環。

## Today's Challenge

- **323** · 先課已用它練過計數骨架；今天重解時把三個前提對照到你的程式碼，並確認孤立節點各算一個。
  - Hint: 每條邊雙向加進鄰接表；visited 只建一次；對 0 到 n-1 逐一檢查，未造訪就 count 加一並走訪到底。
- **2668** · 這是一題資料庫題：每位員工有多筆薪資紀錄，要取出每人最新的一筆。它與連通分量無關，是配題錯置；請把練習重心放在 323。
  - Hint: 薪資逐年遞增，所以「最新」等於「最大」：依員工分組取 MAX(salary)，再依員工編號排序輸出。
