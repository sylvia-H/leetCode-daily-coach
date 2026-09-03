---
id: tree-invert-binary-tree
title: Invert Binary Tree
module: tree
pattern_label: Tree Transformation
complexity_label: O(n) / O(h)
estimated_minutes: 15
exit_criteria:
  - 能對二元樹中的每個節點交換 left 與 right 指標。
---
## Concept

昨天的 Symmetric Tree 檢查是比較一棵樹「是否等於自己的鏡像」，全程唯讀；今天更進一步——親手把鏡像做出來。所謂反轉（invert）就是產生鏡像：對樹中每一個節點，把它的 left 與 right 指標對調。為什麼這樣就夠了？可以用鏡像的遞迴定義來論證：一棵樹的鏡像，是「根節點不變，左子樹換成原右子樹的鏡像，右子樹換成原左子樹的鏡像」。這個定義本身就是遞迴的——只要每個節點都完成一次交換，而它的兩個子樹也各自被鏡像，整棵樹就是鏡像；空樹的鏡像則仍是空樹，天然構成遞迴的終點。反過來說，只要漏掉任何一個節點的交換，該節點以下的左右關係就會維持原樣，鏡像就不完整。因此「逐節點交換」不是實作上的巧合，而是鏡像定義的直接落實。

## Thinking

遞迴版的骨架非常短。Base case：空節點的鏡像仍是空節點，直接回傳 null。一般情況：把當前節點的 left 與 right 對調，再分別對兩個子樹遞迴做同樣的事。交換放在兩次遞迴之前（前序式）或之後（後序式）都可以，兩者都維持同一個不變式：「每個節點恰好被交換一次，且兩棵原子樹各被遞迴恰好一次」，這正是正確性的全部所需。但交換唯獨不能夾在兩次遞迴中間（中序式）：交換之後，第二次遞迴的對象已經變成剛處理完的原左子樹，於是它被反轉兩次而復原，原右子樹卻一次都沒進去。可見關鍵不只是「交換只動自己的兩個指標」，更在於兩次遞迴必須分別落在兩棵不同的原子樹上——前序式與後序式都滿足這點。迭代版利用的也是同一個性質：用佇列（BFS）或堆疊（DFS）走訪，每取出一個節點就交換它的左右指標，再把非空的子節點放入容器。取出順序完全不影響結果——兩個子節點總是一起放進容器，不會像中序式那樣漏掉一邊；唯一的要求是每個節點都被取出恰好一次。

## Pattern Recognition

看到「鏡像」「翻轉」「改造整棵樹結構」這類要求時，就能對應到 Tree Transformation 這個 Pattern：與昨天的對稱檢查同樣要走訪整棵樹，但性質從唯讀的判斷變成會寫入的結構修改——透過指標重新指向（in-place）直接改造原樹，不需要配置任何新節點。這類題的通用解法是：只定義「單一節點該做什麼轉換」（這裡是交換兩個指標），子樹的部分完全信任遞迴會處理好。能否把問題化約成「一個節點的局部操作＋兩個子樹的相同子問題」，就是判斷 Tree Transformation 是否適用的試金石。

## Common Mistakes

最經典的錯誤是逐句賦值遺失參照：先寫 `root.left = root.right`、再寫 `root.right = root.left`，第二句讀到的已是更新後的 left，結果兩個指標同指原右子樹、原左子樹永遠遺失。解法是先用暫存變數保住其中一邊，或用 TypeScript 的解構賦值、Python 的同時賦值一步完成。同一個陷阱的遞迴版更隱蔽：先寫 `root.left = invert(root.right)`、再寫 `root.right = invert(root.left)`，第二次遞迴吃到的是剛掛上去的新 left——也就是已反轉的原右子樹——把它又反轉回原狀，最後左右指標同指原右子樹，原左子樹一樣遺失。其次是忘記 base case：遞迴走到空節點時未直接回傳，對 null 取 left 會拋出執行期錯誤。最後，別誤以為只交換根節點的兩個孩子就完成了——鏡像要求每一層的左右關係都對調，必須深入處理到每一個節點。

## Complexity

時間複雜度 O(n)：每個節點恰好被走訪一次，每次只做常數次指標操作。空間複雜度 O(h)：遞迴深度等於樹高 h，平衡樹約為 O(log n)，樹退化成鏈狀時最壞為 O(n)；若改用 BFS 迭代，額外空間則取決於最寬一層的節點數。

## Digest

反轉二元樹＝產生整棵樹的鏡像：對每一個節點交換 left 與 right 指標。正確性來自鏡像的遞迴定義——根不動、左右子樹互換並各自鏡像，所以「每個節點恰交換一次」就是全部所需。前序、後序、層序都能完成反轉，唯獨把交換夾在兩次遞迴中間（中序式）會重複反轉原左子樹、漏掉原右子樹。實作上用同時賦值或暫存變數，避免逐句覆蓋導致參照遺失。時間 O(n)、空間 O(h)。昨天唯讀地檢查鏡像，今天親手建出鏡像——這組讀寫對照正是 Tree Transformation 的入門。

## TypeScript Tip

解構賦值讓交換一步完成：右側兩個遞迴呼叫都在寫入前求值完畢，天然避開「第二句讀到已更新指標」的陷阱。

```typescript
class TreeNode {
  left: TreeNode | null = null;
  right: TreeNode | null = null;
  constructor(public val: number) {}
}

function invert(root: TreeNode | null): TreeNode | null {
  if (!root) return null;
  [root.left, root.right] = [invert(root.right), invert(root.left)];
  return root;
}

const root = new TreeNode(1);
root.left = new TreeNode(2);
root.left.right = new TreeNode(3);
const r = invert(root);
if (r?.right?.val !== 2 || r.right.left?.val !== 3) {
  throw new Error("invert failed");
}
```

## Python Tip

Python 的同時賦值會先把右側整組求值完畢，再由左至右逐一指派給左側目標，因此兩個遞迴結果不會互相干擾，一行就完成交換。

```python
class TreeNode:
    def __init__(self, val=0, left=None, right=None):
        self.val, self.left, self.right = val, left, right

def invert(root: TreeNode | None) -> TreeNode | None:
    if root:
        root.left, root.right = invert(root.right), invert(root.left)
    return root

root = TreeNode(1, TreeNode(2, None, TreeNode(3)), None)
r = invert(root)
assert r is not None and r.right is not None
assert r.right.val == 2 and r.right.left is not None
assert r.right.left.val == 3
```

## Takeaway

鏡像整棵樹＝每個節點恰好交換一次 left 與 right；前序後序皆可，用同時賦值避免逐句覆蓋遺失參照。

## Tomorrow Preview

tree 模組到此收官——從節點表示、三種 DFS 走訪、深度與平衡檢查，一路走到樹的比較與鏡像轉換，「拆成子樹、信任遞迴」的思維已經完整成形。明天起展開全新的模組，用同樣的節奏繼續推進。

## Today's Challenge

- **226** · 反轉二元樹的原型題：整棵樹的 in-place 鏡像轉換，恰好對應「單節點交換指標＋遞迴處理兩子樹」的 Tree Transformation 骨架。
  - Hint: 空節點直接回傳；交換用同時賦值或暫存變數，避免第二句讀到已更新的指標。
