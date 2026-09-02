---
id: linked-list-cycle-start-node
title: Linked List Cycle Start Node
module: linked-list
pattern_label: Mathematical Cycle Resolution
complexity_label: O(n) / O(1)
estimated_minutes: 25
exit_criteria:
  - 能在相遇後將其中一個指標重設回 head，並讓兩者以速度 1 前進，找到入環節點
  - 能說明相遇距離背後的數學證明
---
## Concept

昨天的環偵測只回答了「有沒有環」，今天要回答「環從哪裡開始」。延續 Floyd's Cycle-Finding Algorithm：快慢指標相遇後，把其中一個指標重設回 head，兩者改以每次一步的相同速度前進，首次相等的節點就是環的起始節點。這個看似神奇的操作背後是一條簡潔的距離等式——相遇點落在哪裡不是巧合，它與入環前路段的長度存在精確的對應關係。整個過程仍維持 O(n) 時間與 O(1) 空間。

## Thinking

設 head 到環起點的距離為 F、環長為 C、環起點沿前進方向到相遇點的距離為 a（0 ≤ a < C），並先假設 F ≥ 1。相遇當下 slow 走了 F + a 步（昨天論證過：slow 入環後至多繞近一圈就被追上，不會多繞整圈）；fast 的步數是 slow 的兩倍，而兩者停在同一節點代表 fast 比 slow 多繞了整數圈，即 2(F + a) = F + a + nC。兩邊相消得 F + a = nC，移項得 F = nC − a = (C − a) + (n − 1)C。這裡 n ≥ 1：因為 nC = F + a ≥ F ≥ 1 為正，n 不可能是 0，所以 (n − 1) 圈是實際走得出來的圈數。翻成白話：從 head 走 F 步抵達環起點，恰等於從相遇點先走 C − a 步回到環起點、再繞 n − 1 圈——繞整數圈位置不變，所以兩條路線走相同步數後同時落在環起點。因此第二階段讓 p1 從 head、p2 從相遇點同時以速度 1 前進：p1 抵達環起點前一直待在入環前路段，而 p2 始終在環內，兩段節點不重疊，途中不可能提前相等；走到第 F 步兩者第一次相等，該處必為環起點。剩下 F = 0（環起點就是 head）要單獨看：此時兩指標一開始就都在環內，位置相同的條件是 slow 走過的步數為 C 的整數倍，所以首次相遇發生在 slow 恰好繞完一圈時，相遇點正是 head，也就是環起點。只要迴圈寫成「先比較、再前進」（`while (p1 !== p2)`），第零步就成立、直接回傳 head。

## Pattern Recognition

題目要求回傳「開始入環的第一個節點」、詢問環的入口，或要求在 O(1) 空間內定位環的位置時，就是這個 Pattern。它的結構是兩階段：第一階段沿用昨天的相遇偵測（同時兼任無環的守門員），第二階段把問題轉化為「兩個等距指標的同速前進」。同樣的思路還能延伸到任何「跟著 next 走必進入循環」的隱式串列結構——只要能定義出下一步函式，找循環入口的方法完全相同。

## Common Mistakes

第一是跳過存在性檢查：第一階段 fast 撞到 null 就該直接回傳 null，硬跑第二階段會對 null 取 next 而拋錯。第二是第二階段的速度：兩個指標都必須每輪走一步，若其中一個保留速度 2，兩者走的步數不再相同，等式 F = nC − a 擔保的「走相同步數、同抵環起點」就用不上，再次相等的位置不再保證是環起點。第三是重設對象搞錯：正確做法是「一個回 head、一個留在相遇點」；把兩個都重設回 head 只會讓它們並肩同行，永遠無法辨認入口。第四是比較時機：必須「先比較、再前進」，才能處理 F = 0（環起點即 head）的情形——若先前進再比較，兩者會一起從環起點出發、第一次比較就相等，回傳的卻是環起點的下一個節點。

## Complexity

時間 O(n)：第一階段的相遇偵測是 O(n)；第二階段兩指標各走恰好 F 步，F 不超過節點總數，同樣是 O(n)。空間 O(1)：全程只有固定數量的指標變數。對照「用 Hash Set 記錄節點、回傳第一個重訪節點」的解法，時間同階，但 Floyd 兩階段把空間從 O(n) 壓到常數。

## Digest

找環起點的完整流程：第一階段用快慢指標偵測相遇，fast 撞到 null 即回傳 null；第二階段把一個指標重設回 head、另一個留在相遇點，兩者同速前進，首次相等處即環起點。正確性來自距離等式 F = nC − a——head 到環起點的距離，恰等於從相遇點補完這一圈再繞整數圈的距離。實作要點：第二階段先比較再前進，才能涵蓋環起點就是 head 的邊界；兩階段合計仍是 O(n) 時間、O(1) 空間。

## TypeScript Tip

```typescript
import assert from "node:assert";

class ListNode {
  constructor(public val: number, public next: ListNode | null = null) {}
}

function detectCycleStart(head: ListNode | null): ListNode | null {
  let slow = head;
  let fast = head;
  while (fast !== null && fast.next !== null) {
    slow = slow!.next;
    fast = fast.next.next;
    if (slow === fast) {
      let p1 = head; // 一個回 head，slow 留在相遇點
      while (p1 !== slow) {
        p1 = p1!.next;
        slow = slow!.next; // 兩者同速前進
      }
      return p1;
    }
  }
  return null; // 無環
}

const a = new ListNode(1);
const b = new ListNode(2);
const c = new ListNode(3);
a.next = b; b.next = c; c.next = b; // 環起點為 b
assert.strictEqual(detectCycleStart(a), b);
assert.strictEqual(detectCycleStart(new ListNode(1)), null);
```

## Python Tip

```python
class ListNode:
    def __init__(self, val=0, next=None):
        self.val = val
        self.next = next

def detect_cycle_start(head: ListNode | None) -> ListNode | None:
    slow = fast = head
    while fast and fast.next:
        slow = slow.next
        fast = fast.next.next
        if slow is fast:          # 相遇：確定有環
            p1 = head             # 一個回 head，slow 留在相遇點
            while p1 is not slow: # 先比較再前進，涵蓋 F = 0
                p1 = p1.next
                slow = slow.next
            return p1
    return None                   # 無環

a, b, c = ListNode(1), ListNode(2), ListNode(3)
a.next, b.next, c.next = b, c, b  # 環起點為 b
assert detect_cycle_start(a) is b
assert detect_cycle_start(ListNode(1)) is None
```

## Takeaway

相遇後一個指標回 head、兩者同速前進，首次相等處即環起點——正確性由距離等式 F = nC − a 保證。

## Tomorrow Preview

明天暫別環的世界，進入鏈結串列的另一項核心基本功：迭代反轉（Reverse Linked List）。我們將用 prev、curr 兩個指標一步步把整條串列的 next 方向翻轉，並用迴圈不變式論證它為何正確。

## Today's Challenge

- **142** · 本課觀念的直接對應：回傳開始入環的第一個節點，完整走過偵測與定位兩個階段。
  - Hint: 相遇後把一個指標移回 head、兩者同速前進；fast 撞到 null 時記得回傳 null。
