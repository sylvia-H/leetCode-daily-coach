---
id: linked-list-insertion-head-tail
title: Linked List Insertion at Head and Tail
module: linked-list
pattern_label: Pointer Manipulation
complexity_label: 'O(1) for head, O(n) or O(1) with tail / O(1)'
estimated_minutes: 20
exit_criteria:
  - 能藉由正確更新 head 指標，以 O(1) 時間在開頭插入節點
  - 能處理如插入初始為空的串列等邊界情況
---
## Concept

在 Linked List 中進行節點的 Head 與 Tail 插入操作是基礎且核心的指標操作。其核心在於建立一個新節點，並透過仔細地重新配置指標，將新節點正確地串接到現有的鏈結串列中。對於 Head 插入而言，時間複雜度為 O(1)，因為我們只需要直接更新頭部指標；而對於 Tail 插入，如果沒有維護尾部指標則需要 O(n) 的時間來走訪整條串列，但若有維護尾部指標則可以達到 O(1) 的時間複雜度。理解這些指針的指向順序是掌握複雜資料結構（例如 LRU Cache 或 Graph）的基石。

## Thinking

在處理 Linked List 插入時，思考的順序與指標的賦值順序至關重要。以 Head 插入為例，正確的思考路徑是：首先建立新節點，接著將新節點的 next 指標指向現有的 head（即 newNode.next = head），最後才將 head 指標更新為這個新節點（即 head = newNode）。如果顛倒順序，先更新了 head 指標，原本串列的其餘部分就會失去參考點而造成記憶體遺失。當面對初始狀態為空的 Linked List 時，必須額外考慮空指標的邊界條件，確保 head 與 tail 指針在插入第一個節點後能正確同時指向該節點。

## Pattern Recognition

當題目要求動態建構 Linked List、實作自訂資料結構（如 MyLinkedList）、或是模擬佇列（Queue）與堆疊（Stack）等先進先出或後進先出的行為時，即可高效率識別出 Pointer Manipulation Pattern。此 Pattern 的特徵在於頻繁地讀取與修改節點之間的參照關係，且必須特別注意指標斷開前的暫存與賦值順序，以避免發生 NullPointerException 或記憶體流失。

## Common Mistakes

最常見的錯誤是在進行 Head 插入時，先將 head 指標指向新節點，才讓新節點去連接舊的 head。這樣做會直接切斷與後續所有節點的連結，導致整條串列遺失。另一個常見錯誤是忽略了當 Linked List 原本為空（head 為 null）時的特殊狀態，導致在對 Tail 進行插入時未同時更新 head 指標，使得資料結構處於不一致的狀態。

## Complexity

O(1) for head, O(n) or O(1) with tail / O(1)

## Digest

本單元深入探討 Linked List 的基本核心操作：在頭部（Head）與尾部（Tail）進行節點插入。透過 Pointer Manipulation 的觀念，我們學習到如何透過嚴謹的賦值順序來避免串列斷裂。Head 插入的操作時間複雜度為 O(1)，而 Tail 插入若透過維護尾部指標亦可達到 O(1)。在實作時，必須特別留意當資料結構為空時的邊界條件，確保 head 與 tail 指標能夠同步更新。透過題號 707 的實作練習，能夠有效建立對於指標重定向的扎實手感。

## TypeScript Tip

在 TypeScript 中實作 Linked List 時，必須精確宣告型別為 ListNode | null，以符合嚴格的型別檢查。處理指標時務必先建立新節點並完成後續串接，再更新錨點。

```typescript
class NodeItem {
    constructor(public val: number, public next: NodeItem | null = null) {}
}

function insertHead(head: NodeItem | null, val: number): NodeItem {
    const newNode = new NodeItem(val, head);
    return newNode;
}

const initial: NodeItem | null = null;
const updated = insertHead(initial, 10);
if (updated.val !== 10) throw new Error("assertion failed");
```

## Python Tip

在 Python 中，由於採用參考賦值機制，指標操作的先後順序尤為關鍵。切記在更改變數之前，先完成物件內屬性的賦值，以維護資料的連續性。

```python
class NodeItem:
    def __init__(self, val: int, next: 'NodeItem' = None):
        self.val = val
        self.next = next

def insert_head(head: 'NodeItem', val: int) -> 'NodeItem':
    return NodeItem(val, head)

new_head = insert_head(None, 42)
assert new_head.val == 42, "assertion failed"
```

## Takeaway

Linked List 插入的核心在於先串接新節點的 next，再更新指標，並永遠要處理空串列的邊界條件。

## Tomorrow Preview

明天我們將探討 Linked List 的刪除操作（Deletion at Head and Tail），學習如何安全地移除節點並正確回收記憶體參照，避免記憶體洩漏與懸空指標的問題。

## Today's Challenge

- **707** · 題號 707 要求完整實作自訂的 Linked List 資料結構，包含 addAtHead、addAtTail 以及 addAtIndex 等方法，是直接運用 Pointer Manipulation Pattern 的最佳實踐。
  - Hint: 在實作 addAtHead 與 addAtTail 時，請特別注意當 size 為 0 時，head 與 tail 指標必須同時指向新建立的節點。
