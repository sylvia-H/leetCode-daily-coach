---
id: tree-dfs-postorder-traversal
title: DFS Postorder Traversal
module: tree
pattern_label: Depth-First Search
complexity_label: O(n) / O(h)
estimated_minutes: 20
exit_criteria:
  - 能寫出先造訪左右子樹、再處理根節點的遞迴函式。
---
## Concept

DFS Postorder Traversal 是三種深度優先走訪中「最後處理根節點」的一種：先完整走訪左子樹，再完整走訪右子樹，最後才處理當前節點（Left -> Right -> Root）。與昨天的 Inorder 相比，三者的遞迴骨架完全相同，唯一差別是「處理當前節點」這行程式碼的位置——放在兩個遞迴呼叫之後，就是後序。

這個位置帶來一個關鍵性質：處理邏輯執行時，左右子樹的遞迴呼叫都已返回。遞迴呼叫是同步的，回傳就代表整棵子樹走訪完畢、計算結果就緒。因此後序是 bottom-up 彙整的天然載體——當父節點的答案必須由子樹的答案組合而成時，用它就對了。

## Thinking

以「算出每棵子樹的節點總數」走一次流程：對當前節點先遞迴左子樹取得左邊的節點數，再遞迴右子樹取得右邊的節點數，最後在當前節點組合出 `left + right + 1` 回傳給上一層；base case 是 `null` 回傳 0——空子樹沒有節點，葉節點於是自然得到 1。

為什麼這樣是對的？呼叫堆疊保證了執行順序：控制權回到當前節點那一行時，兩個子呼叫已完整跑完並交出回傳值；再由結構歸納——只要子樹的回傳值正確，組合式就讓當前節點也正確——整棵樹的答案就成立。另一個典型場景是釋放整棵樹：必須先釋放子節點、再釋放父節點，否則刪掉父節點後就失去對子樹的參照，這正是後序的順序。

## Pattern Recognition

出現以下訊號時選後序：父節點的計算依賴子樹回傳的結果（高度、節點數、直徑、是否平衡）；需要「先處理完整棵子樹、再處理自己」（刪除或釋放子樹）；表達式樹求值——運算元必須先於運算子被算出。反之，若資訊是由父往子帶（路徑和、目前深度），那是 top-down 的前序場景。

## Common Mistakes

最典型的錯誤是把彙整邏輯寫在遞迴呼叫之前——這會變成前序，彙整時子樹的回傳值根本還不存在，只能拿到預設值或過期狀態，結果必錯。第二種是把「回傳值」與「答案」混為一談：像最長路徑這類指標，跨過某節點左右兩側的折線無法被父節點延伸，正確做法是回傳可延伸的單側最深高度、答案在各節點就地更新，兩者是不同的量。第三種是誤以為順序寫錯會造成無窮遞迴或堆疊溢位——其實終止條件與堆疊深度都不受處理時機影響；錯的是結果，而且錯得安靜，務必用小樹手動驗證一次。

## Complexity

時間複雜度 O(n)：每個節點恰被造訪一次，每次處理為常數時間。空間複雜度 O(h)：額外空間來自遞迴呼叫堆疊，任一時刻堆疊上恰是根到當前節點的一條路徑；平衡樹為 O(log n)，最壞的斜樹退化為 O(n)。

## Digest

後序走訪的順序是 Left -> Right -> Root：處理邏輯放在兩個遞迴呼叫之後，執行時左右子樹必然已走訪完畢、回傳值就緒——這使它成為 bottom-up 彙整的天然載體。凡是父節點的答案由子樹答案組合而成的問題（高度、節點數、直徑、平衡檢查、釋放整棵樹、表達式樹求值），都循同一骨架：遞迴左、遞迴右、在當前節點組合並回傳。同時記得區分「回傳給父節點的可延伸值」與「在各節點就地更新的全域答案」，這是直徑類問題的關鍵。時間 O(n)、空間 O(h)。

## TypeScript Tip

後序把「處理」放在兩個遞迴之後；用累積參數收集結果，避免每層合併陣列：

```typescript
import assert from "node:assert";

class TreeNode {
  constructor(
    public val: number,
    public left: TreeNode | null = null,
    public right: TreeNode | null = null,
  ) {}
}

function postorder(root: TreeNode | null, out: number[] = []): number[] {
  if (!root) return out;
  postorder(root.left, out);
  postorder(root.right, out);
  out.push(root.val);
  return out;
}

const t = new TreeNode(1, new TreeNode(2, new TreeNode(4), new TreeNode(5)), new TreeNode(3));
assert.deepStrictEqual(postorder(t), [4, 5, 2, 3, 1]);
```

## Python Tip

後序也常用來聚合子樹指標——節點總數就是「左結果 + 右結果 + 自己」：

```python
class TreeNode:
    def __init__(self, val=0, left=None, right=None):
        self.val = val
        self.left = left
        self.right = right

def count(root) -> int:
    if not root:
        return 0
    return count(root.left) + count(root.right) + 1

t = TreeNode(1, TreeNode(2, TreeNode(4), TreeNode(5)), TreeNode(3))
assert count(t) == 5
assert count(None) == 0
```

## Takeaway

後序在回溯階段處理節點，保證左右子樹結果已就緒，是 bottom-up 彙整的基礎。

## Tomorrow Preview

明天進入 Maximum Depth of Binary Tree（Bottom-Up）：把今天的後序骨架直接套上「深度」這個指標，完整練習由子樹回傳值向上聚合的流程。

## Today's Challenge

- **145** · 標準後序走訪練習：把「處理節點」具體化為收集節點值，直接驗證 Left -> Right -> Root 的遞迴掌握度。
  - Hint: 先遞迴左子樹、再遞迴右子樹，最後把當前節點值加入結果；與前序只差一行的位置。
- **1245** · 題目以邊清單描述一般樹（非二元）：每個節點聚合「所有」子節點回傳的最深路徑，正是後序 bottom-up 彙整在一般樹上的實戰。
  - Hint: DFS 回傳往下最深的路徑長，並在每個節點用最大與次大兩條子路徑之和更新直徑。
