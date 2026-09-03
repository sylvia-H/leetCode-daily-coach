---
id: tree-core-concept-introduction
title: Tree Core Concept Introduction
module: tree
pattern_label: Hierarchical Data Structure
complexity_label: O(n) / O(h)
estimated_minutes: 15
exit_criteria:
  - 能正確定義 root、parent、child、leaf、depth 與 height。
---
## Concept

線性結構（陣列、鏈結串列）把元素排成一條線，每個元素最多只有一個「下一個」；Tree 則是階層式資料結構，由節點（node）與有向邊（edge）組成，每個節點可以分支出多個 child，天生適合表達一對多的從屬關係。嚴謹的定義是：一棵含 n 個節點的樹恰有 n - 1 條邊、連通且無環；除了 root 之外，每個節點恰有一個 parent。基本術語：Root 是唯一沒有 parent 的最頂端節點，是所有其他節點的祖先；Parent 與 Child 是相鄰上下層的節點；Leaf 是沒有任何 child 的終端節點。Depth 是從 root 沿唯一路徑走到該節點所經過的邊數，由上往下量；Height 是從該節點走到最遠 leaf 的最長路徑邊數，由下往上量。兩者方向相反：root 的 depth 是 0，整棵樹的 height 就等於 root 的 height。樹最重要的性質是遞迴定義——一棵樹等於一個 root 加上零個或多個互不相交的子樹，而每棵子樹本身也是一棵完整的樹。這個自我相似性是後續所有樹狀演算法共同的地基。

## Thinking

面對樹的問題，第一步是把視角從「逐格走訪」切換成「自我相似的遞迴」：對任何節點而言，以它為 root 的子樹與整棵樹結構同型、只是規模較小，所以「對整棵樹做的事」幾乎都能改寫成「先對每棵子樹做同一件事，再合併結果」。設計遞迴時要先回答兩個問題。第一是終止條件：節點為空或沒有 child 時要回傳什麼預設值？例如數節點總數時空樹回 0、算 height 時 leaf 回 0；預設值一旦取錯，每一層合併都會把錯誤放大。第二是遞迴為什麼保證會停：因為樹無環且節點數有限，每往 child 走一步，剩下的子樹就嚴格變小，呼叫鏈最深只到 leaf 便必然折返——這正是「無環」性質在正確性論證中扮演的角色；換成有環的圖，同一套寫法會無窮遞迴。走訪順序上，深度優先搜尋（DFS）順著一條分支走到底再回頭，天生契合遞迴；廣度優先搜尋（BFS）逐層掃描，需要 queue 輔助。

## Pattern Recognition

看到「上下層級」就該想到樹：組織架構、檔案目錄、HTML 的 DOM、分類階層、決策分支，共同特徵是每個元素恰有一個上層來源、卻可以展開多個下層分支。更具操作性的判斷訊號有三個：資料之間存在明確的父子從屬而非前後順序；問題可以從單一入口拆成幾個互不重疊的子問題；整體答案可以由子問題的答案合併而得，例如整棵樹的節點數等於 1 加上各子樹節點數之和。若處理邏輯需要逐層深入或自底向上聚合數值，通常就是在樹上做遞迴。

## Common Mistakes

最常見的錯誤是混淆 depth 與 height：兩者都以邊數計，但 depth 從 root 往下量、height 從該節點往最遠 leaf 量，方向相反；只有單一節點的樹，depth 與 height 都是 0。另外部分教材改以「節點數」計算，數值會差 1，讀題時先確認慣例。第二類錯誤是遺漏空節點檢查：遞迴函式沒有處理空值的分支，一碰到缺 child 的節點就拋出空指標錯誤。第三類是誤把圖當樹：樹保證無環，遞迴才必然終止；若資料實際上有環（例如指標互指），同一套遞迴會耗盡呼叫堆疊。最後，手動串接節點時方向接反或漏接，會造成孤立節點或意外共享子樹，之後的走訪結果就難以解釋。

## Complexity

Time Complexity: O(n)，其中 n 為節點總數——任何完整走訪都必須把每個節點各拜訪一次，而每條邊只被經手常數次（下去一次、回來一次），邊數又固定是 n - 1，所以總工作量與節點數成正比。Space Complexity: O(h)，其中 h 為樹的高度——遞迴呼叫堆疊的最大深度等於 h。平衡樹的 h 約為 log n，退化成一條鏈時 h 可達 n，因此分析樹狀演算法時應同時交代平均與最壞情況。

## Digest

Tree 是由節點與有向邊組成的階層式資料結構：n 個節點、n - 1 條邊、連通且無環，除 root 外每個節點恰有一個 parent。核心術語：Root 是唯一無 parent 的起點、Leaf 是無 child 的終端、Depth 是 root 到該節點的邊數（往下量）、Height 是該節點到最遠 leaf 的邊數（往上量）。樹的遞迴定義——一棵樹是 root 加上若干互不相交的子樹——讓「處理整棵樹」可以拆成「處理各子樹再合併結果」；無環且節點有限，則保證遞迴必然終止。完整走訪花 O(n) 時間，遞迴堆疊佔 O(h) 空間：平衡時 h 約 log n，退化成鏈時 h 為 n。

## TypeScript Tip

用 class 定義一般樹節點，`children` 陣列承載任意分支數；`height` 的遞迴直接對應定義：leaf 回 0，否則取各子樹 height 的最大值加一。

```typescript
class TreeNode {
  children: TreeNode[] = [];
  constructor(public val: number) {}
  add(child: TreeNode): this {
    this.children.push(child);
    return this;
  }
}
function height(node: TreeNode): number {
  if (node.children.length === 0) return 0;
  return 1 + Math.max(...node.children.map(height));
}
const root = new TreeNode(1);
const mid = new TreeNode(2);
root.add(mid);
mid.add(new TreeNode(3));
if (height(root) !== 2) throw new Error("root height should be 2");
if (height(new TreeNode(9)) !== 0) throw new Error("leaf height is 0");
```

## Python Tip

用 class 搭配 `list` 存放 children；`height` 以 generator 對子樹取最大值，單一節點（leaf）回 0，與「以邊數計」的定義一致。

```python
class TreeNode:
    def __init__(self, val: int):
        self.val = val
        self.children: list['TreeNode'] = []

def height(node: TreeNode) -> int:
    if not node.children:
        return 0
    return 1 + max(height(c) for c in node.children)

root = TreeNode(1)
mid = TreeNode(2)
root.children.append(mid)
mid.children.append(TreeNode(3))
assert height(root) == 2, "root height should be 2"
assert height(TreeNode(9)) == 0, "leaf height is 0"
```

## Takeaway

Tree 是無環的階層結構：root 唯一、leaf 無 child，depth 往下量、height 往上量，遞迴定義讓整棵樹可拆成子樹處理。

## Tomorrow Preview

明天進入 Binary Tree Node Representation：親手實作含 value、left、right 指標的二元樹節點，把今天的術語落實成程式碼結構，為後續的走訪演算法鋪路。

## Today's Challenge

本篇為觀念課，沒有對應的 LeetCode 練習題。請在紙上畫一棵小樹，標出每個節點的 depth 與 height，確認自己能不查表說出兩者的差別。
