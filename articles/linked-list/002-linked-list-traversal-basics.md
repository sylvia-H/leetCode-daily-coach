---
id: linked-list-traversal-basics
title: Linked List Traversal Basics
module: linked-list
pattern_label: Linear Scan
complexity_label: O(n) / O(1)
estimated_minutes: 15
exit_criteria:
  - >-
    Can write a while loop that advances current = current.next without losing
    references
  - Can correctly handle empty list conditions
---
## Concept

Linked List Traversal Basics 是指在單向鏈結串列中，從頭節點出發，依序訪問每一個節點的基本操作。與連續記憶體的陣列不同，鏈結串列的節點分散在記憶體中，必須透過每個節點內部的指標欄位（如 next）才能找到下一個節點。掌握這個基礎是解決所有 Linked List 題目的先決條件。

## Thinking

在處理 Linked List 題目時，首要步驟是初始化一個暫時指標，例如讓 current 停留在 head 的位置。接著，建立一個 while 迴圈，持續檢查 current 是否為 null 或 undefined。在迴圈內部，可以進行資料處理或狀態更新，最後務必將指標往前推進（current = current.next），直到遍歷完全部節點。

## Pattern Recognition

當題目要求尋找、統計、印出或檢驗 singly linked list 中的所有元素，且無法藉由索引直接存取時，即為典型的 Linear Scan 模式。看見需要走訪完整個鏈結串列的特徵，便應直接聯想到使用基礎的 traversal 迴圈。

## Common Mistakes

常見錯誤包含在單次迴圈迭代中不小心寫了兩次 current = current.next，導致跳過部分節點；或者在遍歷過程中直接改動 head 指標，導致整條鏈結串列的開頭遺失而無法回溯。此外，忽略空串列（head 為 null）的邊界條件，也會引發型別錯誤。

## Complexity

Time Complexity: O(n)，因為需要拜訪鏈結串列中的每一個節點。Space Complexity: O(1)，只需要常數級別的額外指標變數來儲存當前位置。

## Digest

Linked List Traversal Basics 是掌握鏈結串列演算法的基石。不同於陣列，鏈結串列不具備隨機存取的特性，因此所有的操作幾乎都建立在線性掃描之上。透過維護一個安全的走訪指標，我們能夠在維持 O(1) 額外空間複雜度的前提下，完整檢查每一個節點的數值。在編寫程式碼時，必須特別注意迴圈終止條件以及防範對空指標進行屬性存取。只要熟練這套標準範本，面對各種複雜的鏈結串列架構，都能迎刃而解。

## TypeScript Tip

```typescript
class ListNode {
  val: number;
  next: ListNode | null;
  constructor(val?: number, next?: ListNode | null) {
    this.val = (val===undefined ? 0 : val);
    this.next = (next===undefined ? null : next);
  }
}
function countNodes(head: ListNode | null): number {
  let count = 0;
  let current = head;
  while (current !== null) {
    count++;
    current = current.next;
  }
  return count;
}
const testHead = new ListNode(1, new ListNode(2, null));
if (countNodes(testHead) !== 2) throw new Error("assertion failed");
```

## Python Tip

```python
class ListNode:
    def __init__(self, val=0, next=None):
        self.val = val
        self.next = next

def count_nodes(head: ListNode | None) -> int:
    count = 0
    current = head
    while current is not None:
        count += 1
        current = current.next
    return count

test_head = ListNode(1, ListNode(2, None))
assert count_nodes(test_head) == 2, "assertion failed"
```

## Takeaway

以暫時指標代替 head 進行走訪，牢記 while (current !== null) 與 current = current.next，確保 O(n) 線性掃描的安全與正確性。

## Tomorrow Preview

明天我們將探討 Two Pointers 技巧在 Linked List 中的進階應用，學習如何利用快慢指標找出鏈結串列的中點或環狀結構。

## Today's Challenge

- **876** · 必須透過完整的線性掃描來計算節點總數，或者利用快慢指標走訪整條鏈結串列以尋找中點。
  - Hint: 可以先掃描一次計算長度，或者使用一快一慢兩個指標同時推進。
- **430** · 涉及多層次的扁平化處理，核心依然需要透過節點逐一檢視與指標追蹤的線性掃描技巧。
  - Hint: 遇到子鏈結串列時需要妥善保留接下來的節點參照，並將其與子串列串接。
