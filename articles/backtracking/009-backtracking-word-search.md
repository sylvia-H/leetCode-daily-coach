---
id: backtracking-word-search
title: Backtracking Word Search
module: backtracking
pattern_label: Grid DFS Pathfinding
complexity_label: O(N * 3^L) / O(L)
estimated_minutes: 20
exit_criteria:
  - Can traverse 4-directional grid neighbors recursively.
  - >-
    Can temporarily mark visited cells in-place and restore them after
    exploration.
---
## Concept

Backtracking Word Search 是一種運用遞迴與狀態回溯策略在二維網格中尋找特定字串的經典演算法。當我們面對一個字元矩陣，且目標是確認某個連續字串是否能透過相鄰格子（上下左右四個方向）的走訪拼湊而成時，Grid DFS Pathfinding 便成為最核心的解題手法。此演算法的核心在於系統性地嘗試每一個可能的路徑，當發現當前路徑不符合目標字元時，能夠立刻放棄並回到上一個狀態，恢復被修改的網格內容，繼續探索其他可能的分支。

## Thinking

在思考這類問題時，首先需要明確定義遞迴函式的介面與狀態。通常我們需要記錄當前在網格中的座標 $(r, c)$ 以及目前匹配到目標字串的索引值 $index$。演算法的起點是遍歷整個二維網格，尋找任何與目標字串首字相符的格子作為起點。進入遞迴後，我們首先檢查終止條件：若 $index$ 等於目標字串的長度，代表已經完全匹配，直接返回 true。接著進行邊界檢查與合法性驗證，包含座標是否越界、當前格子是否已被訪問過，以及當前格子字元是否與目標字元的第 $index$ 個字元相符。為了避免在同一次路徑中重複訪問同一格子，我們會在進入遞迴前將當前格子的字元暫時修改為特殊標記（例如 '#'），以此達到 in-place 標記已訪問狀態的目的。在探索完四個相鄰方向後，最關鍵的步驟是進行狀態恢復，也就是將當前格子的字元改回原本的值，確保其他探索路徑不受影響。

## Pattern Recognition

當題目要求在二維矩陣（Grid）中尋找符合特定條件的字串、路徑或子序列，且允許透過相鄰的上下左右移動來串接時，通常就可以聯想到 Grid DFS Pathfinding 或是 Backtracking 的 Pattern。辨識的關鍵特徵包含：輸入資料結構為二維字元陣列、搜尋過程具備順序性或方向性、需要走訪相鄰節點、且在走訪過程中必須避免走回頭路但又允許在不同起點間共用未訪問的節點狀態。這類問題無法單純透過貪婪演算法或單向走訪解決，必須藉由狀態還原機制的遞迴來窮舉所有可能的分支。

## Common Mistakes

最常見的錯誤是在遞迴探索完成後，忘記將網格中的格子狀態恢復原狀（Unsetting）。若沒有執行恢復動作，當某個起點的 DFS 分支失敗退回時，該格子的特殊標記會一直保留，導致後續從其他起點出發的路徑誤以為該格子已被訪問，進而引發嚴重的邏輯錯誤，使合法的解被漏掉。另一個常見錯誤是邊界條件的處理順序不當，如果在檢查座標是否越界之前就去存取網格中的元素，將會導致陣列索引超出範圍的執行階段錯誤。

## Complexity

時間複雜度為 $O(N \times 3^L)$，其中 $N$ 是網格中的總格子數，而 $L$ 是目標字串的長度。在每個格子起點，我們最多有 4 個方向可以探索，但在走訪下一步時，扣除掉剛才走過來的來源方向，實際上最多只有 3 個有效分支，且遞迴深度最高可達 $L$。空間複雜度為 $O(L)$，主要取決於遞迴呼叫堆疊的最大深度，這與目標字串的長度成正比。

## Digest

本篇探討了 Backtracking Word Search 核心觀念與 Grid DFS Pathfinding 的設計模式。我們學習了如何從二維網格的每一個匹配起點出發，利用遞迴進行四方向的字串比對。關鍵在於透過原地修改狀態（In-place mutation）來避免同一路徑的重複訪問，並在遞迴返回時確實還原狀態。文章詳細分析了時間與空間複雜度，並提供了 TypeScript 與 Python 的高效實作範例與邊界檢查技巧。

## TypeScript Tip

TypeScript 開發者在處理二維字串陣列時，必須確保型別定義明確為 string[][]。在編寫迴圈與遞迴時，善用區域函式（Nested function）可以有效共用外層的 board 與 word 變數，避免繁瑣的參數傳遞。以下為型別安全的輔助驗證碼片段：

```typescript
function validateGrid(board: string[][]): boolean {
  if (!board.length || !board[0].length) return false;
  const colLength = board[0].length;
  return board.every(row => row.length === colLength);
}
if (!validateGrid([['A']])) {
  throw new Error('Grid validation failed');
}
```

## Python Tip

Python 開發者可以利用多重指定與短路求值（Short-circuit evaluation）特性來精簡 DFS 的方向探索邏輯。由於運算子具備短路特性，一旦某個方向回傳 True，後續方向將不會被執行，這能省下不必要的遞迴呼叫開銷。以下為簡化的方向探索片段：

```python
def check_bounds(r: int, c: int, rows: int, cols: int) -> bool:
    return 0 <= r < rows and 0 <= c < cols

assert check_bounds(1, 1, 3, 3) == True, 'Bounds check failed'
```

## TypeScript Corner

TypeScript 在實作二維網格搜尋時，需要妥善處理陣列型別與邊界檢查。以下為完整的實作範例與斷言測試：

```typescript
function exist(board: string[][], word: string): boolean {
  const rows = board.length;
  const cols = board[0].length;

  function dfs(r: number, c: number, index: number): boolean {
    if (index === word.length) return true;
    if (r < 0 || c < 0 || r >= rows || c >= cols || board[r][c] !== word[index]) {
      return false;
    }

    const temp = board[r][c];
    board[r][c] = '#';

    const found =
      dfs(r + 1, c, index + 1) ||
      dfs(r - 1, c, index + 1) ||
      dfs(r, c + 1, index + 1) ||
      dfs(r, c - 1, index + 1);

    board[r][c] = temp;
    return found;
  }

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (dfs(r, c, 0)) return true;
    }
  }
  return false;
}

const testBoard = [
  ['A', 'B', 'C', 'E'],
  ['S', 'F', 'C', 'S'],
  ['A', 'D', 'E', 'E']
];
if (!exist(testBoard, 'ABCCED')) {
  throw new Error('Assertion failed: should find ABCCED');
}
```

## Python Corner

Python 在處理二維串列時，利用字串的可變性進行原地狀態修改非常高效。以下為完整的實作範例與斷言測試：

```python
def exist(board: list[list[str]], word: str) -> bool:
    rows, cols = len(board), len(board[0])

    def dfs(r: int, c: int, index: int) -> bool:
        if index == len(word):
            return True
        if r < 0 or c < 0 or r >= rows or c >= cols or board[r][c] != word[index]:
            return False

        temp = board[r][c]
        board[r][c] = '#'

        found = (
            dfs(r + 1, c, index + 1)
            or dfs(r - 1, c, index + 1)
            or dfs(r, c + 1, index + 1)
            or dfs(r, c - 1, index + 1)
        )

        board[r][c] = temp
        return found

    for r in range(rows):
        for c in range(cols):
            if dfs(r, c, 0):
                return True
    return False


test_board = [
    ['A', 'B', 'C', 'E'],
    ['S', 'F', 'C', 'S'],
    ['A', 'D', 'E', 'E'],
]
assert exist(test_board, 'ABCCED'), 'Assertion failed: should find ABCCED'
```

## Takeaway

Grid DFS 需要精準的邊界檢查與確實的狀態還原，透過原地修改與回溯機制，能夠在 O(N * 3^L) 時間內高效找出目標路徑。

## Tomorrow Preview

明天我們將探討圖論與回溯演算法的延伸主題，學習如何在更複雜的圖結構中尋找滿足特定條件的路徑組合。

## Today's Challenge

- **79** · 本題需要走訪二維字元網格，並透過四方向遞迴與狀態回溯來尋找順序相連的目標字串，完全符合 Grid DFS Pathfinding 的核心模式。
  - Hint: 記得在遞迴探索前後對當名格子進行狀態修改與還原。
