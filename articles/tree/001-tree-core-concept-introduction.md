---
id: tree-core-concept-introduction
title: Tree Core Concept Introduction
module: tree
pattern_label: Hierarchical Data Structure
complexity_label: O(n) / O(h)
estimated_minutes: 15
exit_criteria:
  - 'Define root, parent, child, leaf, depth, and height correctly.'
---
## Concept

Tree Core Concept Introduction 探討的是一種階層式的資料結構，由節點與有向邊所組成，具備天生的遞迴特性。在線性資料結構如陣列與鏈結串列中，元素呈一維序列排列；而 Tree 則能有效表達一對多的父子關係。理解樹的核心結構必須掌握幾個基本術語：Root 代表樹的最頂端節點，是所有其他節點的祖先；Parent 與 Child 分別指上下層的相鄰節點；Leaf 則是沒有任何子節點的終端節點。此外，Depth 定義為從根節點到特定節點的路徑長度，Height 則定義為從特定節點到最遠葉節點的最長路徑長度。理解這些定義是分析遞迴演算法基礎的關鍵。

## Thinking

當面對階層式資料結構時，思考方式必須轉換為自我相似的遞迴視角。首先需要找出 Root 節點作為遞迴的進入點，接著觀察子節點如何延續相同的樹狀結構。對於每一個節點而言，以該節點為根的子樹在結構上與整棵樹完全相同。因此，設計演算法時通常會採用深度優先搜尋或廣度優先搜尋，將大問題拆解為處理左子樹與右子樹的小問題。在追蹤狀態時，必須明確定義遞迴的終止條件，也就是當節點為空或抵達 Leaf 節點時應當回傳何種預設值，藉此確保遞迴調用能夠正確收斂。

## Pattern Recognition

當題目描述的資料呈現出明顯的上下層級、組織架構、目錄結構、或者決策分支時，即可辨識出 Hierarchical Data Structure 的 Pattern。常見的特徵包含元素之間存在明確的父子依賴、允許從單一入口分支出多個子問題、且問題本身具備最優子結構或可遞迴求解的性質。若資料處理邏輯需要逐層深入或自底向上進行數值聚合，通常也可以利用樹狀結構的遞迴特性來簡化實作。

## Common Mistakes

初學者在學習樹狀結構時，常見的錯誤包含混淆 Tree Depth 與 Tree Height 的計算方式，誤將整棵樹的深度與高度視為完全相同。另一個常見的迷思是忽略了樹的無環性質，誤以為任意圖形結構都可以直接套用樹的遞迴邏輯。在實作遞迴時，若遺漏了針對空節點的防禦性檢查，將會導致空指標異常。此外，在手動建構樹狀節點時，若指標串接錯誤，亦容易造成孤立節點或無窮遞迴。

## Complexity

Time Complexity: O(n)，其中 n 為樹中的節點總數，因為在最壞情況下必須走訪每一個節點一次。Space Complexity: O(h)，其中 h 為樹的高度，主要取決於遞迴調用堆疊所消耗的記憶體空間。在平衡二元樹中高度為 log n，而在極端不平衡的鏈狀樹中高度則可能達到 n。

## Digest

本單元深入剖析 Tree Core Concept Introduction 與 Hierarchical Data Structure。樹狀結構由節點與有向邊組成，核心術語包含 Root、Parent、Child、Leaf、Depth 與 Height。透過遞迴思維，我們可以將複雜的階層問題拆解為子問題。在 TypeScript 與 Python 的實作中，我們定義了包含數值與子指標的類別來建構節點。掌握這些基礎觀念後，便能順利銜接後續的走訪與進階樹狀演算法。

## TypeScript Tip

```typescript
interface NodeInterface<T> {
  val: T;
  children: NodeInterface<T>[];
}
function countNodes<T>(root: NodeInterface<T> | null): number {
  if (!root) return 0;
  let count = 1;
  for (const child of root.children) {
    count += countNodes(child);
  }
  return count;
}
const node: NodeInterface<number> = { val: 1, children: [] };
if (countNodes(node) !== 1) throw new Error("assertion failed");
```

## Python Tip

```python
class GeneralTreeNode:
    def __init__(self, val: int):
        self.val = val
        self.children: list['GeneralTreeNode'] = []

def count_nodes(root: GeneralTreeNode | None) -> int:
    if not root:
        return 0
    return 1 + sum(count_nodes(child) for child in root.children)

root = GeneralTreeNode(1)
assert count_nodes(root) == 1, "assertion failed"
```

## Takeaway

Tree 是由節點與邊構成的階層式資料結構，具備天生的遞迴特性，透過掌握 Root、Leaf、Depth 與 Height 等術語能建立扎實的基礎。

## Tomorrow Preview

明天將進一步探討 Binary Tree 的走訪策略，包含 Pre-order、In-order 與 Post-order 的遞迴與迭代實作方式，並分析不同走訪順序在解決實際問題時的應用場景。

## Today's Challenge

本篇為觀念課，沒有對應的 LeetCode 練習題。請把時間花在把上面的觀念想透。
