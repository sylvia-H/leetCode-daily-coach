---
id: linked-list-palindrome-check
title: Palindrome Linked List Check
module: linked-list
pattern_label: Composite Pattern (Midpoint + Reverse + Compare)
complexity_label: O(n) / O(1)
estimated_minutes: 25
exit_criteria:
  - 能找出中點、反轉後半段、對稱地比較值，並可選擇性地還原串列
  - 能說明為何 O(1) 空間需要修改結構
---
## Concept

Palindrome Linked List Check 旨在判斷一個單向鏈結串列是否為對稱的迴文結構。標準的暴力解法是使用陣列或堆疊儲存所有節點值，再進行前後雙向指標比對，空間複雜度為 O(n)。然而，若要求空間複雜度達到 O(1)，則必須採用複合模式：利用快慢指標尋找鏈結串列的中點、反轉後半部的鏈結串列，最後同步比對前半部與反轉後的後半部節點值，並在完成檢查後將鏈結串列結構復原。

## Thinking

思考此題時，首先需要克服單向鏈結串列無法直接反向走訪的限制。若要達成 O(1) 空間複雜度，我們不能配置額外容器儲存節點。因此，核心思考路徑分為三個階段：第一階段使用經典的快慢指標（Slow and Fast Pointers），當快指標到達結尾時，慢指標剛好停在中點。第二階段將中點之後的鏈結串列進行反轉（Reverse Linked List）。第三階段設立兩個指標，分別從頭部與反轉後的後半部開頭同步走訪並比對數值。最後，為保持資料結構完整性，通常會在返回結果前將後半部鏈結串列再次反轉以復原原貌。

## Pattern Recognition

當題目要求檢查鏈結串列的對稱性或迴文特徵，且空間複雜度被嚴格限制在 O(1) 時，應立即聯想複合模式（Composite Pattern）。此模式結合了三個基礎鏈結串列操作：尋找中點、反轉鏈結串列、以及平行走訪比對。這類題型的辨識線索包含：單向鏈結串列、O(1) 空間限制、需要比較前後對稱性，或需要將串列分成兩半進行獨立處理。

## Common Mistakes

常見錯誤主要發生在鏈結串列長度為奇數或偶數時的中點切分處理不當，導致後半部起點偏移一個節點而引發 NullPointerException。另一個常見錯誤是在比對完畢後未將鏈結串列復原，這在實際工程應用中會破壞呼叫端的資料結構。此外，指標反轉過程中若沒有妥善暫存下一個節點（next node），容易造成鏈結斷裂或記憶體流失。

## Complexity

時間複雜度為 O(n)，因為我們需要掃描鏈結串列尋找中點、反轉後半部以及比對節點，每個階段皆為線性時間。空間複雜度為 O(1)，僅使用常數個指標變數，未配置任何額外的動態陣列或遞迴呼叫堆疊。

## Digest

本課程探討如何以 O(1) 空間複雜度檢查鏈結串列是否為迴文結構。核心策略為複合模式，透過快慢指標尋找中點、反轉後半部串列，再進行對稱數值比對。TypeScript 與 Python 實作均展示了指標反轉與邊界條件的處理細節，確保演算法在高效的同時兼顧資料結構完整性。

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

function reverseList(head: ListNode | null): ListNode | null {
  let prev: ListNode | null = null;
  let curr = head;
  while (curr) {
    let nextTemp = curr.next;
    curr.next = prev;
    prev = curr;
    curr = nextTemp;
  }
  return prev;
}

const head = new ListNode(1, new ListNode(2));
const reversed = reverseList(head);
if (reversed?.val !== 2) throw new Error("assertion failed");
```

## Python Tip

```python
class ListNode:
    def __init__(self, val=0, next=None):
        self.val = val
        self.next = next

def reverse_list(head: ListNode | None) -> ListNode | None:
    prev = None
    curr = head
    while curr:
        next_temp = curr.next
        curr.next = prev
        prev = curr
        curr = next_temp
    return prev

head = ListNode(1, ListNode(2))
reversed_head = reverse_list(head)
assert reversed_head.val == 2, "assertion failed"
```

## Takeaway

掌握複合模式：結合快慢指標尋找中點、反轉後半部以及平行比對，達成 O(1) 空間複雜度的迴文檢查。

## Tomorrow Preview

明天我們將探討雙指標與區間合併技巧，學習如何在維持高效能的同時處理更複雜的序列資料結構，進一步強化對指針操作的掌控能力。

## Today's Challenge

- **234** · 需要驗證鏈結串列是否為迴文，且空間複雜度必須為 O(1)，完美對應中點尋找與反轉的複合模式。
  - Hint: 先用快慢指標定位中點，再反轉後半部鏈結串列進行值比對。
- **143** · 需要重新排列鏈結串列的順序，結合了尋找中點、反轉後半部以及交錯合併的複合操作。
  - Hint: 切分為兩半後，將後半部反轉，最後將兩條鏈結串列交錯合併。
