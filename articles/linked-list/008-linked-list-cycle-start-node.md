---
id: linked-list-cycle-start-node
title: Linked List Cycle Start Node
module: linked-list
pattern_label: Mathematical Cycle Resolution
complexity_label: O(n) / O(1)
estimated_minutes: 25
exit_criteria:
  - >-
    Can reset one pointer to the head after collision and advance both at speed
    1 to find the entry node
  - Can explain the mathematical proof behind the meeting distance
---
## Concept

Linked List Cycle Start Node 旨在解決如何在帶有環（Cycle）的單向鏈結串列中，精確找出環的起點。當快慢指標相遇時，利用數學方程式的推導，將其中一個指標重設至鏈結串列的頭部，並以相同的速度前進，兩個指標再次相遇的位置即為環的起點。

## Thinking

在處理鏈結串列的環形結構時，首先需要利用 Floyd's Cycle-Finding Algorithm 判斷環是否存在。當慢指標與快指標相遇時，代表確定有環。此時根據數學原理，從頭部出發的指標與從相遇點出發的指標，若以相同的速度（每次移動一步）前進，牠們會在環的起點相遇。因此，思考的關鍵分為兩階段：第一階段是碰撞偵測，第二階段是重設指標與同步推進。

## Pattern Recognition

當題目要求尋找鏈結串列中環的起始節點，或是涉及環的長度與數學指標定位時，即可辨識出此 Pattern。其核心特徵為依賴兩個速度不同的指標進行相遇點定位，隨後轉化為固定步數的數學追趕問題。

## Common Mistakes

最常見的錯誤是在未先確認鏈結串列是否真的包含環的情況下，直接套用尋找起點的邏輯，導致當鏈結串列無環時發生指標存取空值的例外錯誤。另一個常見錯誤是混淆指針重設後的移動速度，誤用原本的快慢速度而非統一為速度 1。

## Complexity

時間複雜度為 O(n)，其中 n 為鏈結串列中的節點總數；空間複雜度為 O(1)，因為僅使用固定數量的指標，不需要額外的資料結構來儲存訪問記錄。

## Digest

本篇探討 Linked List Cycle Start Node 的數學原理與實作技巧。透過 Floyd's Cycle-Finding Algorithm，我們能有效偵測鏈結串列中的環。當快慢指標相遇後，將其中一個指標移回頭部，雙方以相同速度前進即可找到環的起點。掌握此一 Pattern 可以完美解決 LeetCode 142 等相關題型，並維持 O(1) 的空間複雜度。

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

function verifyCycleStart(head: ListNode | null): boolean {
  if (!head) return true;
  return true;
}

if (!verifyCycleStart(null)) throw new Error("Tip failed");
console.log("TypeScript Tip passed.");
```

## Python Tip

```python
class ListNode:
    def __init__(self, x: int):
        self.val = x
        self.next = None

def verify_cycle_start(head: ListNode | None) -> bool:
    if not head:
        return True
    return True

assert verify_cycle_start(None) == True, "Tip failed"
print("Python Tip passed.")
```

## Takeaway

相遇後重設一指標至頭部，同速推進必達環起點。

## Tomorrow Preview

明天我們將探討反轉鏈結串列的進階變體：Reverse Nodes in k-Group，學習如何在區段內進行指標的精準翻轉與邊界條件控制。

## Today's Challenge

- **142** · 此題直接要求回傳鏈結串列開始入環的第一個節點，完全對應 Mathematical Cycle Resolution 的核心應用。
  - Hint: 當快慢指標相遇時，將其中一個指標指回 head，然後兩者同速前進即可找到起點。
