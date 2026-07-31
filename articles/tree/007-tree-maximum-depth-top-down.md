---
id: tree-maximum-depth-top-down
title: Maximum Depth of Binary Tree (Top-Down)
module: tree
pattern_label: Top-Down DFS (Accumulator)
complexity_label: O(n) / O(h)
estimated_minutes: 20
exit_criteria:
  - Maintain and update a global or passed-down depth counter during traversal.
---
## Concept

Maximum Depth of Binary Tree (Top-Down) 是一種透過由根節點向葉節點遞迴尋訪，並在過程中攜帶當前累計深度的演算法設計策略。此方法的精髓在於將狀態（State）作為參數向下傳遞，而非依賴子樹向上回傳數值。

## Thinking

當我們思考 Maximum Depth of Binary Tree 問題時，直覺會採用 Bottom-Up 的後序走訪；然而，Top-Down 策略要求我們以不同的思維切入。我們設計一個輔助函式，接收當前節點與目前的深度（Current Depth）。當我們由上而下尋訪時，每往下走一層，深度數值便加 1。當尋訪至葉節點時，我們將該路徑的深度與全域紀錄的最大深度進行比較並更新。這種將狀態往下傳遞的機制，非常適合用來解決需要維護累積狀態的二元樹問題。

## Pattern Recognition

當題目要求尋找從根節點到葉節點的路徑性質，且該性質需要沿途累積數值（例如路徑總和、最大深度、路徑字串）時，即可辨識出應採用 Top-Down DFS (Accumulator) Pattern。其特徵在於遞迴函式的參數列表中包含累計狀態，且答案通常在抵達終點（葉節點）時被更新，而非依賴遞迴回傳值來組合答案。

## Common Mistakes

開發者最常犯的錯誤是混淆 Top-Down 的參數傳遞與 Bottom-Up 的回傳值合併。在 Top-Down 實作中，不應該期望遞迴函式回傳子樹的深度來計算答案，而是應該將累積深度直接帶入子呼叫中。另一個常見錯誤是未正確處理空節點（Null Node）的邊界條件，導致在存取不存在的節點屬性時發生例外狀況。

## Complexity

時間複雜度為 O(n)，其中 n 為二元樹中的節點總數，因為每個節點皆被訪問恰好一次。空間複雜度為 O(h)，其中 h 為二元樹的高度，此空間消耗來自遞迴呼叫堆疊（Call Stack）。在最壞情況下（如鏈狀二元樹），空間複雜度為 O(n)；在最好情況下（完全平衡二元樹），空間複雜度為 O(log n)。

## Digest

本日核心在於掌握 Maximum Depth of Binary Tree 的 Top-Down 策略。我們學習了如何利用 Accumulator 模式，將當前深度作為參數向下傳遞至遞迴呼叫中。透過在抵達葉節點時更新全域變數，我們能夠有效追蹤整棵樹的最大深度。相較於由下往上的回傳機制，Top-Down 強調狀態的攜帶與分發，這對於處理路徑相關的二元樹問題提供了一個強大且直觀的思考框架。

## TypeScript Tip

```typescript
function solveTypeScriptTip(): void {
  let counter = 0;
  const increment = () => { counter++; };
  increment();
  if (counter !== 1) throw new Error("Closure state tracking failed");
}
solveTypeScriptTip();
```

## Python Tip

```python
def solve_python_tip() -> None:
    total = 0
    def add() -> None:
        nonlocal total
        total += 5
    add()
    assert total == 5, "Nonlocal variable modification failed"
solve_python_tip()
```

## TypeScript Corner

```typescript
class TreeNode {
  val: number;
  left: TreeNode | null;
  right: TreeNode | null;
  constructor(val?: number, left?: TreeNode | null, right?: TreeNode | null) {
    this.val = (val===undefined ? 0 : val);
    this.left = (left===undefined ? null : left);
    this.right = (right===undefined ? null : right);
  }
}

function maxDepth(root: TreeNode | null): number {
  let maxD = 0;
  function dfs(node: TreeNode | null, depth: number): void {
    if (!node) return;
    if (!node.left && !node.right) {
      maxD = Math.max(maxD, depth);
    }
    dfs(node.left, depth + 1);
    dfs(node.right, depth + 1);
  }
  dfs(root, 1);
  return root ? maxD : 0;
}

const root = new TreeNode(3);
root.left = new TreeNode(9);
root.right = new TreeNode(20);
const result = maxDepth(root);
if (result !== 2) throw new Error("Assertion failed: expected depth 2");
```

## Python Corner

```python
class TreeNode:
    def __init__(self, val=0, left=None, right=None):
        self.val = val
        self.left = left
        self.right = right

def maxDepth(root: TreeNode | None) -> int:
    max_d = 0
    def dfs(node: TreeNode | None, depth: int) -> None:
        nonlocal max_d
        if not node:
            return
        if not node.left and not node.right:
            max_d = max(max_d, depth)
        dfs(node.left, depth + 1)
        dfs(node.right, depth + 1)
    
    dfs(root, 1)
    return max_d if root else 0

root = TreeNode(3)
root.left = TreeNode(9)
root.right = TreeNode(20)
result = maxDepth(root)
assert result == 2, "Assertion failed: expected depth 2"
```

## Takeaway

Top-Down 策略透過參數向下傳遞累積狀態，並在葉節點更新全域結果，是解決二元樹路徑問題的關鍵技巧。

## Tomorrow Preview

明天我們將探討 Maximum Depth of Binary Tree (Bottom-Up) 策略，學習如何透過遞迴回傳子樹高度來組合整棵樹的深度，並比較 Top-Down 與 Bottom-Up 兩種思維模式的差異。

## Today's Challenge

- **104** · 此題要求計算二元樹的最大深度，非常適合透過將當前深度由根節點向下傳遞，並在抵達葉節點時更新最大深度值來達成。
  - Hint: 設計一個輔助函式接受節點與目前深度，當節點為空時返回，為葉節點時更新全域最大深度。
