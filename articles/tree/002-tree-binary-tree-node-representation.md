---
id: tree-binary-tree-node-representation
title: Binary Tree Node Representation
module: tree
pattern_label: Binary Tree Node
complexity_label: O(1) / O(1)
estimated_minutes: 15
exit_criteria:
  - >-
    Successfully instantiate a binary tree node and assign child pointers in
    code.
---
## Concept

Binary Tree Node Representation 是建構樹狀結構的基石。在電腦科學中，二元樹節點（Binary Tree Node）是一種包含節點數值以及兩個子節點參考（通常稱為 left 與 right）的資料結構。每一個節點最多擁有兩個分支，分別指向左子樹與右子樹。理解與正確實作二元樹節點，是解決各類樹狀走訪、遞迴與動態規劃問題的第一步。

## Thinking

當我們面對二元樹相關問題時，首要任務是建立儲存資料的基本單元。在設計節點時，我們需要明確定義三個核心屬性：節點儲存的數值（val）、指向左子樹的指標（left）以及指向右子樹的指標（right）。在初始化階段，必須妥善處理指標的預設值，通常將未指定之左右子樹設為空值（null 或 None），以確保後續在進行遞迴邊界條件檢查時不會發生非預期的記憶體存取錯誤。

## Pattern Recognition

在閱讀題目時，若題意提及「左子樹」（left subtree）、「右子樹」（right subtree）、根節點（root）、葉節點（leaf node），或要求走訪階層結構（如 Pre-order、In-order、Post-order 等），這就是使用 Binary Tree Node Pattern 的強烈辨識線索。任何需要將一維資料組織成具有階層關係的結構時，皆需依賴此節點表示法。

## Common Mistakes

初學者在實作二元樹節點時，最常見的錯誤是在建構式中遺漏將 left 與 right 屬性初始化為 null 或 None，這會導致指標處於未定義狀態，進而引發空指標異常。另一個常見誤區是型別定義不嚴謹，未能明確允許指標可以為空值，導致在遞迴終止條件判斷時編譯失敗或執行期崩潰。

## Complexity

時間複雜度：O(1) 於常數時間內完成單一節點的實例化與指標指派。空間複雜度：O(1) 僅消耗固定記憶體來儲存節點的數值與兩個指標。

## Digest

Binary Tree Node Representation 是所有樹狀資料結構與演算法的根本。本單元深入探討二元樹節點的結構設計，包含數值儲存以及左右子樹指標的維護。掌握此基礎能確保我們在後續面對複雜的二元樹走訪與變形問題時，擁有穩固的實作能力。透過 TypeScript 與 Python 的實作演練，我們學會了如何正確初始化節點並透過斷言確保指標狀態無誤，為未來的進階挑戰做好萬全準備。

## TypeScript Tip

在 TypeScript 中設計樹節點時，建議善用聯合型別（Union Types）明確宣告指標可能為 null，以符合嚴格型別檢查的要求。以下為帶有完整型別宣告的範例：

```typescript
class NodeItem {
  constructor(public val: number, public left: NodeItem | null = null, public right: NodeItem | null = null) {}
}
const node = new NodeItem(10);
if (node.val !== 10) throw new Error("assertion failed");
if (node.left !== null) throw new Error("assertion failed");
```

## Python Tip

在 Python 中，若專案規模較大，可以考慮使用 dataclass 來簡化節點的宣告，讓程式碼更為簡潔易讀。以下為使用 dataclass 的範例：

```python
from dataclasses import dataclass

@dataclass
class PyTreeNode:
    val: int = 0
    left: 'PyTreeNode | None' = None
    right: 'PyTreeNode | None' = None

node = PyTreeNode(5)
assert node.val == 5, "assertion failed"
assert node.left is None, "assertion failed"
```

## Takeaway

掌握 Binary Tree Node 的數值與左右指標結構，是通往所有樹狀演算法的必經之路。

## Tomorrow Preview

明天我們將探討如何使用遞迴與走訪演習，在二元樹節點的基礎上進行深度優先搜尋（DFS）與廣度優先搜尋（BFS），進一步解開樹狀結構的各類演算法謎題。

## Today's Challenge

本篇為觀念課，沒有對應的 LeetCode 練習題。請把時間花在把上面的觀念想透。
