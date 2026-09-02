---
id: dfs-visited-state-management
title: DFS 已造訪狀態管理
module: dfs-bfs
pattern_label: Visited Tracking
complexity_label: O(V) / O(V)
estimated_minutes: 15
exit_criteria:
  - 能在圖形有環的情況下正確使用 visited 陣列或集合
  - 理解在進入節點前與離開節點時標記狀態的時機差異
---
## Concept

昨天把遞迴式 DFS 拆成 base case、當前節點處理、對鄰居遞迴三個部件，並說它會終止的前提是「每次真正進入都讓某個不會小於 0 的量嚴格變小」。樹上這個量是子樹大小，不需要任何額外記錄；圖上就沒有現成的量——圖可以有環，從 u 走到 v 再走回 u，子問題沒有變小。今天只講讓那個量存在的東西：visited 狀態。

先把它定義清楚。設 visited 為「曾經進入過的頂點集合」，且標記一旦設下就不清除。在這個前提下，遞迴式 DFS 的每一次遞迴呼叫都先被 `!visited` 擋過、進入時立刻加入 visited，所以「未標記頂點數」在每次進入時嚴格減一；它從 V 開始、不會小於 0，進入次數最多 V 次，遞迴一定終止。每條邊在兩端各被掃一次，時間 O(V + E)；格子圖每格最多四條邊，就是 O(V)。這條論證只用到兩件事：標記在掃鄰居之前完成、標記永不清除。今天的三個問題都繞著它們：什麼時候標、標在哪、以及什麼情況下你會刻意違反第二條。

visited 還有另一種語意：「在目前這條路徑上的頂點」。要列舉所有簡單路徑時，一個頂點在這條路徑用過、在另一條路徑還能再用，所以進入時標記、離開時清除。此時上面的論證失效——那個量不再單調——演算法仍然終止，因為一條簡單路徑最長 V 個頂點，但呼叫次數等於從起點出發的簡單路徑數，最壞是指數級。兩種語意用同一個容器、只差一行 `delete`，混用就是今天最常見的錯。

## Thinking

第一問：這題要每個頂點處理一次，還是每條路徑處理一次？問「有幾塊」「能不能到」「把相連的都改掉」「哪些被包圍」是前者，永久標記；問「所有路徑」「有沒有一條不重複的走法」是後者，進入時標記、離開時清除。

第二問：標在哪一行？永久標記放在 base case 之後、掃鄰居之前的第一行；等價寫法是呼叫 `dfs(v)` 之前先標 v，起點在外面先標。兩者維持同一條不變式：此刻在呼叫堆疊上的每個頂點都已標記，所以任何鄰居都不可能再進入堆疊上的頂點，環在第一步就被擋下。標記放在迴圈之後（離開時才標）就打破不變式：一條無向邊 u–v 本身就是環，v 看到 u 未標記又進去。

第三問：容器放哪？可變的格子圖可以就地標記——把格子改寫成一個「再進來會被 base case 擋下」的值（陸地 '1' 改 '0'、像素改成新色），省掉容器，但要滿足一個前提：改寫後的值必須與未造訪的值可區分。填色時新色等於原色，改完的格子看起來跟沒改一樣，`!= old` 擋不住，會無限遞迴，得先判同色直接回傳。有時標記本身要攜帶資訊：找被包圍區域時，從邊界的 'O' 啟動 DFS，走到的格子不能直接改成 'X'——最後一趟就分不出「本來就是 X」與「不被包圍」——要改成第三個符號，最後再一趟解碼。不能改輸入、或頂點不是格子時，用額外容器：布林陣列（頂點是 0 到 V-1 的整數）、`Set<number>` 存 `r * cols + c`、或 `Set<string>` 存 `"r,c"`（多一次字串組裝，但最直覺）；Python 用 `set` 存 `(r, c)` tuple。

## Pattern Recognition

輸入是圖或格子而且可能有環——無向圖的任一條邊都是來回的環，格子圖的四鄰居關係也是——就一定要有 visited。訊號：連通塊、填色、包圍、可達性，永久標記；所有路徑、單字搜尋、不重複走法，路徑標記（離開時清除）。樹是例外：父子單向、無環，昨天的寫法不用 visited；但一旦樹的邊被當成無向（節點有 parent 指標、或用鄰接表存樹），它就是圖，照樣要標。

## Common Mistakes

以下每條都以本篇 Tip 的程式碼實測。第一，離開時才標記：把 TypeScript Tip `reach` 裡的 `seen.add(u);` 移到 `for` 迴圈之後，`0-1` 這條邊就讓 `reach` 在 0 與 1 之間互相呼叫直到 `RangeError: Maximum call stack size exceeded`。第二，列舉路徑卻用永久標記：刪掉 TypeScript Tip `paths` 的 `onPath.delete(u);`，同一張圖從 0 到 3 的簡單路徑從 4 條數成 2 條——先走的分支把 2 標掉，`0-2-3`、`0-2-1-3` 再也進不去。第三，可達性卻用路徑標記：在 `reach` 的 `for` 迴圈後補一行 `seen.delete(u);`，結束時 seen 是空的、答案直接錯，而且呼叫次數變成從起點出發的簡單路徑數——四個頂點的完全圖 16 次、八個頂點 13700 次，永久標記各只要 4 次與 8 次。第四，就地標記的值與原值不可區分：拿掉 Python Tip 的 `if old == color: return img`，`[[1, 1], [1, 1]]` 以新色 1 填色，每格改完仍等於 old，四格互相呼叫直到 `RecursionError`。

## Complexity

永久標記：每個頂點進入一次、每條邊掃兩次，O(V + E)；格子圖 E 不超過 4V，所以是 O(V)。空間 O(V)：visited 容器 O(V)（就地標記為 0），加上呼叫堆疊最深 O(V)。路徑標記（離開時清除）：時間等於從起點出發的簡單路徑數，最壞指數級（完全圖是 (V-1)! 量級）；空間仍 O(V)，因為堆疊與容器上同時只掛著一條路徑。

## Digest

visited 有兩種語意，先選對再動筆。永久標記：visited＝曾經進入過的頂點，進入時（掃鄰居之前）加入、永不清除；在這個前提下「未標記頂點數」每次進入嚴格減一，含環的圖也最多進入 V 次，時間 O(V + E)，格子圖就是 O(V)。路徑標記：visited＝目前路徑上的頂點，進入時加入、離開時清除，用來列舉所有簡單路徑；仍會終止但呼叫次數等於從起點出發的簡單路徑數，最壞指數級。標在哪：可變格子就地改寫成會被 base case 擋下的值，前提是改寫後的值與未造訪的值可區分（填色時新舊同色要先判掉）；標記要攜帶資訊就用第三個符號、最後解碼；不能改輸入就用布林陣列或 Set。不變式：堆疊上的每個頂點都已標記，環才擋得住。

## TypeScript Tip

同一張含環的圖：永久標記數可達頂點，離開時清除數簡單路徑。

```typescript
import assert from "node:assert";

function reach(adj: number[][], u: number, seen = new Set<number>()): number {
  seen.add(u); // 進入即標記、永不清除
  for (const v of adj[u] ?? []) if (!seen.has(v)) reach(adj, v, seen);
  return seen.size;
}
function paths(adj: number[][], s: number, t: number): number {
  const onPath = new Set<number>();
  const dfs = (u: number): number => {
    if (u === t) return 1;
    onPath.add(u);
    let n = 0;
    for (const v of adj[u] ?? []) if (!onPath.has(v)) n += dfs(v);
    onPath.delete(u); // 離開時清除
    return n;
  };
  return dfs(s);
}
const adj = [[1, 2], [0, 2, 3], [0, 1, 3], [1, 2]]; // 含環
assert.equal(reach(adj, 0), 4);
assert.equal(paths(adj, 0, 3), 4); // 0-1-3、0-2-3、0-1-2-3、0-2-1-3
```

## Python Tip

就地標記：改色就是 visited；新舊同色時改完分不出來，必須先判掉。

```python
def flood_fill(img: list[list[int]], sr: int, sc: int, color: int) -> list[list[int]]:
    old = img[sr][sc]
    if old == color:
        return img  # 改成同色＝沒標記，不擋會無限遞迴
    rows, cols = len(img), len(img[0])
    def fill(r: int, c: int) -> None:
        if r < 0 or c < 0 or r >= rows or c >= cols or img[r][c] != old:
            return
        img[r][c] = color  # 改色即標記：再進來會被 != old 擋下
        for dr, dc in ((1, 0), (-1, 0), (0, 1), (0, -1)):
            fill(r + dr, c + dc)
    fill(sr, sc)
    return img

assert flood_fill([[1, 1, 0], [1, 0, 1], [1, 1, 1]], 0, 1, 2) == [[2, 2, 0], [2, 0, 2], [2, 2, 2]]
assert flood_fill([[1, 1], [1, 1]], 0, 0, 1) == [[1, 1], [1, 1]]  # 同色：拿掉判斷會 RecursionError
```

## Takeaway

visited 先選語意：永久標記（進入即標、永不清除）擋環保 O(V)；路徑標記（離開時清除）列舉路徑；就地標記的值必須與未造訪可區分。

## Tomorrow Preview

接下來三課都建立在今天的 visited 之上：BFS 與佇列層級走訪（用 Queue 逐層向外擴散、FIFO 在層級搜尋中的角色）、二維網格的 DFS 探索（用方向陣列走四鄰居、邊界檢查）、圖形連通分量計算（外層迴圈配合計數器，每啟動一次搜尋就是一個群組）。

## Today's Challenge

- **733** · 就地標記的最小案例：像素改成新色本身就是 visited，不需要額外容器。唯一的陷阱是新色等於原色——「已填」與「未填」無法區分，會無限遞迴；本篇 Python Tip 就是這題的完整骨架。
  - Hint: 先記下起點原色，等於新色就直接回傳原圖；DFS 進入時判界外或非原色就返回，改色後再遞迴四方向。
- **130** · 反過來想：從四條邊界上的 'O' 啟動 DFS，走得到的 'O' 都不被包圍。這題的 visited 要攜帶資訊，直接改成 'X' 會在最後一趟與原本的 'X' 混在一起，必須用第三個符號。
  - Hint: 對邊界的每個 'O' 呼叫 DFS 改成暫記號（如 '#'），角落重複啟動無害（已是 '#' 會立刻返回）；走完後全盤掃描：'O' 改 'X'、'#' 改回 'O'。
