---
id: backtracking-n-queens-diagonal-pruning
title: Backtracking N-Queens Diagonal Pruning
module: backtracking
pattern_label: Constraint Propagation Pattern
complexity_label: O(n!) / O(n)
estimated_minutes: 25
exit_criteria:
  - 能設計出追蹤 column 與對角線的 set／陣列。
  - 能逐列（row by row）放置皇后並立即剪枝。
---
## Concept

N-Queens 是典型的約束滿足問題：在 n × n 棋盤放 n 個皇后，任兩個不得同列、同欄、同斜線。核心觀念課的 choose → explore → unchoose 模板照用，這一課加的是兩件事：**用「逐列放一個」把狀態壓成一維**，以及**把斜線衝突改寫成 O(1) 的集合查詢**。

第一件：n 個皇后要放進 n 列，而任兩個不能同列，所以每列恰有一個。決策樹的第 r 層只問「第 r 列的皇后放哪一欄」，同列衝突在定義上消失，只剩欄與斜線要查。

第二件是本課的論證。兩格 (r1, c1)、(r2, c2) 在同一條斜線上，定義是 |r1 - r2| = |c1 - c2|，也就是 r1 - r2 = c1 - c2 或 r1 - r2 = -(c1 - c2)。前者移項得 r1 - c1 = r2 - c2；後者移項得 r1 + c1 = r2 + c2。反向也成立：r - c 相等可推回 r1 - r2 = c1 - c2，r + c 相等可推回 r1 - r2 = -(c1 - c2)。所以「兩格互相斜向攻擊」**等價於**「r - c 相同或 r + c 相同」——缺一個方向就不是等價。直觀看：沿「＼」走一步是 (r + 1, c + 1)，差不變；沿「／」走一步是 (r + 1, c - 1)，和不變。因此每條「＼」對角線對應唯一的 r - c（範圍 -(n - 1) 到 n - 1，共 2n - 1 條），每條「／」對角線對應唯一的 r + c（0 到 2n - 2，也是 2n - 1 條）。三個集合 cols、d1（存 r - c）、d2（存 r + c）就能用三次 O(1) 查詢完成整個衝突檢查。這就是 Constraint Propagation：每放一個皇后，就把它封鎖的一欄兩線的鍵寫進集合，往後的每一格只要查鍵，不必回頭看每個皇后。

## Thinking

定義 `bt(r)`，並用 `q[r]` 記第 r 列皇后所在的欄。若 `r === n`，`q` 就是一組解，轉成棋盤字串收下；否則對 c 從 0 到 n - 1：若 c 在 cols、或 r - c 在 d1、或 r + c 在 d2，直接跳過；否則把三個鍵加進集合、`q` push c、呼叫 `bt(r + 1)`，回來後把三個鍵刪掉、`q` pop。

正確性靠一條不變式：**進入 `bt(r)` 時，三個集合恰好是前 r 列皇后封鎖的欄與斜線，不多不少；返回時與進入時相同**。有了它，「三個集合都查不到」等價於「與前 r 列每一個皇后都不衝突」（由上面的等價關係），所以每個被放下的皇后都合法，每個到達 `r === n` 的葉都是解；而每個合法的欄都會被試到，解不會漏。

用 n = 4 走一段：第 0 列放欄 0，封鎖 col 0、d1 0、d2 0。第 1 列：欄 0 撞 cols，欄 1 撞 d1（1 - 1 = 0），欄 2 可放，封鎖 col 2、d1 -1、d2 3。第 2 列：欄 0 撞 cols，欄 1 撞 d2（2 + 1 = 3），欄 2 撞 cols，欄 3 撞 d1（2 - 3 = -1），整列無路，回溯到第 1 列改試欄 3……最後從第 0 列欄 1 得到 [1, 3, 0, 2]、從欄 2 得到 [2, 0, 3, 1]，共兩解。剪枝發生在放之前，不是放完整盤才驗。

## Pattern Recognition

線索：要在棋盤或網格擺多個彼此互斥的東西，衝突沿著「線」（列、欄、斜線、區塊）傳播而不只在相鄰格；要列出所有擺法或判斷是否存在。與 Word Search 對照：那一課的 visited 標記的是**一個格子**，衝突只跟四鄰有關；這裡一個皇后封鎖的是**三條線**，遠處的格子也會衝突，所以標記的對象要從「格子」升級成「線的鍵」。更一般的手法：只要一條約束能寫成「某個座標函數的值相同」（r - c、r + c、欄索引、Sudoku 的 3 × 3 區塊編號 `3 * floor(r / 3) + floor(c / 3)`），就把用過的值丟進集合，衝突檢查就是查鍵。

## Common Mistakes

第一，**只檢查一個方向的斜線**（或複製貼上時兩個集合用了同一條公式）。n = 4 會輸出 7 個棋盤而不是 2 個，多出來的像 `[".Q..", "...Q", "..Q.", "Q..."]`：(1, 3) 與 (2, 2) 的 r + c 都是 4，正在同一條「／」上互相攻擊，只查 r - c 的程式看不見它。第二，**用 `abs(r - c)` 消掉負號**。這把 r - c = k 與 -k 兩條不同的斜線合併成同一個鍵，把合法解當衝突剪掉：解 [1, 3, 0, 2] 裡 (1, 3) 的差是 -2、(2, 0) 的差是 2，被誤判為衝突，於是 n = 4 得到 0 個解、n = 5 得到 4 個（應為 10）。負數本身不是問題——集合本來就能存負數；要用陣列就加偏移 r - c + n - 1。順帶一提，直接拿負的 r - c 當索引在 JavaScript 與 Python 都不會拋錯：Python 開 2n - 1 格時負索引繞到尾端沒用到的格子，結果碰巧正確；若 d1 只開 n 格，-1 會繞到 n - 1 那條線，n = 4 得 0 解。第三，**回溯時忘記把鍵刪掉**。第 0 列試完欄 0 的整棵子樹後三個鍵還留著，後面的欄全被自己的殘影擋住：n = 4 得到 0 個解，n = 5 只剩 1 個。第四，**改用迴圈掃前面每一列比對** |r - pr| 與 |c - pc|。結果是對的，差別在每次檢查最壞 O(r) 對 O(1)；因為掃描一撞到就 break，總比對次數其實只差常數倍（實測 n = 12 約 4,540 萬對 3,030 萬）。鍵的真正價值是把「這條線被誰佔了」一次算清楚，讓同一手法能搬到 Sudoku 這類多線約束的問題。

## Complexity

時間：第 r 列最多只有 n - r 個欄不撞 cols，所以葉節點數上界是 n · (n - 1) · … · 1 = O(n!)，斜線剪枝再砍掉絕大多數分支；每個節點對 n 個欄各做三次 O(1) 查詢。把每組解轉成字串另需 O(n²)。空間 O(n)：三個集合同時最多各 n 個鍵（同時最多 n 個皇后），`q` 長度 n，遞迴深度 n；輸出本身不計。

## Digest

N-Queens：逐列放一個皇后，同列衝突在定義上消失；剩下的欄與斜線各用一個鍵查。兩格斜向攻擊的定義是 |r1 - r2| = |c1 - c2|，拆成 r1 - r2 = c1 - c2 與 r1 - r2 = -(c1 - c2)，移項就是 r1 - c1 = r2 - c2（「＼」線，共 2n - 1 條）與 r1 + c1 = r2 + c2（「／」線，也 2n - 1 條）——攻擊關係與「r - c 或 r + c 相同」等價，兩個方向缺一不可。`bt(r)` 對每個欄查 cols、d1（r - c）、d2（r + c）三個集合，都不在才放；不變式是「集合恰為前 r 列皇后封鎖的線，返回時原樣還原」。只查一個方向會多出不合法棋盤（n = 4 得 7 而非 2）；用 abs 消負號會把兩條線併成一條而漏解（n = 4 得 0）；忘記還原也得 0。時間 O(n!) 上界，空間 O(n)。

## TypeScript Tip

斷言釘死 n = 4 的輸出，少查一條線、用 `abs`、忘記 `delete` 都會被抓到。

```typescript
import { strict as assert } from 'node:assert';

function solveNQueens(n: number): string[][] {
  const res: string[][] = [], q: number[] = [];
  const cols = new Set<number>(), d1 = new Set<number>(), d2 = new Set<number>();
  const bt = (r: number) => {
    if (r === n) { res.push(q.map(c => ('.'.repeat(c) + 'Q').padEnd(n, '.'))); return; }
    for (let c = 0; c < n; c++) {
      if (cols.has(c) || d1.has(r - c) || d2.has(r + c)) continue;
      cols.add(c); d1.add(r - c); d2.add(r + c); q.push(c);
      bt(r + 1);
      cols.delete(c); d1.delete(r - c); d2.delete(r + c); q.pop();
    }
  };
  bt(0);
  return res;
}

assert.deepEqual(solveNQueens(4), [['.Q..', '...Q', 'Q...', '..Q.'], ['..Q.', 'Q...', '...Q', '.Q..']]);
```

## Python Tip

布林陣列版：r - c 落在 -(n - 1) 到 n - 1，加 n - 1 平移到 0 到 2n - 2。

```python
def solve_n_queens(n: int) -> list[list[str]]:
    res: list[list[str]] = []
    q: list[int] = []
    cols, d1, d2 = [False] * n, [False] * (2 * n - 1), [False] * (2 * n - 1)

    def bt(r: int) -> None:
        if r == n:
            res.append([('.' * c + 'Q').ljust(n, '.') for c in q])
            return
        for c in range(n):
            a, b = r - c + n - 1, r + c
            if cols[c] or d1[a] or d2[b]:
                continue
            cols[c] = d1[a] = d2[b] = True
            q.append(c)
            bt(r + 1)
            cols[c] = d1[a] = d2[b] = False
            q.pop()

    bt(0)
    return res

assert solve_n_queens(4) == [['.Q..', '...Q', 'Q...', '..Q.'], ['..Q.', 'Q...', '...Q', '.Q..']]
```

## Takeaway

逐列放皇后，衝突化成三個鍵：欄 c、「＼」線 r - c、「／」線 r + c；放之前查三個集合，不在就放、回來就刪。

## Tomorrow Preview

Backtracking 模組到今天收官。回頭看，十課共用的骨架只有一個：choose → explore → unchoose，變的是剪枝條件——從去重的 `start` 與 `used`、切割的迴文檢查、網格的 visited，到今天把整條線編成一個鍵。之後課程會另起新主題，動身前先把 N-Queens 的三個集合版本手寫一遍，再試著把 d1、d2 換成加偏移的陣列。

## Today's Challenge

- **51** · 本課的論證就是為它而做：逐列放一個皇后，欄用 c、「＼」線用 r - c、「／」線用 r + c 各存一個集合，三次 O(1) 查詢取代掃描先前每個皇后。
  - Hint: `bt(r)` 對每個欄 c 先查三個集合都不在才放，放完遞迴到 r + 1，回來後把三個鍵刪掉；到 `r === n` 時把每列的欄位置轉成 `"..Q."` 字串收進答案。n = 4 應恰得 2 組解。
