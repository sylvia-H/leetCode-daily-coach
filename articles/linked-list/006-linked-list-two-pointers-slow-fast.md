---
id: linked-list-two-pointers-slow-fast
title: 'Linked List Two Pointers: Slow and Fast'
module: linked-list
pattern_label: Slow and Fast Pointers
complexity_label: O(n) / O(1)
estimated_minutes: 25
exit_criteria:
  - Can find the middle node of a linked list in a single pass
  - Can find the kth node from the end using an offset gap
---
## Concept

Linked List Two Pointers: Slow and Fast 是一種經典的指標操作技巧。透過設定兩個移動速率不同的指標（通常稱為 slow 與 fast），我們能在單次掃描（single pass）內解決許多原本需要多次遍歷才能完成的問題。常見的設定是讓 fast 指標每次移動兩步，而 slow 指標每次移動一步。這種速度差能幫助我們在鏈結串列中尋找中點、偵測循環結構，或是維護一個固定大小的距離窗口。由於不需要額外的資料結構儲存節點，這種技巧的時間複雜度為 O(n)，而空間複雜度為 O(1)。

## Thinking

在處理 Linked List 題目時，若遇到需要尋找倒數第 k 個節點或中點的問題，直覺作法往往是先遍歷一次計算長度，再遍歷第二次尋找目標。然而，使用 Slow and Fast Pointers 可以優化這個過程。以尋找倒數第 n 個節點為例，我們可以讓 fast 指標先向前推進 n 步，建立一個長度為 n 的間距窗口。接著，讓 slow 與 fast 指標同步同速向前移動，直到 fast 指標抵達鏈結串列的尾端（即 fast.next 為 null）。此時，slow 指標剛好停在倒數第 n 個節點的前一個位置，方便我們進行節點的刪除或操作。

## Pattern Recognition

當題目要求尋找鏈結串列的中點、判斷是否有環（Cycle）、尋找環的起點，或是尋找倒數第 n 個節點時，這就是明顯的 Slow and Fast Pointers 應用場景。另一個辨識線索是當題目限制空間複雜度必須為 O(1)，且不允許修改或預先計算串列長度時，雙指標的偏移量（offset）與速度差（speed difference）策略便是首選方案。

## Common Mistakes

最常見的錯誤在於邊界條件處理不當（off-by-one errors）。例如在計算偏移量時，沒有精確控制迴圈執行的次數，導致 fast 指標多走或少走了一步，進而使 slow 指標指錯位置。另一個常見問題是在走訪迴圈時未檢查空指標（null reference），例如在 TypeScript 中直接存取 fast.next 而沒有先確認 fast 本身是否為 null，導致執行期拋出 TypeError。

## Complexity

時間複雜度為 O(n)，其中 n 為 Linked List 的節點總數，因為最壞情況下指標最多遍歷整個串列一次。空間複雜度為 O(1)，僅使用常數額外空間來儲存指標變數。

## Digest

本篇探討 Linked List Two Pointers: Slow and Fast 技巧。核心在於利用不同速度或固定間距的指標在單次掃描中定位目標。我們分析了如何設定 fast 與 slow 指標來找尋中點或倒數第 n 個節點，並強調了避免空指標異常與邊界偏移錯誤的重要性。

## TypeScript Tip

```typescript
import assert from "node:assert";

class ListNode {
    val: number;
    next: ListNode | null;
    constructor(val: number, next: ListNode | null = null) {
        this.val = val;
        this.next = next;
    }
}

function getKthFromEnd(head: ListNode | null, k: number): ListNode | null {
    let slow: ListNode | null = head;
    let fast: ListNode | null = head;
    for (let i = 0; i < k; i++) {
        if (fast === null) return null;
        fast = fast.next;
    }
    while (fast !== null) {
        slow = slow!.next;
        fast = fast.next;
    }
    return slow;
}

const head = new ListNode(10, new ListNode(20, new ListNode(30)));
const target = getKthFromEnd(head, 1);
assert.strictEqual(target?.val, 30);
```

## Python Tip

```python
class ListNode:
    def __init__(self, val=0, next=None):
        self.val = val
        self.next = next

def find_middle(head: ListNode | None) -> ListNode | None:
    slow = fast = head
    while fast and fast.next:
        slow = slow.next
        fast = fast.next.next
    return slow

head = ListNode(100, ListNode(200, ListNode(300)))
mid = find_middle(head)
assert mid.val == 200
```

## TypeScript Corner

```typescript
import assert from "node:assert";

class ListNode {
    val: number;
    next: ListNode | null;
    constructor(val?: number, next?: ListNode | null) {
        this.val = (val===undefined ? 0 : val);
        this.next = (next===undefined ? null : next);
    }
}

function middleNode(head: ListNode | null): ListNode | null {
    let slow: ListNode | null = head;
    let fast: ListNode | null = head;
    while (fast !== null && fast.next !== null) {
        slow = slow!.next;
        fast = fast.next.next;
    }
    return slow;
}

const head = new ListNode(1, new ListNode(2, new ListNode(3, new ListNode(4, new ListNode(5)))));
const mid = middleNode(head);
assert.strictEqual(mid?.val, 3);
```

## Python Corner

```python
import unittest

class ListNode:
    def __init__(self, val=0, next=None):
        self.val = val
        self.next = next

def removeNthFromEnd(head: ListNode | None, n: int) -> ListNode | None:
    dummy = ListNode(0, head)
    slow = dummy
    fast = dummy
    for _ in range(n + 1):
        fast = fast.next
    while fast is not None:
        slow = slow.next
        fast = fast.next
    slow.next = slow.next.next
    return dummy.next

head = ListNode(1, ListNode(2, ListNode(3)))
res = removeNthFromEnd(head, 2)
assert res.val == 1
assert res.next.val == 3
```

## Takeaway

掌握快慢指標的位移差與終止條件，即可在單次掃描與 O(1) 空間內精準解決鏈結串列的中點與倒數定位問題。

## Tomorrow Preview

明天我們將探討 Linked List 的另一種高階指標技巧：Reversal and In-place Manipulation。我們將學習如何在 O(1) 空間內反轉整個或部分鏈結串列，並結合今天的雙指標技巧解決更複雜的結構重組問題。

## Today's Challenge

- **876** · 典型的快慢指標應用，透過讓 fast 每次走兩步、slow 每次走一步，當 fast 到達結尾時 slow 剛好抵達中點。
  - Hint: 注意當鏈結串列長度為偶數時，題目通常要求回傳第二個中點，快慢指標的終止條件剛好能自然滿足此需求。
- **19** · 利用快慢指標建立固定的 n 步間距窗口，使 fast 先行後再同步移動，順利在單次遍歷內找出倒數第 n 個節點。
  - Hint: 建議使用 dummy node 作為起始點，能有效簡化刪除頭部節點時的邊界判斷邏輯。
