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

單向鏈結串列的每個節點只握有一條指向後繼的 next 線索，反轉串列就是把這條線索逐一改寫成指向前驅。迭代法用三個指標完成這件事：prev 指向已反轉部分的頭、curr 指向尚待處理的第一個節點、next 暫存 curr 原本的後繼。每一輪把 curr.next 從「指向後一個」翻成「指向前一個」，再把整組指標往前推一格。全程在原節點上就地改寫，不配置任何新節點，時間 O(n)、空間 O(1)，是所有區段反轉、重排指向類題目的原子操作。

## Thinking

要說服自己這個寫法是對的，關鍵是迴圈不變式：每輪迴圈開始時，「以 prev 為頭的那段已完全反轉，以 curr 為頭的那段仍維持原有順序，兩段合起來恰好是原串列的全部節點」。初始 prev = null、curr = head，已反轉段為空、待處理段是整條串列，不變式顯然成立。每輪四個動作：先備份 next = curr.next，再翻轉 curr.next = prev，接著推進 prev = curr、curr = next。做完之後 curr 這個節點併入了已反轉段、待處理段少一個節點，不變式繼續成立。其中三處順序不可對調：備份必須在翻轉之前（否則 curr.next 已被改寫，next 抓到的是 prev，後續整段從此無人指著）；翻轉必須在 curr 推進之前（否則被改寫的是下一個節點，而它的後繼還沒人備份，一樣斷鏈）；翻轉也必須在 prev 推進之前（否則 prev 已等於 curr，curr.next = prev 等於讓節點指向自己、形成自環）。當 curr 走到 null，待處理段為空，不變式告訴我們：已反轉段就是完整答案，而它的頭正是 prev——這就是回傳 prev 而非 head 的原因。

## Pattern Recognition

題目出現這些訊號就該想到 Pointer Reversal：反轉整條串列、反轉指定區間、每 k 個節點一組反轉，或明確要求 O(1) 空間重排節點指向。對照樸素解法——把節點值複製進陣列、反轉後再逐一寫回——時間同為 O(n)，卻要 O(n) 額外空間，且只動了值、沒動節點本身，一旦題目規定「不得修改節點值」或後續要把節點接進其他結構便直接失效。指標反轉把「反轉」做在結構層，這正是它成為後續一切串列重組題基本功的原因。

## Common Mistakes

第一是忘記備份：先寫 curr.next = prev 才想到要找下一個節點，後續整段已無變數指著、再也走不到。第二是推進順序寫反：先做 prev = curr 再翻轉，等於讓節點指向自己。第三是回傳錯變數：迴圈結束時 curr 是 null，head 已淪為新串列的尾，正確答案在 prev 手上。第四是區間反轉時漏了接合：反轉段的前驅要改接反轉後的新頭、反轉段原本的頭要改接後續段，用 dummy 節點可免除「區間從 head 開始」的特判。語言層面：TypeScript 三個變數都該標成 ListNode | null，讓編譯器強迫你處理空值；Python 的 tuple assignment 右式會先整體求值，等同自動備份，但左式由左至右逐一指派，curr.next 必須寫在 curr 之前，順序仍有意義。

## Complexity

時間 O(n)：每個節點恰被處理一次，每次只做常數個指標賦值，總操作數與節點數成正比。空間 O(1)：全程只用 prev、curr、next 三個變數，與串列長度無關。另一個值得記住的性質：反轉是自己的反運算——對同一條串列連做兩次反轉會還原原狀，debug 時可以用這一點快速驗證實作的正確性。

## Digest

迭代反轉濃縮成三步循環：備份、翻轉、推進。每輪先 next = curr.next 保住後續，再 curr.next = prev 翻轉方向，最後 prev = curr、curr = next 整組前移。正確性由迴圈不變式保證——prev 段已反轉、curr 段維持原樣，兩段合計恆為全部節點；curr 走到 null 時，prev 即是新頭，回傳 prev 而非 head。順序有三處不可對調：備份先於翻轉，翻轉先於兩個推進。時間 O(n)、空間 O(1)，是區間反轉與 k 組反轉的原子操作。

## TypeScript Tip

三個指標都標成 ListNode | null，編譯器會強迫每次取值前收斂空值；備份用 const 宣告，本輪內不可能被誤改。

```typescript
import assert from "node:assert";

class ListNode {
  constructor(public val: number, public next: ListNode | null = null) {}
}

function reverseList(head: ListNode | null): ListNode | null {
  let prev: ListNode | null = null;
  let curr: ListNode | null = head;
  while (curr !== null) {
    const next: ListNode | null = curr.next; // 先備份再翻轉
    curr.next = prev;
    prev = curr;
    curr = next;
  }
  return prev;
}

const res = reverseList(new ListNode(1, new ListNode(2, new ListNode(3))));
assert.strictEqual(res?.val, 3);
assert.strictEqual(res?.next?.val, 2);
assert.strictEqual(res?.next?.next?.val, 1);
assert.strictEqual(res?.next?.next?.next, null);
assert.strictEqual(reverseList(null), null);
```

## Python Tip

tuple assignment 的右式會先全部求值完畢，等同自動備份；但左式由左至右逐一指派，curr.next 必須排在 curr 之前，寫反就會改到錯的節點。

```python
class ListNode:
    def __init__(self, val=0, next=None):
        self.val = val
        self.next = next

def reverse_list(head: ListNode | None) -> ListNode | None:
    prev, curr = None, head
    while curr:
        curr.next, prev, curr = prev, curr, curr.next
    return prev

res = reverse_list(ListNode(1, ListNode(2, ListNode(3))))
assert res.val == 3 and res.next.val == 2 and res.next.next.val == 1
assert res.next.next.next is None
assert reverse_list(None) is None
```

## Takeaway

備份、翻轉、推進三步循環，prev 段恆為已反轉前綴；curr 走到 null 時，prev 即是新頭。

## Tomorrow Preview

明天探討 Linked List Reversal (Recursive)：同一個反轉問題交給遞迴——先信任遞迴把其餘部分反轉好，回溯時只修自己這一條邊，並比較兩種寫法在呼叫堆疊上付出的代價差異。

## Today's Challenge

- **206** · 反轉單向串列的標準題，三指標迭代的最小完整舞台，先在這裡把備份與推進的順序練到反射。
  - Hint: 迴圈條件是 curr 非空；結束時回傳 prev，不是 head。
- **92** · 只反轉指定區間，考驗把標準反轉迴圈嵌進「前段—反轉段—後段」三段接合的邊界控制能力。
  - Hint: 用 dummy 起步，先走到區間前驅，反轉固定次數後把兩個斷口接回去。
