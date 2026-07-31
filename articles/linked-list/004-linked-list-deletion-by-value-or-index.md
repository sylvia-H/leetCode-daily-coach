---
id: linked-list-deletion-by-value-or-index
title: Linked List Deletion by Value or Index
module: linked-list
pattern_label: Pointer Manipulation
complexity_label: O(n) / O(1)
estimated_minutes: 20
exit_criteria:
  - 'Can remove a node from the middle, head, or tail of a list'
  - Can correctly deallocate or bypass the target node reference
---
## Concept

Linked List 刪除節點的核心操作，本質上是透過指標的操作（Pointer Manipulation）繞過目標節點。在單向鏈結串列（Singly Linked List）中，我們無法直接存取前一個節點（Predecessor），因此若要刪除特定值或指定索引的節點，必須在巡訪時精準保留前一個節點的參考。當找到目標節點時，將前一個節點的 `next` 指標直接指向目標節點的 `next` 節點，藉此切斷目標節點與鏈結串列的連結。這種繞過（Bypass）與重新指向的過程，是處理 Linked List 結構修改的基礎。

## Thinking

思考刪除操作時，首要考量是「指標的連續性」。若直接將指標移向目標節點，將無法回頭修改前一個節點的指標。因此，思考模式必須轉變為「超前部署」：在走訪時，總是透過 `prev` 節點來觀察 `prev.next` 是否為目標。這衍生出兩個關鍵思考方向：第一，如何處理邊界條件，例如刪除的剛好是 Head 節點，此時沒有真正的 `prev`，通常需要使用 Dummy Head（哨兵節點）來簡化邏輯；第二，如何確保指標調整時不會造成記憶體孤島或遺失後續節點。

## Pattern Recognition

當題目要求「移除特定數值的節點」、「刪除給定索引的節點」或「根據條件過濾串列元素」時，即可強烈識別出 Pointer Manipulation 的模式。此 Pattern 的特徵在於維護一個或多個指標（如 `prev` 與 `curr`），並在走訪過程中動態調整指標的指向。若題目僅給定欲刪除節點本身的參考而非整條串列（例如 LeetCode 237），則會轉化為另一種經典的覆蓋與繞過技巧：將下一個節點的值複製到當前節點，再刪除下一個節點。

## Common Mistakes

最常見的錯誤是漏掉刪除 Head 節點時的邊界條件，導致對 `null` 或 `None` 進行屬性存取而引發例外。第二個常見錯誤是在刪除節點後忘記處理指標，或在迴圈中更新指標的順序錯誤，導致無限迴圈或斷鏈（Lost Reference）。此外，在 Python 中常發生 Off-by-one 錯誤，特別是在透過索引刪除時，計數器的初始化與迴圈終止條件未精準對齊節點位置。

## Complexity

Time Complexity: O(n) 因為在最壞情況下需要走訪整個 Linked List 來尋找目標值或索引。Space Complexity: O(1) 因為只需使用常數額外空間來儲存指標變數。

## Digest

本單元聚焦於 Linked List 的指標操作，核心在於透過追蹤前一個節點（Predecessor）來安全地繞過與刪除目標節點。我們探討了一般值刪除與索引刪除的思考邏輯，並強調 Dummy Head 在處理邊界條件（如刪除頭節點）時的強大功用。透過實作練習，掌握了指標重新指向的正確順序，避免斷鏈或記憶體遺失，為複雜的結構修改打下穩固基礎。

## TypeScript Tip

```typescript
class ListNode {
  val: number;
  next: ListNode | null;
  constructor(val?: number, next?: ListNode | null) {
    this.val = val ?? 0;
    this.next = next ?? null;
  }
}
function deleteNode(node: ListNode | null): void {
  if (node === null || node.next === null) return;
  node.val = node.next.val;
  node.next = node.next.next;
}
const n2 = new ListNode(2, null);
const n1 = new ListNode(1, n2);
deleteNode(n1);
if (n1.val !== 2 || n1.next !== null) throw new Error("Tip failed");
```

## Python Tip

```python
class ListNode:
    def __init__(self, val=0, next=None):
        self.val = val
        self.next = next

def deleteNode(node: ListNode):
    if node and node.next:
        node.val = node.next.val
        node.next = node.next.next

n2 = ListNode(2, None)
n1 = ListNode(1, n2)
deleteNode(n1)
assert n1.val == 2 and n1.next is None, "Tip failed"
```

## TypeScript Corner

```typescript
class ListNode {
  val: number;
  next: ListNode | null;
  constructor(val?: number, next?: ListNode | null) {
    this.val = (val===undefined ? 0 : val);
    this.next = (next===undefined ? null : next);
  }
}

function removeElements(head: ListNode | null, val: number): ListNode | null {
  const dummy = new ListNode(0, head);
  let prev: ListNode = dummy;
  let curr: ListNode | null = head;
  while (curr !== null) {
    if (curr.val === val) {
      prev.next = curr.next;
    } else {
      prev = curr;
    }
    curr = curr.next;
  }
  return dummy.next;
}

const node3 = new ListNode(3, null);
const node2 = new ListNode(2, node3);
const head = new ListNode(1, node2);
const newHead = removeElements(head, 2);
if (newHead?.next?.val !== 3) throw new Error("Assertion failed");
```

## Python Corner

```python
class ListNode:
    def __init__(self, val=0, next=None):
        self.val = val
        self.next = next

def removeElements(head: ListNode | None, val: int) -> ListNode | None:
    dummy = ListNode(0, head)
    prev = dummy
    curr = head
    while curr is not None:
        if curr.val == val:
            prev.next = curr.next
        else:
            prev = curr
        curr = curr.next
    return dummy.next

node3 = ListNode(3, None)
node2 = ListNode(2, node3)
head = ListNode(1, node2)
new_head = removeElements(head, 2)
assert new_head.next.val == 3, "Assertion failed"
```

## Takeaway

刪除 Linked List 節點的關鍵在於掌握 Predecessor 的指標重導，善用 Dummy Head 簡化邊界條件，並透過指標繞過目標。

## Tomorrow Preview

明天我們將探討 Linked List 的另一大核心技巧：Two-Pointer Techniques in Linked List，學習如何利用快慢指標尋找中點與判斷環狀結構。

## Today's Challenge

- **237** · 此題僅提供欲刪除節點的參考，必須透過覆蓋值與調整指標來達成隱式刪除，展現了高階的 Pointer Manipulation 技巧。
  - Hint: 無法存取前一個節點時，可將下一個節點的值複製到當前節點，再將 next 指標指向下下個節點。
- **203** · 需要遍歷整條串列並嚴格追蹤前一個節點，以過濾並移除所有符合特定數值的節點。
  - Hint: 善用 Dummy Head 節點可以完美解決需要刪除原始 Head 節點時的邊界例外狀況。
