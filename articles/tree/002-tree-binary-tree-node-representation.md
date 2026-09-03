---
id: tree-binary-tree-node-representation
title: Binary Tree Node Representation
module: tree
pattern_label: Binary Tree Node
complexity_label: O(1) / O(1)
estimated_minutes: 15
exit_criteria:
  - 能在程式碼中成功建立二元樹節點並指定子節點指標。
---
## Concept

二元樹節點（Binary Tree Node）是所有樹狀演算法共同的基本單元。它只做一件事：把一份資料和兩條往下的路綁在一起——一個存放數值的欄位 `val`、一個指向左子樹的指標 `left`、一個指向右子樹的指標 `right`。「二元」的限制就落在這兩個指標上：每個節點至多兩個子節點，且左右有別、不可互換。真正值得記住的是它的遞迴定義：一棵二元樹要嘛是空（null），要嘛是「一個節點，加上左右兩棵同樣是二元樹的子樹」。null 在這裡不是錯誤狀態，而是定義的一等成員——它代表「空子樹」，之後每一個樹狀遞迴的終止條件都建立在它之上。在 TypeScript 與 Python 這類語言中沒有裸指標，「指標」的實體就是物件參照：變數存的是找到節點物件的門牌，而不是節點本身。

## Thinking

設計節點時照著遞迴定義走即可：宣告一個 class，含 `val`、`left`、`right` 三個欄位，並在建構式把未指定的左右子樹預設為 null。為什麼預設值非給不可？因為「這裡沒有子樹」必須是一個能被程式判斷的明確狀態——之後所有走訪函式都靠 `node === null` 這一個判斷收斂遞迴，若指標停在未定義狀態，邊界判斷就會失準甚至直接當掉。掛載子樹則只是一次指派：把父節點的 `left` 或 `right` 改寫為子節點的參照，不搬動、不複製任何資料，而該子節點底下的整棵子樹會自動一併掛上。也因為定義是遞迴的，任何子節點本身就是另一棵完整二元樹的根——這正是日後所有遞迴演算法「對整棵樹成立，就對每棵子樹成立」的結構基礎。

## Pattern Recognition

題目提到左子樹（left subtree）、右子樹（right subtree）、根節點（root）、葉節點（leaf），或給你的輸入直接是一個 root 節點而不是陣列，就是在這個節點模型上作業。凡是資料具有階層關係、且每層至多分成兩路的問題——各種走訪順序、樹高與路徑計算、Binary Search Tree 的操作——底層全都是同一個 val + left + right 結構。

## Common Mistakes

第一，建構式漏掉把 `left` 與 `right` 初始化為 null，指標停在未定義狀態，之後以 null 判斷邊界時直接失準。第二，在 strict TypeScript 下把型別寫成 `left: TreeNode`（不含 null）：型別上不允許空子樹，葉節點根本宣告不出來，遞迴終止條件也過不了型別檢查——正確寫法是聯合型別 `TreeNode | null`。第三，讓子節點的指標反指回祖先、或兩個節點互指，這會在結構裡造出環，之後任何遞迴走訪都會無限循環；樹的定義要求指標只能一路向下。第四，混淆「節點」與「樹」：程式裡代表一棵樹的，其實只是它 root 節點的參照，root 為 null 就是合法的空樹，函式介面必須接受它。

## Complexity

時間複雜度：建立單一節點與掛載子節點皆為 O(1)——一次物件配置、一次指標指派。空間複雜度：單一節點 O(1)；儲存 n 個節點的樹共需 O(n)，其中每個節點固定攜帶兩個子樹指標的額外欄位。

## Digest

二元樹節點＝ `val` ＋ `left` ＋ `right`：一份資料、兩條往下的路，左右有別。它的遞迴定義——樹要嘛是 null、要嘛是節點加上兩棵子樹——讓 null 成為「空子樹」的一等表示法，也是日後所有樹狀遞迴的終止條件。實作上用 class 宣告三個欄位，建構式把左右指標預設為 null；strict TypeScript 下型別必須寫成 `TreeNode | null`，葉節點與空樹才有合法表示。建節點與掛子樹都是 O(1) 的指標操作。把這個最小單元建穩，明天開始的各種走訪，就只是在同一個結構上安排「先看誰、後看誰」。

## TypeScript Tip

用建構式參數屬性一行宣告三個欄位；`left` 與 `right` 的型別必須顯式包含 `null`，葉節點與空樹才有合法表示。

```typescript
class TreeNode {
  constructor(
    public val: number,
    public left: TreeNode | null = null,
    public right: TreeNode | null = null,
  ) {}
}

const left = new TreeNode(2);
const right = new TreeNode(3);
const root = new TreeNode(1, left, right);
if (root.left !== left || root.right !== right) {
  throw new Error("child link assertion failed");
}
if (left.left !== null || left.right !== null) {
  throw new Error("leaf pointers must default to null");
}
```

## Python Tip

在 `__init__` 給齊三個參數的預設值，讓 `TreeNode(5)` 直接得到一個左右皆為 None 的合法葉節點。

```python
class TreeNode:
    def __init__(self, val=0, left=None, right=None):
        self.val = val
        self.left = left
        self.right = right

leaf = TreeNode(2)
root = TreeNode(1, leaf, TreeNode(3))
assert root.left is leaf and root.left.val == 2
assert root.right is not None and root.right.val == 3
assert leaf.left is None and leaf.right is None, "leaf must default to None"
```

## Takeaway

節點＝val＋left＋right；null 是「空子樹」的一等表示，左右指標預設為 null 是所有樹狀遞迴的地基。

## Tomorrow Preview

明天進入 DFS Preorder Traversal：在今天的節點結構上寫出第一支遞迴走訪，依 Root -> Left -> Right 的順序，先處理當前節點、再依序走訪左右子樹。

## Today's Challenge

本課是純觀念課，沒有指定的 LeetCode 題目。請在 TypeScript 與 Python 各實作一次 TreeNode class，親手串出一棵三個節點的小樹，並用斷言驗證葉節點的左右指標確實預設為 null / None。
