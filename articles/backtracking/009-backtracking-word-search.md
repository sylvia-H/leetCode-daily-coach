---
id: backtracking-word-search
title: Backtracking Word Search
module: backtracking
pattern_label: Grid DFS Pathfinding
complexity_label: O(N * 3^L) / O(L)
estimated_minutes: 20
exit_criteria:
  - 能以遞迴走訪網格的四方向相鄰格。
  - 能就地（in-place）暫時標記已走訪的格子，並在探索結束後還原。
---
## Concept

Word Search 是 Backtracking 搬到 2D 網格上：狀態樹的每個節點是「目前站在格子 (r, c)、已經對上單字前 i 個字元」，每條邊是往上下左右四個相鄰格走一步。它同時是圖 DFS 那一課的延伸——網格就是一張隱式的圖，每格是頂點、四鄰是邊，只是這裡的 DFS 多了兩個條件：走進的格子必須等於 `word[i]`，而且**同一條路徑不能重踏同一格**。

「不能重踏」的標記方式決定了正確性。圖 DFS 的 visited 是永久的，每個頂點到得了一次就夠；這裡不行——格子 (r, c) 在某條路徑失敗後，仍可能是另一條路徑的一環，所以標記只對**目前這條路徑**有效，退出該格時必須撤銷。最省的做法是就地把 `board[r][c]` 改成一個不可能出現的字元（例如 `#`），四方向探索完再改回來：`#` 對不上任何 `word[i]`，所以「已在路徑上」的格子會被字元比對自動擋掉，不需要額外的 visited 陣列。

正確性靠的不變式和入門課一樣：**`dfs(r, c, i)` 返回時，`board` 與進入時完全相同**。有了它，從任一格出發的每一次探索都看到乾淨的棋盤；而在一條路徑內部，被標記的恰是「起點到目前格」的那些格子，所以路徑不會自交。兩件事合起來，就是每條合法路徑都有機會被走到、且不會走出非法路徑。

## Thinking

定義 `dfs(r, c, i)`：「從 (r, c) 出發，能否接上 `word[i..]`」。檢查順序有講究：

1. `i === word.length`：前 i 個字元都對上了，回 true。**這一行要放在最前面**、在邊界檢查之前——最後一格的鄰居可能全在界外。
2. 出界，或 `board[r][c] !== word[i]`：回 false。被蓋成 `#` 的格子也在這裡被擋掉。
3. 記下 `ch = board[r][c]`，蓋成 `#`，往四個方向呼叫 `dfs(nr, nc, i + 1)`，任一方向成功即成功。
4. **不論成敗**都把 `ch` 寫回，再回傳結果。

外層對每一格呼叫 `dfs(r, c, 0)`，任一格成功就回 true；不必先篩「第一個字元相符」，第 2 步會自己擋掉。

追蹤 `[["B","A","A"]]` 找 `AAB`：從 (0,1) 出發，A 對上、蓋成 `#`；往右 (0,2) A 對上、蓋成 `#`；再找 B：(0,1) 已是 `#`、其餘出界，失敗——(0,2) 還原成 A，接著 (0,1) 也還原成 A。換 (0,2) 出發：A → 左 (0,1) A → 左 (0,0) B，i 到 3 等於長度，true。第二條路徑走得通，正是因為第一條路徑失敗時把兩個 A 都還了回去。

## Pattern Recognition

看到「在字元或數字網格上，沿上下左右相鄰格走出一條序列，要求依序符合某個目標，且同一格在一條路徑裡只能用一次」，就是 Grid DFS Pathfinding：網格是隱式圖、目標序列是剪枝條件、就地標記加還原是狀態管理。它和昨天的字串切分一樣是「部分解不合法就整棵子樹跳過」，差別在分支是四個方向而非各種切點長度。反過來，若問的是「能不能到達」「有幾個連通區域」而沒有「不可重踏」的要求，那是普通的網格 DFS／BFS，visited 可以永久標記、不需要還原。

## Common Mistakes

第一，**忘記還原**。`[["B","A","A"]]` 找 `AAB`：從 (0,1) 出發失敗後兩個 A 都留成 `#`，換 (0,2) 出發時第一步就對不上，回 false；正確答案是 true。窮舉 1×1 到 3×3 的 A／B 棋盤與長度 ≤ 4 的單字，有 1304 組會這樣漏解。

第二，**成功時提早 `return true` 而跳過還原**。單次查詢的答案全對（同一批窮舉 0 組錯），但棋盤留著 `#`：`[["A","B"]]` 查 `AB` 第一次 true，用同一個 `board` 再查一次變 false。只查一個單字的評測抓不到它，卻會在「同一棋盤查多個單字」時爆開；把還原無條件寫在四方向之後，就不會有跳過它的分支。

第三，**Python 只檢查上界、漏掉 `0 <= r`**。`board[-1]` 不會報錯，而是回繞到最後一列：`[["A"],["X"],["B"]]` 找 `AB`，從 (0,0) 往上到 r = -1 讀到 B，回 True，正確答案是 False。TypeScript 的 `board[-1]` 是 `undefined`，再取 `[c]` 會直接拋 TypeError——會吵，但至少不會安靜地答錯。

第四，**把終止條件放在邊界檢查之後**。`[["A"]]` 找 `A`：對上後四個鄰居全出界，`i === 1` 的判斷永遠執行不到，回 false。它只在單字結尾四面都出界時出錯，1×1 棋盤正是這種測資。

## Complexity

N = m·n 個起點。第一步有 4 個方向，之後每一步來的那一格已被蓋成 `#`，最多剩 3 個方向，路徑深度最多 L，所以每個起點至多約 3^L 條路徑，總計 O(N · 3^L)；這是上界，字元比對通常在前幾步就剪掉絕大多數分支。額外空間 O(L)：遞迴深度等於已對上的字元數，標記直接寫在棋盤上，不另配 visited。

## Digest

Word Search＝Backtracking 搬到網格：`dfs(r, c, i)` 問「從 (r, c) 出發能否接上 `word[i..]`」。檢查順序：先 `i === word.length` 回 true，再擋出界與字元不符，然後把 `board[r][c]` 蓋成 `#`、往四方向遞迴、**不論成敗**寫回原字元。不變式是「返回時棋盤與進入時相同」，所以每個起點都看到乾淨棋盤，而一條路徑內被蓋掉的恰是路徑本身，不會自交。與圖 DFS 的差別：visited 只對目前路徑有效，必須撤銷；`#` 對不上任何字元，所以重踏會被字元比對自動擋掉。忘記還原會漏解（`[["B","A","A"]]` 找 `AAB` 回 false）；成功時提早 return 跳過還原，單次答對但棋盤被污染；Python 漏掉 `0 <= r` 會因 `board[-1]` 回繞而誤判。時間 O(N · 3^L)、額外空間 O(L)。

## TypeScript Tip

還原不論成敗都執行。

```typescript
import assert from 'node:assert';

function exist(board: string[][], word: string): boolean {
  const m = board.length, n = board[0].length;
  const dfs = (r: number, c: number, i: number): boolean => {
    if (i === word.length) return true;
    if (r < 0 || c < 0 || r >= m || c >= n || board[r][c] !== word[i]) return false;
    const ch = board[r][c];
    board[r][c] = '#';
    const ok = dfs(r + 1, c, i + 1) || dfs(r - 1, c, i + 1) || dfs(r, c + 1, i + 1) || dfs(r, c - 1, i + 1);
    board[r][c] = ch;
    return ok;
  };
  return board.some((row, r) => row.some((_, c) => dfs(r, c, 0)));
}

const b = [['B','A'],['X','A']];
assert(exist(b, 'AAB') && exist(b, 'BAA'));
assert(!exist(b, 'ABA'));
assert.equal(b.join(), 'B,A,X,A');
assert(exist([['A']], 'A'));
```

## Python Tip

`0 <= r` 不可省：`board[-1]` 會回繞。

```python
def exist(board: list[list[str]], word: str) -> bool:
    m, n = len(board), len(board[0])

    def dfs(r, c, i):
        if i == len(word):
            return True
        if not (0 <= r < m and 0 <= c < n) or board[r][c] != word[i]:
            return False
        ch, board[r][c] = board[r][c], "#"
        ok = (dfs(r + 1, c, i + 1) or dfs(r - 1, c, i + 1)
              or dfs(r, c + 1, i + 1) or dfs(r, c - 1, i + 1))
        board[r][c] = ch  # 不論成敗都還原
        return ok

    return any(dfs(r, c, 0) for r in range(m) for c in range(n))

b = [["A"], ["X"], ["B"]]
assert exist(b, "AB") is False  # 漏掉 0 <= r 會回繞
assert exist(b, "AXA") is False  # 不標記會重踏 A
assert exist(b, "AXB") is True and b == [["A"], ["X"], ["B"]]
assert exist([["A"]], "A")
```

## Takeaway

網格 DFS 的正確性靠一條不變式：`dfs` 返回時棋盤與進入時相同——蓋成 `#` 擋重踏，四方向探完無條件寫回。

## Tomorrow Preview

明天進入 N-Queens：一樣是逐步放置、不合法就整棵子樹剪掉，但衝突檢查改用 row + col 與 row - col 這兩個對角線編號，把「這格能不能放皇后」變成 O(1) 的集合查詢。

## Today's Challenge

- **79** · 本課的教材題：在 m×n 字母網格找一條四鄰相接、不重踏的路徑拼出 `word`，就地標記與還原是全部的狀態管理。
  - Hint: `dfs(r, c, i)` 先判 `i === word.length` 回 true，再擋出界與字元不符；蓋 `#`、四方向遞迴、無條件還原。外層對每一格呼叫 `dfs(r, c, 0)`，任一為 true 即回 true，否則回 false。
