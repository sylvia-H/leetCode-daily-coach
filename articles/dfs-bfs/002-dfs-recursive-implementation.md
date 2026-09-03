---
id: dfs-recursive-implementation
title: 遞迴式 DFS 實作
module: dfs-bfs
pattern_label: DFS Recursive
complexity_label: O(V + E) / O(V)
estimated_minutes: 15
exit_criteria:
  - 能寫出標準的遞迴式 DFS 結構
  - 理解遞迴基底條件與遞迴呼叫的關係
---
## Concept

遞迴式 DFS 你其實已經寫過很多次：tree 模組用 bottom-up 回傳 `1 + max(左, 右)` 求最大深度、再用 top-down 把 depth 當參數往下傳；graph 模組的 Graph DFS Traversal 那課用「進入即標記、先查邊界再讀格子」在格子圖上數島嶼；數連通塊、偵測環、排拓樸順序與整個回溯法模組也都靠它。今天不換題目，而是把這些寫法都依賴、卻沒有拆開講的機制攤開：遞迴本身。

每呼叫一次函式，執行環境就在呼叫堆疊（call stack）上壓入一個 frame，裡面放這次呼叫的參數、區域變數，以及「返回後從哪一行繼續」。DFS 的「走不動就回溯」不需要你寫任何一行：目前 frame 的迴圈把鄰居掃完、函式返回、frame 彈出，控制權自動回到上一個 frame 的迴圈裡，接著掃它的下一個鄰居。所以此刻堆疊上所有 frame 的參數由底到頂排起來，就是 DFS 正在走的那條路徑。

一支遞迴函式只有三個部件：base case（什麼情況下不再呼叫自己、直接返回）、recursive case（對每個鄰居或子節點呼叫自己）、以及夾在中間的當前節點處理。它為什麼會停？因為每次真正進入（通過 base case 之後）都把剩下的工作量削掉一塊：樹上是子樹越來越小，空樹就是底；格子圖上是「還沒改成 '0' 的格子」越來越少——前提是進入時就改寫、而且已標記的格子會被 base case 擋在門外，也就是那課的「進入即標記」。只要每次進入都讓某個不會小於 0 的量嚴格變小，進入次數就有上限；被 base case 擋下的呼叫只是立刻返回，不會再往下長，所以總呼叫次數也有上限，遞迴一定終止。反之，進入時沒標記就往鄰居遞迴，那個量從來沒變小，堆疊就會一路長到溢位。

## Thinking

寫遞迴式 DFS 的固定順序：第一，決定簽章——傳進去的是節點還是座標；答案靠回傳值向上組合（bottom-up），還是靠參數與外層變數向下累積（top-down）。第二，先寫 base case，而且放在任何讀取之前：空節點、界外、不符合條件、已造訪，都要在讀欄位或讀格子之前擋掉。第三，處理當前節點（標記、計數）。第四，對每個鄰居遞迴。第五，bottom-up 的組合寫在遞迴呼叫之後，才拿得到已算好的子結果。

遞迴與顯式堆疊的對應要說精確。Graph DFS Traversal 那課的顯式堆疊版是「彈出一個頂點、未造訪就標記、把所有鄰居一次推入」，它是合法的 DFS，但走訪順序與遞迴版不同：遞迴版一次只深入一個鄰居，其餘鄰居要等這條分支整個回溯後才輪到。要逐行重現遞迴版，堆疊上的每一筆必須就是一個 frame：（頂點，下一個要掃的鄰居索引）——每次只看堆疊頂端那筆，推進索引、遇到未造訪的鄰居就壓入新 frame、鄰居掃完才彈出。下方 TypeScript Tip 用同一張含環的圖驗證兩者順序逐字相同。

遞迴深度是有代價的：堆疊最深時的 frame 數等於最長的一條探索路徑。樹上是樹高 h；格子圖最壞是全部格子——一張 40×40 全是陸地的格子，以「下、上、右、左」的順序遞迴，DFS 會蛇行穿過全部 1600 格才第一次回溯，堆疊深度就是 1600。Python 預設遞迴上限 1000，這張圖直接拋 `RecursionError`；Node.js 的預設堆疊約可容納一萬層上下（視 frame 大小而定）。題目上限可能讓深度到數萬層時，就改寫成顯式堆疊，或在 Python 用 `sys.setrecursionlimit` 提高上限。

## Pattern Recognition

結構本身是遞迴定義的（子樹也是樹、巢狀結構每一層長得一樣），或答案是子問題答案的組合，遞迴式 DFS 就是最短的寫法。需要「走到底再回頭試下一條，而且回頭時自動恢復到分岔前的狀態」也是它的主場——區域變數活在 frame 裡，frame 彈出就自動恢復。三個訊號要改用顯式堆疊：深度可能達數千層以上；需要中途暫停、之後再繼續走訪；語言的遞迴上限比題目規模小。要「最少幾步」則不是 DFS 的事，那是 BFS 的保證。

## Common Mistakes

以下每條都用本篇 Tip 的程式碼實測過。第一，遞迴呼叫沒有讓引數往 base case 前進：刪掉 Python Tip 的 `grid[r][c] = "0"` 那行，`[["0","1","1"],["1","1","0"]]` 上 (0, 1) 與 (1, 1) 會互相呼叫直到 `RecursionError`。第二，跨 frame 共享的狀態在回溯時沒有復原：區域變數隨 frame 彈出自動消失，`nonlocal` 或外層變數不會。刪掉 Python Tip 的 `depth -= 1`，同一張格子的「最深層數」從 3 變成 4——它數的成了造訪過的格子數。第三，把「一次推入所有鄰居」的顯式堆疊版當成遞迴版的逐行翻譯：TypeScript Tip 那張圖的遞迴順序是 `[0, 1, 3, 2]`，一次推入所有鄰居會得到 `[0, 2, 3, 1]`；兩者都是合法 DFS，但題目若要求輸出與遞迴版一致的走訪序列，後者就錯了。第四，忽略深度上限：拿掉 Python Tip 的 `sys.setrecursionlimit(3000)`，40×40 全陸地格子在第 1000 層附近拋 `RecursionError`——不是邏輯錯，是遞迴這個實作方式的物理極限。

## Complexity

時間 O(V + E)：每個頂點進入 frame 一次，每條邊在兩端掃鄰居時各被檢查一次；格子圖每格最多四條邊，就是 O(m×n)。空間 O(V)：呼叫堆疊最深等於最長探索路徑——樹是 O(h)，格子圖最壞 O(m×n)（全陸地蛇行）；若另用 visited 容器再加 O(V)。顯式堆疊版的空間同樣是 O(V) 等級，但它用的是堆積（heap）記憶體，不受語言的呼叫堆疊上限約束。

## Digest

遞迴式 DFS 把「走到底再回頭」交給呼叫堆疊：每次呼叫壓入一個 frame（參數、區域變數、返回點），鄰居掃完就彈出，控制權自動回到上一層的迴圈。三個部件：base case 先寫、放在任何讀取之前；處理當前節點；對每個鄰居遞迴。它會終止的前提是每次真正進入都讓某個不會小於 0 的量嚴格變小（子樹變小、未標記格子變少）；被 base case 擋下的呼叫立刻返回，所以標記要在遞迴之前完成。顯式堆疊要逐行對應遞迴版，每筆要記（頂點，下一個鄰居索引）；「一次推入所有鄰居」是另一種合法但順序不同的 DFS。代價在深度：格子圖最壞會蛇行到 m×n 層，Python 預設上限 1000，深圖改用顯式堆疊。時間 O(V + E)、空間 O(V)。

## TypeScript Tip

每筆堆疊項＝一個 frame，與遞迴版順序逐字相同。

```typescript
import assert from "node:assert";

function rec(adj: number[][], u: number, seen = new Set<number>(), out: number[] = []): number[] {
  seen.add(u); out.push(u);
  for (const v of adj[u] ?? []) if (!seen.has(v)) rec(adj, v, seen, out);
  return out;
}
function iter(adj: number[][], s: number): number[] {
  const seen = new Set([s]), out = [s], st: [number, number][] = [[s, 0]];
  while (st.length) {
    const f = st.at(-1)!, v = adj[f[0]]?.[f[1]];
    if (v === undefined) { st.pop(); continue; } // 掃完＝彈出
    f[1] += 1;
    if (!seen.has(v)) { seen.add(v); out.push(v); st.push([v, 0]); }
  }
  return out;
}
const adj = [[1, 2], [0, 3], [0, 3], [1, 2]];
assert.deepEqual(rec(adj, 0), [0, 1, 3, 2]);
assert.deepEqual(iter(adj, 0), rec(adj, 0));
```

## Python Tip

全陸地格子會蛇行到 m×n 層。

```python
import sys

def islands(grid):  # (島嶼數, 最深層)
    rows, cols = len(grid), len(grid[0])
    depth = best = count = 0
    def sink(r, c):
        nonlocal depth, best
        if r < 0 or c < 0 or r >= rows or c >= cols or grid[r][c] != "1":
            return
        grid[r][c] = "0"  # 進入即標記
        depth += 1; best = max(best, depth)
        for dr, dc in ((1, 0), (-1, 0), (0, 1), (0, -1)):
            sink(r + dr, c + dc)
        depth -= 1  # 彈出時自己復原
    for r in range(rows):
        for c in range(cols):
            if grid[r][c] == "1":
                count += 1; sink(r, c)
    return count, best

assert islands([list("011"), list("110")]) == (1, 3)
sys.setrecursionlimit(3000)  # 預設 1000 不夠
assert islands([["1"] * 40 for _ in range(40)]) == (1, 1600)
```

## Takeaway

遞迴式 DFS 靠 frame 壓入與彈出自動回溯；base case 放在讀取之前、每次進入都要讓某個不為負的量變小；深度最壞到 V，深圖改顯式堆疊。

## Tomorrow Preview

明天專講 DFS 已造訪狀態管理：用 Hash Set 或布林陣列記錄造訪狀態、在有環的圖上確保每個頂點只處理一次，並比較「進入節點時標記」與「離開節點時清除」的時機差異。

## Today's Challenge

- **200** · 你在 Graph DFS Traversal 那課已用「進入即標記、先查邊界再讀格子」解過這題。今天重解時看的是遞迴本身：數一數最深遞迴到幾層（全陸地格子會蛇行到 m×n），再改寫成顯式堆疊版、確認島嶼數相同。
  - Hint: 沿用那課的骨架（外層掃格子、遇 '1' 計數並呼叫 DFS；DFS 先判界外或非 '1' 就返回，再改 '0'，再遞迴四方向）。顯式版：彈出一格，同樣先判界外、仍是 '1' 才改 '0' 並推入四鄰居。
- **104** · 這是你第四次見到這題：Queue 模組用佇列逐層數層數、tree 模組用 bottom-up 回傳 `1 + max(左, 右)`、再用 top-down 帶 depth 往下傳。今天請對照三種寫法的狀態放在哪：佇列裡、回傳值裡、參數裡——後兩者都活在呼叫堆疊的 frame 中。
  - Hint: 用 bottom-up 寫，`null` 回傳 0；再對一條 n 個節點的斜樹想像堆疊最深時掛著 n 個 frame，這就是 O(h) 空間的來源。
