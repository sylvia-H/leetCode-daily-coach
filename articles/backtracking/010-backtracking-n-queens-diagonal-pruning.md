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

Backtracking N-Queens Diagonal Pruning 是一種針對約束滿足問題的最佳化策略。在棋盤佈局與組合搜尋問題中，傳統的盲目搜尋會產生大量的無效狀態。透過數學特性將二維棋盤上的對角線衝突轉換為一維索引的計算，我們可以在 O(1) 的時間內完成衝突檢測。具體而言，對角線衝突可分為主對角線（row - col）與副對角線（row + col），結合直行衝突（col）的追蹤，能夠在遞迴搜尋過程中立即剪枝，大幅提升求解效率。

## Thinking

思考 N-Queens 問題時，我們採用逐行放置皇后的策略。因為每一行絕對只能放置一個皇后，所以搜尋空間可以從指數級降為排列組合。當我們在第 row 行嘗試將皇后放在第 col 列時，必須確保該列、主對角線與副對角線皆未被先前的皇后佔用。如果滿足條件，我們將對應的直行與對角線標記為佔用，並遞迴進入下一行。若無法在當前行找到合法位置，則觸發回溯機制，撤銷當前的狀態標記並嘗試下一個列選項。這種即時剪枝的思維核心在於狀態的快速更新與還原。

## Pattern Recognition

當題目要求在網格或棋盤上放置多個互不攻擊的元件，且涉及橫跨行列及對角線的嚴格幾何衝突限制時，即可識別為 Constraint Propagation Pattern。若問題要求找出所有可能的合法配置或驗證可行性，且狀態轉換呈現樹狀結構，則高度適合套用帶有對角線剪枝的 Backtracking 框架。透過數學公式捕捉對角線特徵是識別此類高效能回溯題目的關鍵線索。

## Common Mistakes

最常見的錯誤是使用雙重迴圈或二維陣列逐格掃描來檢查對角線衝突，這會導致每次檢查的時間複雜度高達 O(n)，使整體效能嚴重退化。另一個常見失誤是忽略了負數索引的問題，在計算主對角線性質（row - col）時可能會產生負值，若直接作為陣列索引會導致越界錯誤，必須透過加上常數偏移量或使用雜湊結構來安全儲存狀態。

## Complexity

時間複雜度為 O(n!)，因為在最壞情況下，每一行可選擇的列數會遞減，但透過剪枝大幅縮減了實際的搜尋路徑。空間複雜度為 O(n)，主要取決於遞迴呼叫堆疊的最大深度以及儲存行、對角線狀態所使用的集合或陣列空間。

## Digest

本單元探討 Backtracking N-Queens Diagonal Pruning。透過數學公式 row - col 與 row + col，我們將原本複雜的對角線衝突檢測優化至 O(1) 時間。課程詳細解析了狀態追蹤、即時剪枝與回溯還原的機制，避免了傳統 O(n) 迴圈的效能瓶頸。透過實作題號 51，讀者能夠掌握 Constraint Propagation Pattern 的核心精神，並學會在網格搜尋中精準管理狀態。

## TypeScript Tip

```typescript
function checkDiagonalFast(row: number, col: number, diag1: Set<number>, diag2: Set<number>): boolean {
  const d1 = row - col;
  const d2 = row + col;
  const isValid = !diag1.has(d1) && !diag2.has(d2);
  if (isValid) {
    diag1.add(d1);
    diag2.add(d2);
  }
  return isValid;
}
const d1 = new Set<number>();
const d2 = new Set<number>();
if (!checkDiagonalFast(0, 0, d1, d2)) throw new Error("assertion failed");
```

## Python Tip

```python
def check_diagonal_fast(row: int, col: int, diag1: set, diag2: set) -> bool:
    d1 = row - col
    d2 = row + col
    is_valid = d1 not in diag1 and d2 not in diag2
    if is_valid:
        diag1.add(d1)
        diag2.add(d2)
    return is_valid

d1 = set()
d2 = set()
assert check_diagonal_fast(0, 0, d1, d2) is True, "assertion failed"
```

## Takeaway

運用數學特性（row +/- col）達成 O(1) 對角線剪枝，是解決約束滿足搜尋問題的關鍵核心技術。

## Tomorrow Preview

明天我們將探討 Bitwise Manipulation Optimization，學習如何利用整數的二進位位元運算來取代集合資料結構，將 N-Queens 的狀態空間搜尋速度推進至極致。

## Today's Challenge

- **51** · Classic N-Queens placement problem requiring rigorous constraint tracking across rows, columns, and diagonals.
  - Hint: 利用三個集合分別記錄已被佔用的直行、主對角線（row - col）與副對角線（row + col），在遞迴過程中進行 O(1) 剪枝。
