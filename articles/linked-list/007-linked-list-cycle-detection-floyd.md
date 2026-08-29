---
id: linked-list-cycle-detection-floyd
title: Linked List Cycle Detection (Floyd's Algorithm)
module: linked-list
pattern_label: Cycle Detection
complexity_label: O(n) / O(1)
estimated_minutes: 25
exit_criteria:
  - 能正確實作 Floyd's cycle-finding algorithm
  - 能說明為何存在環時 slow 與 fast 指標保證會相遇
---
## Concept

Linked List Cycle Detection 利用快慢指標（Tortoise and Hare Algorithm，即 Floyd's Cycle-Finding Algorithm）來判斷鏈結串列中是否包含循環結構。此演算法的核心概念在於設定兩個指標：慢指標每次前進一步，快指標每次前進兩步。若鏈結串列中存在環，由於快指標的速度較快，它將在環內追上慢指標；若不存在環，快指標將順利到達鏈結串列的末端（null）。這種方法將空間複雜度精簡至常數級別，展現出極高的效率。

## Thinking

在處理鏈結串列的結構問題時，首要考量是如何在不佔用額外記憶體（例如 Hash Set）的前提下偵測巡訪路徑是否重複。初始化兩個指標 slow 與 fast 均指向 head。在迴圈中，條件必須確保 fast 與 fast.next 皆不為 null，以防止存取屬性時發生空指標異常。每一次疊代中，slow 移動一步，fast 移動兩步。若二者指向同一個記憶體位址，代表指標相遇，確定存在環；若迴圈正常結束且 fast 到達終點，則代表結構為線性，無環存在。

## Pattern Recognition

當題目描述中出現循環（cycle）、迴圈（loop）、無限巡訪路徑，或是要求在不使用額外儲存空間（O(1) space complexity）的條件下檢驗鏈結串列結構時，即可直接聯想至 Cycle Detection 樣式。此樣式特別適用於單向鏈結串列（Singly Linked List）節點的關聯性驗證。

## Common Mistakes

最常見的錯誤在於指標前進時未嚴格檢查快指標及其後續節點是否為 null。若直接進行 fast.next.next 的存取，當串列長度有限且走向結尾時，將引發 Null Pointer Exception 或 TypeError。此外，若誤將初始位置設定錯誤，或未讓慢指標與快指標保持正確的步數差（如 1 對 2），將導致無法正確交會或陷入無窮迴圈。

## Complexity

時間複雜度為 O(n)，其中 n 為鏈結串列中的節點總數。在無環的情況下，快指標最多走 n/2 次即到達結尾；在有環的情況下，指標相遇所需的步數亦與環的長度成正比，總體時間與資料規模呈線性關係。空間複雜度為 O(1)，因為僅使用了兩個額外的指標變數，不隨節點數量增加而消耗額外記憶體。

## Digest

本篇探討使用 Floyd's Tortoise and Hare Algorithm 進行鏈結串列的循環偵測。透過快慢指標的相對速度差，我們能在 O(n) 時間與 O(1) 空間內判斷串列是否含有迴圈。撰寫時必須特別留意對 null 的邊界條件防範。

## TypeScript Tip

```typescript
class ListNode {
  val: number;
  next: ListNode | null;
  constructor(val: number) {
    this.val = val;
    this.next = null;
  }
}
function verifyFastPointer(head: ListNode | null): boolean {
  let fast = head;
  while (fast !== null && fast.next !== null) {
    fast = fast.next.next;
  }
  return true;
}
import assert from "node:assert";
const head = new ListNode(1);
assert.strictEqual(verifyFastPointer(head), true);
```

## Python Tip

```python
class ListNode:
    def __init__(self, val: int):
        self.val = val
        self.next = None

def verify_pointers(head: ListNode | None) -> bool:
    slow, fast = head, head
    while fast and fast.next:
        slow = slow.next
        fast = fast.next.next
    return True

node = ListNode(1)
assert verify_pointers(node) is True
```

## Takeaway

快慢指標是處理鏈結串列結構問題的利器，能在 O(1) 空間內完成循環偵測。

## Tomorrow Preview

明天的課程將延續 Floyd's Cycle-Finding Algorithm 的應用，探討如何精確找出環的起點（Linked List Cycle II）。我們將推導數學關係，在確認有環後將其中一個指標重置回起點，再次以相同速率前進以定位交會點。

## Today's Challenge

- **141** · 題號 141 完美對應 Floyd's Algorithm 的標準實作，用於檢驗鏈結串列中是否存在迴圈。
  - Hint: 注意迴圈條件需同時檢查 fast 與 fast.next 是否為空。
- **142** · 題號 142 在偵測到循環的基礎上，進一步要求找出環的起始節點。
  - Hint: 當快慢指標相遇後，將其中一個指標移回頭部，兩者同速前進即可在起點相遇。
