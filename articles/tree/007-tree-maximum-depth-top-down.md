---
id: tree-maximum-depth-top-down
title: Maximum Depth of Binary Tree (Top-Down)
module: tree
pattern_label: Top-Down DFS (Accumulator)
complexity_label: O(n) / O(h)
estimated_minutes: 20
exit_criteria:
  - 能在走訪過程中維護並更新全域或向下傳遞的深度計數器。
---
## Concept

Top-Down DFS 是把「從根走到目前節點所累積的資訊」當成參數往下傳的遞迴設計：呼叫子節點前先算好新狀態，答案在走訪途中被記錄，而不是等子樹回傳後組合。以最大深度為例，輔助函式接收 `(node, depth)`，`depth` 代表根到此節點的路徑節點數；每往下一層就傳 `depth + 1`，並沿途以 `depth` 更新目前所見的最大值。它與前一課的 Bottom-Up 正是資料流向相反的一對：Bottom-Up 問「子樹能回報我什麼」，Top-Down 問「從根走到這裡，我已經知道什麼」。

## Thinking

先釘死 `depth` 的語意約定：本課採「進入節點時，`depth` 已包含該節點本身」，因此根節點以 `depth = 1` 進入；空樹從未觸發更新，答案維持初始值 0。約定選哪一種都行，錯的是混用——一半的地方當作「尚未包含自己」，整體就會差一層。

為什麼沿途更新是對的？分兩步論證。第一，走訪覆蓋完整：DFS 對每個節點恰好拜訪一次，且拜訪時攜帶的 `depth` 恰等於根到該節點的路徑節點數——對深度做歸納即可證明：根為 1；若父節點的 `depth` 正確，子節點收到 `depth + 1` 也正確。第二，最大深度的定義就是所有節點深度的最大值，因此對每個節點執行 `best = max(best, depth)`，走訪結束時 `best` 必為正解。

你也可以只在葉節點更新：最大值一定在某個葉節點取得，因為任何內部節點的深度都嚴格小於它底下葉節點的深度。不過「每個節點都更新」的寫法更短，省去葉節點特判，也自然涵蓋空樹。

## Pattern Recognition

當答案取決於「根到當前節點這條路徑上累積了什麼」，就是 Top-Down 的訊號：路徑總和是否等於目標、路徑組成的字串、目前深度、路徑上出現過的最大值。程式面的特徵是遞迴參數多出一個累積狀態，回傳值常是 void，答案寫進外層變數。反過來，若答案由「子樹的彙整結果」組成——子樹高度、子樹節點和——則 Bottom-Up 的回傳值組合更自然。同一題常常兩種都能解（最大深度即是），但路徑類問題用 Top-Down、子樹類問題用 Bottom-Up，程式碼最不彆扭。

## Common Mistakes

最常見的錯誤是兩種資料流混用：在 Top-Down 的輔助函式裡又想靠回傳值組答案、又同時更新外層變數，狀態來源不唯一，改一處就壞另一處；動筆前先選定一種流向並貫徹。第二是差一錯誤：根算 `depth = 1` 還是 0、加一發生在進入前還是進入後，兩種約定各自成立，混用就差一層；用空樹（應得 0）與單節點樹（應得 1）當測試就能抓到。第三是共用變數的生命週期：把最大值放在模組層級全域，第二次呼叫會殘留上次結果；改用 closure 或在進入遞迴前歸零。第四是空節點邊界：務必先判 `node` 為空立即 return，再存取 `node.left`，否則對空子樹遞迴時會出錯。

## Complexity

時間複雜度為 O(n)：每個節點恰被拜訪一次，n 為節點總數。空間複雜度為 O(h)：額外空間來自遞迴呼叫堆疊，h 為樹高，堆疊最深時掛著一條根到葉路徑上的所有呼叫。最壞情況（鏈狀樹）h 等於 n，堆疊深度為 O(n)；最好情況（完全平衡樹）h 約為 log n，堆疊深度為 O(log n)。沿途只維護一個最大值變數，不需要額外的資料結構空間。

## Digest

今天用同一道最大深度問題練習 Top-Down 思維：輔助函式接收 `(node, depth)`，根以 `depth = 1` 進入，每往下一層傳 `depth + 1`，沿途以 `depth` 更新外層的最大值。正確性來自兩點——DFS 拜訪每個節點恰一次，且攜帶的 `depth` 恰為根到該節點的路徑節點數，因此走訪完畢後最大值即為答案。與前一課的 Bottom-Up 對照：Bottom-Up 由子樹回傳高度向上組合，Top-Down 把累積狀態向下分發、在途中結算。判斷用哪種的準則是答案的來源：來自「根到節點的路徑」選 Top-Down，來自「子樹的彙整」選 Bottom-Up。

## TypeScript Tip

用 closure 攜帶最大值，每個節點都以 `depth` 更新，空樹自然得 0：

```typescript
class TreeNode {
  left: TreeNode | null = null;
  right: TreeNode | null = null;
  constructor(public val: number) {}
}
function maxDepth(root: TreeNode | null): number {
  let best = 0;
  const dfs = (node: TreeNode | null, depth: number): void => {
    if (!node) return;
    best = Math.max(best, depth);
    dfs(node.left, depth + 1);
    dfs(node.right, depth + 1);
  };
  dfs(root, 1);
  return best;
}
const root = new TreeNode(3);
root.left = new TreeNode(9);
root.right = new TreeNode(20);
root.left.left = new TreeNode(15);
if (maxDepth(root) !== 3) throw new Error("maxDepth failed");
if (maxDepth(null) !== 0) throw new Error("empty tree failed");
```

## Python Tip

內層函式要改寫外層變數，必須宣告 `nonlocal`，否則賦值會建立新的區域變數：

```python
class TreeNode:
    def __init__(self, val: int) -> None:
        self.val = val
        self.left: "TreeNode | None" = None
        self.right: "TreeNode | None" = None

def max_depth(root: "TreeNode | None") -> int:
    best = 0
    def dfs(node: "TreeNode | None", depth: int) -> None:
        nonlocal best
        if node is None:
            return
        best = max(best, depth)
        dfs(node.left, depth + 1)
        dfs(node.right, depth + 1)
    dfs(root, 1)
    return best

root = TreeNode(3)
root.left = TreeNode(9)
root.right = TreeNode(20)
root.left.left = TreeNode(15)
assert max_depth(root) == 3
assert max_depth(None) == 0
```

## Takeaway

Top-Down 把根到當前節點的累積狀態當參數往下帶、沿途更新答案；答案來自路徑選它，來自子樹彙整則選 Bottom-Up。

## Tomorrow Preview

明天將探討如何檢查一棵二元樹是否平衡：每個節點的左右子樹高度差都不能超過 1。你會把深度計算再進一步，從「算出一個數字」升級為「沿途驗證一個性質」。

## Today's Challenge

- **104** · 此題你已見過兩次：Queue 模組用 BFS 逐層算過深度、前一課用 Bottom-Up 回傳高度；今天改用 Top-Down 重解，把當前深度作為參數往下傳、沿途更新最大值，親身對照兩種遞迴資料流向的差異。
  - Hint: 輔助函式帶 `(node, depth)`，根從 1 開始；節點為空立即 return，否則以 `depth` 更新最大值，再對左右子節點各以 `depth + 1` 遞迴。
