---
id: linked-list-reversal-recursive
title: Linked List Reversal (Recursive)
module: linked-list
pattern_label: Recursion
complexity_label: O(n) / O(n)
estimated_minutes: 20
exit_criteria:
  - 能寫出遞迴函式，先反轉串列的其餘部分，並在回溯（unwinding）時修正指標方向
  - 能辨識遞迴的 base case
---
## Concept

Linked List Reversal (Recursive) 是一種利用遞迴呼叫堆疊來反轉鏈結串列指標方向的核心演算法技巧。透過遞迴深入至鏈結串列的最尾端，並在堆疊展開的過程中依序調整節點的指向，將原本由前往後的指標方向反轉為由後往前。這種方法充分展現了遞迴處理遞歸資料結構的威力與優雅性。

## Thinking

在思考 Linked List Reversal (Recursive) 時，首先需要明確定義遞迴的 Base Case（基本狀況）：若串列的表頭 head 為空，或 head.next 為空（代表已到達最後一個節點），則直接回傳該節點作為新的表頭。接著，對 head.next 進行遞迴呼叫，讓遞迴一路深入到串列的最尾端。當遞迴開始返回與堆疊展開（unwinding）時，對於當前節點 head，其下一個節點 head.next 已經被反轉指向當前節點。因此，必須執行 head.next.next = head 來建立反向指標，並將 head.next 設為 null 以斷開原本的正向連結，最後回傳從底層傳上來的新表頭。

## Pattern Recognition

當題目涉及 Linked List，且需要從尾端向前端處理、反轉指標順序，或是利用呼叫堆疊的特性隱式保存狀態時，即可辨識出應採用 Recursion Pattern。特別是當迭代法需要維護多個指標（如 prev、curr、next）顯得繁瑣時，遞迴法能夠透過函式呼叫堆疊自然地倒序處理節點，提供另一種思考維度。

## Common Mistakes

最常見的錯誤是在遞迴返回時，遺忘將原本的頭節點指標設為 null（即遺漏 head.next = null），這會導致反轉後的鏈結串列尾端指向原本的第二個節點，從而形成一個長度為 2 的永恆循環，造成程式進入無窮迴圈或記憶體崩潰。此外，忽略處理空鏈結串列或只有一個節點的極端情況也是常見的盲點。

## Complexity

Time Complexity 為 O(n)，因為每個節點必須被訪問一次以遞迴至尾端並進行反轉；Space Complexity 為 O(n)，主要取決於遞迴呼叫堆疊的深度，在最壞情況下，當鏈結串列長度為 n 時，堆疊深度亦為 n。

## Digest

今日重點聚焦於 Linked List Reversal (Recursive)。我們學習了如何利用遞迴呼叫堆疊深入至鏈結串列的最尾端，並在堆疊展開的過程中透過 head.next.next = head 與 head.next = null 來反轉指標方向。必須特別注意 Base Case 的設定以及防止形成循環鏈結。掌握此 Pattern 不僅能解決經典的 LeetCode 206，更能應對如 LeetCode 25 這類複雜的區段反轉挑戰，深化對遞迴與指標操作的理解。

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
  if (!head || !head.next) return head;
  const newHead = reverseList(head.next);
  head.next.next = head;
  head.next = null;
  return newHead;
}

const testNode = new ListNode(1, new ListNode(2, null));
const res = reverseList(testNode);
if (res?.val !== 2) throw new Error("TypeScript tip assertion failed");
```

## Python Tip

```python
class ListNode:
    def __init__(self, val=0, next=None):
        self.val = val
        self.next = next

def reverseList(head: ListNode | None) -> ListNode | None:
    if not head or not head.next:
        return head
    new_head = reverseList(head.next)
    head.next.next = head
    head.next = None
    return new_head

test_node = ListNode(1, ListNode(2, None))
res = reverseList(test_node)
assert res.val == 2, "Python tip assertion failed"
```

## Takeaway

運用遞迴呼叫堆疊深入至鏈結串列尾端，透過 head.next.next = head 與 head.next = null 在堆疊展開時反轉指標。

## Tomorrow Preview

明天我們將探討 Linked List 的進階操作，學習如何利用快慢指標（Fast and Slow Pointers）來偵測鏈結串列中的環狀結構（Cycle Detection），並深入理解 Floyd's Cycle-Finding Algorithm 的數學原理與應用。

## Today's Challenge

- **206** · 題號 206 Reverse Linked List 是最經典的鏈結串列反轉問題，完美體現遞迴深入到底部再由下往上修復指標的 Stack Unwinding 過程。
  - Hint: Base case 為當前節點為空或其下一個節點為空；遞迴處理 head.next 後，將下一個節點的 next 指向當前節點。
- **25** · 題號 25 Reverse Nodes in k-Group 要求以遞迴方式每 k 個節點一組進行區段反轉，考驗對遞迴邊界條件與子問題組合的高階運用能力。
  - Hint: 先檢查剩餘節點是否大於等於 k，若是則反轉前 k 個節點，並將遞迴結果接在反轉後的尾端。
