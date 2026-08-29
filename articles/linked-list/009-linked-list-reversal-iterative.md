---
id: linked-list-reversal-iterative
title: Linked List Reversal (Iterative)
module: linked-list
pattern_label: Pointer Reversal
complexity_label: O(n) / O(1)
estimated_minutes: 25
exit_criteria:
  - 能使用 prev、curr、next 三個指標迭代地反轉 linked list
  - 能正確回傳新的 head
---
## Concept

Linked List Reversal (Iterative) 是一種透過三指標（prev, curr, next）在單向鏈結串列中原地反轉指標方向的核心演算法。在不使用額外記憶體空間（O(1) space）的情況下，將每個節點的 next 指標由原本指向下一個節點，改為指向前一個節點。

## Thinking

在處理單向鏈結串列的反轉時，最關鍵的思考點在於：當我們將當前節點（curr）的 next 指標改指向前一個節點（prev）時，會瞬間失去與原本「下一個節點」的連結。因此，在進行指標反轉的這個動作之前，必須先把下一個節點透過暫存變數（next）保存起來。完整的迭代步驟為：1. 暫存 next = curr.next；2. 反轉方向 curr.next = prev；3. 移動 prev 指標到 curr；4. 移動 curr 指標到 next。重複此流程直到 curr 為空，最後回傳 prev 作為新的頭節點。

## Pattern Recognition

當題目要求「反轉整個鏈結串列」、「反轉局部子鏈結串列（Sublist Reversal）」或需要在 O(1) 額外空間內重新排列節點方向時，高度適用 Pointer Reversal Pattern。此 Pattern 的特徵是需要維護多個指標來追蹤目前拜訪的節點及其相鄰節點，並透過區域變數的暫存來避免斷開參照。

## Common Mistakes

最常見的錯誤是在重新賦值 curr.next 之前，忘記先將 curr.next 保存到暫存變數中。這會導致斷開與後續節點的連結，引發鏈結串列遺失（Lost Reference），後續的節點將無法被訪問，程式邏輯直接崩潰。

## Complexity

時間複雜度為 O(n)，其中 n 為鏈結串列的節點數量，因為需要完整走訪所有節點一次。空間複雜度為 O(1)，僅需常數級別的指標變數（prev, curr, next）來輔助迭代，不需額外配置資料結構。

## Digest

Linked List Reversal (Iterative) 是掌握鏈結串列指標操作的基本功。透過維護 prev、curr 與 next 三個指標，我們能在 O(n) 時間與 O(1) 空間內安全地將節點方向反轉。TypeScript 與 Python 各自擁有合適的語法糖與暫存策略來確保型別安全與程式碼簡潔度。熟練此 Pattern 是解決更複雜的鏈結串列區段反轉或重排問題的基石。

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

// TypeScript 中善用明確的型別宣告（ListNode | null），
// 確保在編譯期就能攔截可能的 null 指標錯誤。
function reverseList(head: ListNode | null): ListNode | null {
  let prev: ListNode | null = null;
  let curr: ListNode | null = head;
  
  while (curr) {
    const next = curr.next;
    curr.next = prev;
    prev = curr;
    curr = next;
  }
  
  return prev;
}

const node = new ListNode(1, new ListNode(2));
const res = reverseList(node);
assert.strictEqual(res?.val, 2);
assert.strictEqual(res?.next?.val, 1);
```

## Python Tip

```python
class ListNode:
    def __init__(self, val=0, next=None):
        self.val = val
        self.next = next

# Python 支援 tuple assignment，可以一行同時完成多個指標的更新，
# 避免手動宣告暫存變數帶來的繁瑣步驟與賦值順序錯誤。
def reverseList(head: ListNode | None) -> ListNode | None:
    prev, curr = None, head
    while curr:
        curr.next, prev, curr = prev, curr, curr.next
    return prev

node = ListNode(1, ListNode(2))
res = reverseList(node)
assert res.val == 2
assert res.next.val == 1
```

## Takeaway

運用 prev、curr、next 三指標及暫存變數，在 O(n) 時間內原地反轉單向鏈結串列。

## Tomorrow Preview

明天我們將探討 Linked List Reversal (Recursive)，學習如何利用遞迴函式的呼叫堆疊（Call Stack）隱式地完成鏈結串列的反轉，並比較迭代法與遞迴法在實務開發上的優劣勢與記憶體開銷。

## Today's Challenge

- **206** · 本題為單向鏈結串列反轉的標準題型，直接對應三指標迭代反轉的 Pointer Reversal 核心 Pattern。
  - Hint: 注意迴圈條件與回傳的新頭節點變數。
- **92** · 此題要求局部反轉指定區間的鏈結串列，考驗反覆迭代時精準控制指標接合與範圍邊界的能力。
  - Hint: 先找到反轉區間的前一個節點，再套用標準的反轉迴圈。
