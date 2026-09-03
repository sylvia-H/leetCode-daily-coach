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

判斷鏈結串列是否有環，直覺做法是用 Hash Set 記錄走過的節點、看是否重訪，但要付出 O(n) 額外空間。Floyd's Cycle-Finding Algorithm（別名 Tortoise and Hare）只用兩個指標：slow 每次走一步、fast 每次走兩步，同時從 head 出發。若串列無環，fast 會先抵達尾端的 null，走訪自然結束；若有環，fast 會先進入環內打轉，等 slow 也進了環，fast 便一步步追上 slow，兩者必定相遇。於是「是否相遇」成了「是否有環」的等價判準——時間 O(n)、空間 O(1)。

## Thinking

核心疑問是：fast 一次跳兩步，會不會恰好「跳過」slow、兩者擦身而過？把場景放在兩者都已進入環內的時刻，設 fast 落後 slow 的環上距離為 d（沿前進方向計）。每一輪 slow 走 1 步、fast 走 2 步，d 恰好縮短 1——這是全程維持的不變式。既然 d 每輪只減 1，它必定經過 0，不可能從 1 直接跳成負值；換句話說 fast 一定「正好踩在」slow 所在的節點上。這也解釋了速度為何選 1 與 2：相對速度恰為 1，保證間距逐步歸零。若把 fast 改成一次走 3 步，間距每輪縮 2，就可能從 1 直接跨成 −1（也就是繞回環長減一），「每輪只減一所以不會跳過」這個論證立刻失效；兩者從 head 同時出發時其實仍會相遇（雙方都入環後，步數走到環長的整數倍就同位），但相遇點不再滿足明天要用的距離等式。再估步數上界：slow 入環當下，間距至多是環長減一，每輪縮一，所以 slow 繞完一圈之前必被追上；加上入環前的路段，總步數與節點數成正比。實作上迴圈條件寫 `while (fast && fast.next)`：先確認 fast 非空、再確認 fast.next 非空，才能安全執行 `fast = fast.next.next`；迴圈內先推進兩個指標、再比較是否相遇，相遇即回傳有環，迴圈自然結束則回傳無環。

## Pattern Recognition

題目出現 cycle、loop、「會不會走不完」這類字眼，或要求在 O(1) 空間內判斷走訪路徑是否重複時，就該想到 Cycle Detection。它與前一課的快慢指標系出同源：找中點觀察的是「fast 抵達尾端時 slow 的落點」，偵測環觀察的是「fast 追上 slow 的相遇事件」——同一組指標，讀取的訊號不同。對照 Hash Set 解法：時間同為 O(n)，但空間是 O(n) 對 O(1)；面試中「能不能不用額外空間？」的 follow-up 幾乎都指向 Floyd。

## Common Mistakes

第一是空值檢查不完整：只確認 `fast` 就直接取 `fast.next.next`，無環串列走到尾端時當場拋出 TypeError，正確寫法是靠 `&&` 的短路特性依序檢查 `fast` 與 `fast.next`。第二是比較對象錯誤：相遇必須比較節點參照（TypeScript 用 `===`、Python 用 `is`），不能比較 val——不同節點可以存相同的值，比值會誤報有環。第三是搞混兩個出口：有環時靠「相遇」提前回傳，無環時靠 fast 撞到 null 結束，缺一不可；若只寫 `while (slow !== fast)` 而不檢查 null，無環串列會直接崩潰。第四是起點刻意錯開（如 fast 從 head.next 出發）：雖然也能偵測到環，但會改變相遇位置的數學性質，影響明天要學的「找環起點」，建議養成兩者同從 head 出發的標準寫法。

## Complexity

時間 O(n)：無環時 fast 每輪走兩步，至多約 n/2 輪就抵達尾端；有環時，slow 走完入環前路段後至多再繞近一圈就被追上，兩階段步數都與節點數成正比。空間 O(1)：全程只有 slow 與 fast 兩個指標變數，與串列長度無關——這正是它勝過 Hash Set 解法之處。

## Digest

Floyd's Cycle-Finding Algorithm 用快慢指標偵測鏈結串列的環：slow 走一步、fast 走兩步，有環則兩者必相遇，無環則 fast 先撞到 null。相遇保證來自不變式「環上間距每輪恰縮短一」——間距只減一就不會跳過零，fast 必定正好踩上 slow。迴圈條件先檢查 fast 再檢查 fast.next 才能安全前進兩步；相遇判斷比較節點參照而非值。時間 O(n)、空間 O(1)，是 Hash Set 解法的常數空間升級版。

## TypeScript Tip

```typescript
import assert from "node:assert";

class ListNode {
  constructor(public val: number, public next: ListNode | null = null) {}
}

function hasCycle(head: ListNode | null): boolean {
  let slow = head;
  let fast = head;
  while (fast !== null && fast.next !== null) {
    slow = slow!.next; // slow 永遠落後 fast，必非 null
    fast = fast.next.next;
    if (slow === fast) return true; // 比較參照而非 val
  }
  return false;
}

const a = new ListNode(1);
const b = new ListNode(2);
const c = new ListNode(3);
a.next = b; b.next = c; c.next = b; // 尾端指回第二個節點成環
assert.strictEqual(hasCycle(a), true);
assert.strictEqual(hasCycle(new ListNode(1, new ListNode(2))), false);
assert.strictEqual(hasCycle(null), false);
```

## Python Tip

```python
class ListNode:
    def __init__(self, val=0, next=None):
        self.val = val
        self.next = next

def has_cycle(head: ListNode | None) -> bool:
    slow = fast = head
    while fast and fast.next:
        slow = slow.next
        fast = fast.next.next
        if slow is fast:  # 用 is 比較節點身分，不用 ==
            return True
    return False

a, b, c = ListNode(1), ListNode(2), ListNode(3)
a.next, b.next, c.next = b, c, b  # 尾端指回第二個節點成環
assert has_cycle(a) is True
assert has_cycle(ListNode(1, ListNode(2))) is False
assert has_cycle(None) is False
```

## Takeaway

有環時相對速度 1 的追趕使間距每輪恰縮一、必然歸零相遇；無環時 fast 先撞到 null——一趟走訪、常數空間定勝負。

## Tomorrow Preview

明天延續 Floyd：偵測到相遇之後，如何精確找出環的起始節點？做法是把其中一個指標重設回 head、兩者同速前進，背後有一條漂亮的距離等式，我們將完整推導它為何成立。

## Today's Challenge

- **141** · Floyd 演算法的標準應用：只需回答有沒有環，完整練習快慢指標的推進與相遇判斷。
  - Hint: 迴圈條件先檢查 fast 再檢查 fast.next；相遇比較節點參照而非節點值。
- **142** · 在相遇偵測的基礎上更進一步，要求找出環的起始節點，正是明天課程的主角，可先試著挑戰。
  - Hint: 先完成相遇偵測；相遇後把一個指標移回 head，兩者同速前進到再次相等。
