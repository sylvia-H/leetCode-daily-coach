---
id: tree-dfs-inorder-traversal
title: DFS Inorder Traversal
module: tree
pattern_label: Depth-First Search
complexity_label: O(n) / O(h)
estimated_minutes: 20
exit_criteria:
  - 能寫出先造訪左子樹、再根節點、再右子樹的遞迴函式。
---
## Concept

Inorder Traversal（中序走訪）是深度優先搜尋的一種固定順序：先走完整個左子樹，再處理根節點，最後走右子樹。名稱裡的 In 指的就是根節點被夾「在中間」處理。上一課的 Preorder 是抵達節點就立刻處理；Inorder 則刻意把處理時機延後，等左邊全部結束才輪到自己。這個延後帶來一個關鍵性質：在二元搜尋樹（BST）上做中序走訪，輸出的數值必然由小到大。理由可以用結構歸納法說清楚——BST 的不變式是「左子樹所有值 < 根 < 右子樹所有值」，而且這條不變式對每一棵子樹都遞迴成立，所以左右子樹本身也都是 BST，歸納假設才用得上。中序保證左子樹全部輸出在根之前、右子樹全部輸出在根之後；假設左右子樹各自的中序輸出已經遞增（歸納假設），三段接起來就是「一段全部比根小的遞增序列、根、一段全部比根大的遞增序列」，兩個銜接處由不變式保證左段最後一項 < 根 < 右段第一項，整體仍然遞增；空樹是最小情形、顯然成立，所以整棵樹成立。

## Thinking

拿到一個節點時，先不要急著記錄它的值，而是一路往左鑽到底——最左下的節點就是第一個被處理的節點，在 BST 上正是最小值。「回來之後要記得處理自己、再去右邊」這件事不用你操心，遞迴呼叫堆疊會替你記住整條回程路徑。於是每當某個節點被處理時，恰好是「它的左子樹已全部輸出、右子樹一個都還沒輸出」的時刻——這對任何二元樹都成立。要再往前一步說「所有比它小的值都已經輸出」，靠的不是這個局部事實，而是上一段證出的遞增性：既然整條輸出序列遞增，已輸出的必然全部比它小、還沒輸出的必然全部比它大，所以第 k 個被處理的節點就是第 k 小的值。這也解釋了為什麼找第 k 小可以提前終止：只要邊走邊計數，數到 k 就能直接回傳，不必把整棵樹走完。

## Pattern Recognition

看到這些訊號就該想到 Inorder：題目給的是 BST 且要求排序後的序列、要找第 k 小（或第 k 大）的元素、要驗證一棵樹是否為合法 BST、或要統計某個數值範圍內的節點。共同點是「BST ＋ 順序」——中序走訪天然產出遞增序列，通常不需要另外排序，時間就從 O(n log n) 省到 O(n)。若需要遞減序列，把順序左右對調（右-根-左）即可。

## Common Mistakes

第一是搞混三種順序：記法很簡單，Pre／In／Post 指的都是「根節點在什麼時候被處理」——最前、中間、最後，而左子樹永遠排在右子樹之前。第二是累加器用錯：若在每層遞迴裡都建立新的空陣列、卻沒有把左右子樹的回傳值接回來，各層的成果互不相通，最後只會拿到殘缺的結果；用外層閉包共享一個陣列，或老老實實合併回傳值，兩者擇一貫徹。第三是用中序驗證 BST 時忘了「嚴格遞增」：序列出現相等的相鄰值就不是合法 BST，比較時寫成允許相等就會漏判。第四是 Python 慣用的 left + [val] + right 合併寫法雖然貼近定義，但每層相加都會複製串列，在歪斜樹上最壞退化成 O(n^2)，效能敏感時應改用共享累加器。

## Complexity

時間複雜度為 O(n)：每個節點恰好被造訪一次、處理一次。額外空間取決於遞迴深度，也就是樹高 h：平衡樹約 O(log n)，完全歪斜的鏈狀樹退化為 O(n)。complexity_label 標示的 O(n) / O(h) 正是這個意思——空間不是常數，而是隨樹的形狀在 log n 與 n 之間變動；若把收集結果的輸出陣列也計入，則另需 O(n)。

## Digest

中序走訪的口訣是「左-根-右」：先走完左子樹、處理根節點、再走右子樹，根節點被夾在中間。它最重要的舞台是二元搜尋樹——由 BST 不變式（左 < 根 < 右）配合歸納法可證：中序輸出必然由小到大。因此凡是「BST ＋ 順序」的問題（取排序序列、找第 k 小、驗證合法性），都不需要額外排序，一趟 O(n) 走訪就能解決；搭配計數器還能提前終止，不必走完整棵樹。實作上以共享累加器收集結果、以空節點作為遞迴終止條件，額外空間是 O(h) 的遞迴堆疊。

## TypeScript Tip

用閉包共享的 res 陣列收集結果，遞迴函式只負責控制順序；空節點是唯一的終止條件。

```typescript
class TreeNode {
  left: TreeNode | null = null;
  right: TreeNode | null = null;
  constructor(public val: number) {}
}
function inorder(root: TreeNode | null): number[] {
  const res: number[] = [];
  const dfs = (n: TreeNode | null): void => {
    if (!n) return;
    dfs(n.left);
    res.push(n.val);
    dfs(n.right);
  };
  dfs(root);
  return res;
}
const root = new TreeNode(2);
root.left = new TreeNode(1);
root.right = new TreeNode(3);
if (inorder(root).join(",") !== "1,2,3") throw new Error("inorder failed");
```

## Python Tip

合併回傳值的寫法最貼近數學定義：左段 + 根 + 右段。注意每層串列相加都會複製，歪斜樹上最壞 O(n^2)；追求效能時改用共享累加器。

```python
class TreeNode:
    def __init__(self, val: int):
        self.val = val
        self.left = None
        self.right = None

def inorder(root: "TreeNode | None") -> list[int]:
    if not root:
        return []
    return inorder(root.left) + [root.val] + inorder(root.right)

root = TreeNode(2)
root.left = TreeNode(1)
root.right = TreeNode(3)
assert inorder(root) == [1, 2, 3]
```

## Takeaway

中序走訪把根節點夾在左右之間處理；在 BST 上，第 k 個被處理的節點就是第 k 小的值。

## Tomorrow Preview

明天將探討 DFS Postorder Traversal（後序走訪）：順序是左-右-根，等左右子樹都處理完才輪到根節點。這種「先知道子樹結果、才能處理自己」的順序，是計算樹高、刪除整棵樹這類問題的天然解法。

## Today's Challenge

- **94** · 中序走訪的標準定義題：依左-根-右的順序回傳所有節點值，用來驗證你能正確寫出遞迴骨架。
  - Hint: 用共享的結果陣列，遞迴函式依序做三件事——走左、收值、走右；空節點直接 return。
- **230** · 在 BST 上找第 k 小的元素，是「中序輸出遞增」性質的直接應用，並能練習提前終止。
  - Hint: 邊走邊計數，第 k 個被處理的節點即為答案；找到後讓遞迴儘早返回，不必走完整棵樹。
