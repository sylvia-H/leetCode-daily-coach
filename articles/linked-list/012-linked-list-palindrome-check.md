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

Palindrome Linked List Check 要判斷單向鏈結串列的值序列是否為迴文（正讀反讀相同）。直覺解是把值倒進陣列，再用頭尾對撞的雙指標比對，時間 O(n)、空間也是 O(n)。要把空間壓到 O(1)，得先面對單向串列的根本限制：節點只有 `next`，在不花額外記憶體的前提下沒有任何辦法反向走訪。出路是暫時改寫結構本身——把後半段的指標統統反轉，「從尾端往回讀」就變成「沿著反轉後的 next 往前讀」。完整流程是三段組合：快慢指標找中點、反轉後半段、前後兩半同步比對；檢查結束後可以再把後半段反轉回去，還原串列。

## Thinking

三個階段各有要說清楚的正確性理由。第一段找中點：slow 與 fast 同起點，fast 一次走兩步，迴圈條件 `while (fast && fast.next)`。長度為偶數 2k 時，slow 停在右半的第一個節點；奇數 2k + 1 時停在正中央。第二段從 slow 起反轉，沿用反轉課的三步驟：暫存 next、把 `curr.next` 改指 prev、推進兩個指標。第三段比對：讓 p 從 head、q 從反轉後的新頭同步前進，以 q 走到 null 作為終止條件——反轉後那條鏈的長度不會超過 p 走的那條，所以 q 必定先走完或同時走完，途中只要 `p.val !== q.val` 就能立即回傳 false。奇數長度的中央節點不需要特別處理：依約定它可能被跳過，也可能與自己比較一次，而自己對自己必然相等，兩種寫法結果一致。最後的復原是工程素養：「檢查」在語意上是唯讀操作，呼叫端不會預期串列被改動，把後半段再反轉一次接回即可，代價仍是線性。

## Pattern Recognition

這是本模組的收官綜合題：它不引入新技巧，而是把已學的三個基本功——快慢指標找中點、iterative 反轉、雙指標同步走訪——組成一條流水線。辨識線索：題目涉及鏈結串列的「對稱」「迴文」或「前後兩半重組」，且空間被限制在 O(1)。同一套「找中點＋反轉後半＋雙鏈同走」的骨架，把最後一步的「比對」換成「交錯合併」，就能處理串列重排類題目——這個組合本身比任何單一題目都更值得記住。

## Common Mistakes

最高頻的錯誤是奇偶長度的邊界：快慢指標迴圈寫成 `while (fast && fast.next)` 或 `while (fast.next && fast.next.next)`，偶數長度時 slow 會分別停在右半第一個與左半最後一個（奇數長度兩者都落在正中央），反轉起點和比對終止條件必須跟著同一套約定走，混用兩種寫法就會在偶數長度差一個節點，輕則誤判、重則對 null 取值。第二是比對迴圈不以「反轉後那條鏈走到 null」為準，換了中點約定後很容易多走一步。第三是反轉時未先暫存 next，改了 `curr.next` 之後整段後鏈就此斷失。第四是比對完直接回傳而不復原結構——對唯讀語意的函式而言，這是把副作用洩漏給呼叫端。最後，空串列與單節點天生就是迴文，直接回傳 true，別讓走訪邏輯去踩空指標。

## Complexity

找中點約 n / 2 步、反轉後半約 n / 2 步、比對約 n / 2 步、復原再約 n / 2 步，合計 O(n)。空間 O(1)：全程只用 slow、fast、prev、curr 等常數個指標。相較之下，倒進陣列比對或用遞迴呼叫堆疊都需要 O(n) 額外空間——本題真正檢驗的，是你是否理解「單向串列要反向讀，就得暫時改動結構」這件事。

## Digest

以 O(1) 空間檢查鏈結串列迴文，靠的是三個已學基本功的組合：快慢指標找中點（fast 走兩步、slow 走一步，迴圈條件 `fast && fast.next`）、反轉後半段（暫存 next、改指 prev、推進）、前後兩半同步比對（以反轉後那條鏈走到 null 為止，途中值不等即可回傳 false）。奇數長度的中央節點與自己比較必然相等，不影響結果。單向串列無法反向走訪，因此 O(1) 空間必須暫時改寫結構——這也是檢查完應把後半段反轉回去的原因：不對呼叫端留下副作用。整體時間 O(n)、空間 O(1)；同一套骨架把最後的比對換成交錯合併，就能處理串列重排。

## TypeScript Tip

反轉起點直接取 slow，奇數長度時中央節點會與自己比較一次——無害，而且省去奇偶分支。

```typescript
class ListNode { constructor(public val: number, public next: ListNode | null = null) {} }

function isPalindrome(head: ListNode | null): boolean {
  let slow = head, fast = head, prev: ListNode | null = null;
  while (fast && fast.next) { fast = fast.next.next; slow = slow!.next; }
  for (let curr = slow; curr; ) { const nx: ListNode | null = curr.next; curr.next = prev; prev = curr; curr = nx; }
  for (let p = head, q = prev; q; p = p!.next, q = q.next) if (p!.val !== q.val) return false;
  return true;
}

const build = (vs: number[]) => vs.reduceRight<ListNode | null>((n, v) => new ListNode(v, n), null);
if (!isPalindrome(build([1, 2, 2, 1])) || isPalindrome(build([1, 2, 3, 1]))) throw new Error("check failed");
```

## Python Tip

tuple 同步賦值一行完成反轉三步驟：右式先全數求值，再依序寫回，不會互相干擾。

```python
class ListNode:
    def __init__(self, val=0, next=None):
        self.val = val
        self.next = next

def is_palindrome(head):
    slow = fast = head
    prev = None
    while fast and fast.next:
        fast, slow = fast.next.next, slow.next
    while slow:
        slow.next, prev, slow = prev, slow, slow.next
    p, q = head, prev
    while q:
        if p.val != q.val:
            return False
        p, q = p.next, q.next
    return True

def build(vs):
    head = None
    for v in reversed(vs):
        head = ListNode(v, head)
    return head

assert is_palindrome(build([1, 2, 2, 1])) and not is_palindrome(build([1, 2, 3]))
assert is_palindrome(build([1, 2, 1])) and not is_palindrome(build([1, 2, 3, 1]))
```

## Takeaway

找中點、反轉後半、同步比對——三個基本功組成的流水線，讓單向串列在 O(1) 空間完成迴文檢查；查完記得反轉回去復原。

## Tomorrow Preview

Linked List 模組到此收官——從節點記憶體模型、走訪與增刪、dummy head，一路走到快慢指標、Floyd 環偵測、反轉與合併，本課把這些基本功組成了第一條流水線。明天起進入新的模組，用同樣的節奏繼續推進。

## Today's Challenge

- **234** · 本課的原型題：在 O(1) 空間限制下驗證迴文，完整走一遍找中點、反轉後半、同步比對的流水線。
  - Hint: 以 `fast && fast.next` 找中點，從 slow 反轉，比對以反轉那條鏈走完為止。
- **143** · 同一套骨架的變奏：找中點、反轉後半之後，把最後一步的「比對」換成兩條鏈的交錯合併。
  - Hint: 切成兩半並反轉後半之後，輪流從兩條鏈各取一個節點接到結果尾端。
