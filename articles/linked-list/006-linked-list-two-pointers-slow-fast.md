---
id: linked-list-two-pointers-slow-fast
title: 'Linked List Two Pointers: Slow and Fast'
module: linked-list
pattern_label: Slow and Fast Pointers
complexity_label: O(n) / O(1)
estimated_minutes: 25
exit_criteria:
  - 能在單趟走訪中找到 linked list 的中間節點
  - 能利用位移間距找到倒數第 k 個節點
---
## Concept

Slow and Fast Pointers 是鏈結串列的核心走訪技巧，有兩種基本型態：其一是速度差——slow 每次走一步、fast 每次走兩步；其二是固定間距——讓 fast 先走 k 步，之後兩者同速前進。兩者的共同點是：只走訪一趟、只用常數個指標變數，就能回答原本似乎得先知道串列長度才能回答的位置問題——中點在哪、倒數第 k 個節點是誰。時間 O(n)、空間 O(1)，且完全不需修改串列本身。

## Thinking

先論證速度差為什麼能找到中點。設迴圈跑了 t 輪，slow 走了 t 步、fast 走了 2t 步——「fast 的位移恆為 slow 的兩倍」是全程維持的不變式。採用標準終止條件 `while (fast && fast.next)`：長度為奇數 2m+1 時，迴圈跑 m 輪後 fast 停在最後一個節點，slow 正好落在正中央；長度為偶數 2m 時，跑 m 輪後 fast 越過尾端成為 null，slow 落在第二個中點（偏右）。這個落點不是缺陷，恰好是多數題目要的答案；若需要第一個中點，把條件改成 `while (fast.next && fast.next.next)`——僅偶數長度的落點左移一格，奇數長度兩種條件的落點相同；且此變體先取 fast.next，head 為 null 時會直接拋錯，需另行防範，標準條件則天然安全。再看固定間距：fast 先走 k 步後兩者同速前進，間距恆為 k；當 fast 抵達 null（越過尾端一格）時，slow 落後它 k 步，正是倒數第 k 個節點。若目的是刪除倒數第 k 個節點，讓兩者改從 dummy 出發、fast 先走 k+1 步，slow 就會停在目標的前驅上，接上前一課的刪除手法。

## Pattern Recognition

題目出現這些訊號就該想到快慢指標：找中點、找倒數第 n 個節點、判斷結構偏移，或明確限制單趟走訪（one pass）與 O(1) 空間、不允許先算長度。對照樸素解法——先走一趟數長度、再走一趟定位——兩者時間都是 O(n)，快慢指標的優勢不在複雜度等級，而在把兩趟壓成一趟；面試常見的 follow-up「能否只走一遍？」考的正是這個差異。

## Common Mistakes

最大宗是 off-by-one：fast 先走 k 步，slow 最後停在「倒數第 k 個」本身；改從 dummy 出發先走 k+1 步，才是停在「前驅」。兩種設定服務不同目的，混用就差一格。動手前先拿長度 3、4 的小串列人工推演落點，比硬背結論可靠。第二是空值檢查的順序：迴圈條件必須先確認 fast 非空才能取 fast.next，只寫後者會在 fast 為 null 時當場拋錯；TypeScript 裡 slow 邏輯上必非 null（它永遠落後 fast），但編譯器推不出來，需用非空斷言收斂型別；Python 則靠 `while fast and fast.next` 的短路特性。第三是把兩種變體的中點落點記反——標準條件落在偏右的第二個中點，這一點務必親手驗證。

## Complexity

時間 O(n)：fast 每輪前進兩步，至多約 n/2 輪就抵達尾端，slow 同步走完一半，整體操作次數與節點數成正比。空間 O(1)：全程只用兩個指標變數。在無環串列中，fast 沿著 next 嚴格向尾端推進，迴圈保證終止；若串列有環，fast 永遠碰不到 null、此走法不會終止——如何反過來利用這一點偵測環，是明天的主題。

## Digest

快慢指標兩種型態：速度差（fast 兩步、slow 一步）在 fast 抵達尾端時讓 slow 落在中點——標準條件 while (fast && fast.next) 下，奇數長度落在正中央、偶數長度落在第二個中點（偏右）；固定間距（fast 先走 k 步再同速前進）在 fast 走到 null 時讓 slow 停在倒數第 k 個節點，要刪除就改從 dummy 出發先走 k+1 步、停在前驅。單趟走訪、O(1) 空間，關鍵全在終止條件與先走步數的精準控制。

## TypeScript Tip

```typescript
import assert from "node:assert";

class ListNode {
    constructor(public val: number, public next: ListNode | null = null) {}
}

function getKthFromEnd(head: ListNode | null, k: number): ListNode | null {
    let slow: ListNode | null = head;
    let fast: ListNode | null = head;
    for (let i = 0; i < k; i++) {
        if (fast === null) return null; // k 超過串列長度
        fast = fast.next;
    }
    while (fast !== null) {
        slow = slow!.next; // slow 永遠落後 fast，必非 null
        fast = fast.next;
    }
    return slow;
}

const head = new ListNode(10, new ListNode(20, new ListNode(30)));
assert.strictEqual(getKthFromEnd(head, 1)?.val, 30);
assert.strictEqual(getKthFromEnd(head, 3)?.val, 10);
assert.strictEqual(getKthFromEnd(head, 4), null);
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

odd = ListNode(1, ListNode(2, ListNode(3)))
assert find_middle(odd).val == 2  # 奇數長度：正中央

even = ListNode(1, ListNode(2, ListNode(3, ListNode(4))))
assert find_middle(even).val == 3  # 偶數長度：第二個中點（偏右）
```

## Takeaway

速度差找中點、固定間距找倒數第 k：單趟走訪、O(1) 空間，關鍵在終止條件與先走步數的精準控制。

## Tomorrow Preview

明天探討 Floyd Cycle Detection：同樣的快慢指標放進有環的串列，fast 永遠碰不到 null，卻必然在環內追上 slow——我們將論證這個相遇為何必然發生，並用它來判斷串列是否有環。

## Today's Challenge

- **876** · 典型的速度差應用：fast 每次兩步、slow 每次一步，fast 抵達尾端時 slow 剛好落在中點。
  - Hint: 偶數長度時題目要求回傳第二個中點，while (fast && fast.next) 的落點恰好自然滿足。
- **19** · 固定間距的代表題：讓 fast 先行建立 n 步間距，再同步前進，單趟走訪內定位倒數第 n 個節點。
  - Hint: 從 dummy 出發並讓 fast 先走 n+1 步，slow 會停在目標的前驅，刪除頭節點也不需分支。
