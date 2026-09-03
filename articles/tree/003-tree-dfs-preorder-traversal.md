---
id: tree-dfs-preorder-traversal
title: DFS Preorder Traversal
module: tree
pattern_label: Depth-First Search
complexity_label: O(n) / O(h)
estimated_minutes: 20
exit_criteria:
  - 能寫出先造訪當前節點、再左子樹、再右子樹的遞迴函式。
---
## Concept

DFS Preorder Traversal 是二元樹深度優先走訪的第一種，順序固定為 Root -> Left -> Right：先處理當前節點，再遞迴走完整棵左子樹，最後走右子樹。這個順序帶來一個可以嚴格陳述的保證——任何節點都會在它子樹裡的所有節點之前被處理。理由來自遞迴結構本身：處理根的那行程式碼永遠排在兩個遞迴呼叫之前，而每一層遞迴都重複同樣的安排，「父先於子」於是被一路傳遞到每一棵子樹。凡是需要自頂向下做事的場景——把樹序列化成字串、複製整棵樹、把父層狀態往下傳——preorder 都是天然的選擇。

## Thinking

遞迴實作只有兩個要素。Base case：節點為 null 時直接 return——null 代表空子樹，是遞迴唯一的出口。Recursive step：先把當前節點的值收進結果，再依序遞迴左、右子樹。正確性可以用歸納法說服自己：空樹的走訪結果是空序列，顯然正確；假設 preorder 對任何較小的樹都正確，那麼對一棵以 root 為根的樹，輸出＝root 的值＋左子樹的正確 preorder ＋右子樹的正確 preorder，恰好就是定義要求的順序。至於「右子樹稍後才輪到」這件事不必自己操心：呼叫堆疊（call stack）會在深入左子樹期間，替每一層記住還沒走的右子樹，回傳時逐層接手。

## Pattern Recognition

三個訊號指向 preorder：題目要求對父節點做完某件事之後，子節點的處理才有意義（例如把根到當前節點的路徑、深度或累計值往下傳）；需要把樹序列化或複製，而重建時必須先知道根是誰；輸出順序被明確要求為「根在最前」。判斷句只有一句：處理節點的程式碼是否必須放在兩個遞迴呼叫之前？是，就是 preorder。

## Common Mistakes

第一，漏寫 base case：遞迴收到 null 後直接存取 `node.val`，在 Python 是 AttributeError、在 JavaScript 是 TypeError——當掉的位置是空值存取，而不是想像中的無窮遞迴。第二，真正的 stack overflow 風險來自樹太深：完全退化成鏈狀的樹會讓遞迴深度達到 n，Python 預設遞迴上限約一千層，超深的樹要改用顯式 stack 的迭代版。第三，Python 特有陷阱：把收集結果的串列寫成可變預設參數 `def preorder(node, out=[])`——預設值只在函式定義時建立一次，第二次呼叫會沿用上一次的殘留內容；正確做法是預設 None、進函式再建立新串列。第四，左右順序寫反：Root -> Right -> Left 是另一種走訪，輸出序列完全不同。

## Complexity

時間複雜度 O(n)：每個節點恰被造訪一次，單節點處理成本為常數。空間複雜度 O(h)，h 為樹高——呼叫堆疊最深時，恰好裝著從根到最深葉節點這條路徑上的每一層呼叫；平衡樹的 h 約為 log n，最壞情況（鏈狀樹）h = n，堆疊空間隨之退化為 O(n)。

## Digest

Preorder 遵循 Root -> Left -> Right：處理當前節點的程式碼放在兩個遞迴呼叫之前，因此任何節點都保證先於其子樹被處理，適合序列化、複製與自頂向下傳遞狀態的場景。實作只有兩件事：null 即 return 的 base case，以及「收值、走左、走右」的遞迴步驟；尚未輪到的右子樹由呼叫堆疊自動記住。時間複雜度 O(n)、空間複雜度 O(h)，鏈狀樹會讓 h 退化為 n。Python 要留意預設遞迴深度上限，以及可變預設參數共用同一個串列的陷阱。

## TypeScript Tip

用預設參數讓所有遞迴呼叫共享同一個結果陣列；base case 直接回傳 out，呼叫端不需要另外判空。JavaScript 的預設值是每次呼叫才求值，因此沒有 Python 可變預設參數那種跨呼叫殘留的問題。

```typescript
class TreeNode {
  constructor(
    public val: number,
    public left: TreeNode | null = null,
    public right: TreeNode | null = null,
  ) {}
}

function preorder(root: TreeNode | null, out: number[] = []): number[] {
  if (root === null) return out;
  out.push(root.val);
  preorder(root.left, out);
  preorder(root.right, out);
  return out;
}

const root = new TreeNode(1, new TreeNode(2, null, new TreeNode(4)), new TreeNode(3));
if (preorder(root).join(",") !== "1,2,4,3") {
  throw new Error("preorder must visit root before subtrees");
}
```

## Python Tip

收集結果的串列千萬別寫成可變預設參數；用 None 當哨兵、進函式再建立新串列，重複呼叫才不會互相污染。

```python
class TreeNode:
    def __init__(self, val=0, left=None, right=None):
        self.val = val
        self.left = left
        self.right = right

def preorder(node, out=None):
    if out is None:
        out = []
    if node is None:
        return out
    out.append(node.val)
    preorder(node.left, out)
    preorder(node.right, out)
    return out

root = TreeNode(1, TreeNode(2, None, TreeNode(4)), TreeNode(3))
assert preorder(root) == [1, 2, 4, 3]
assert preorder(root) == [1, 2, 4, 3], "repeated calls must not share state"
```

## Takeaway

Preorder＝先收當前節點、再走左、後走右；base case 是 null 即 return，「父先於子」的保證來自遞迴結構本身。

## Tomorrow Preview

明天進入 DFS Inorder Traversal：把處理節點的時機移到左右子樹之間，Left -> Root -> Right 的順序在 Binary Search Tree 上會恰好吐出由小到大的排序結果。

## Today's Challenge

- **144** · 標準 preorder 檢定題：要求回傳整棵樹 Root -> Left -> Right 的走訪序列，可直接對照今天的兩要素——base case 與「收值、走左、走右」。
  - Hint: 先把當前節點的值推入結果，再遞迴左子樹、最後右子樹；行有餘力可再用顯式 stack 寫一版迭代解。
- **114** · 攤平後的鏈結順序恰好就是 preorder 序列；本題檢驗你是否吃透「父先於子」的順序保證，並在走訪的同時原地改寫指標。
  - Hint: 試著反過來以 Right -> Left -> Root 的順序走訪，維護「上一個處理的節點」，把 node.right 接向它，並記得同時把 node.left 清成空值。
