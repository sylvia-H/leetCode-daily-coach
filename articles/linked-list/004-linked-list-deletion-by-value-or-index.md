---
id: linked-list-deletion-by-value-or-index
title: Linked List Deletion by Value or Index
module: linked-list
pattern_label: Pointer Manipulation
complexity_label: O(n) / O(1)
estimated_minutes: 20
exit_criteria:
  - 能從串列的中間、開頭或結尾移除節點
  - 能正確釋放或繞過目標節點的參照
---
## Concept

單向串列的刪除，本質不是「移除」而是「繞過」：把前驅節點的 `next` 從目標改指向 `target.next`，目標節點就從所有走訪路徑上消失了。在有垃圾回收的語言（TypeScript、Python）裡，節點失去所有參考後自然被回收，繞過即等同刪除。

為什麼一定要「停在前驅」？因為指向目標的那條線握在前驅手上——單向串列的節點不知道誰指著自己，能改這條線的只有前驅。這也給了正確性論證：`prev.next = target.next` 之後，從 head 出發的任何走訪，會在 prev 之後直接踏到 target 的下一個節點，恰好跳過 target 一個節點，其餘節點的相對順序完全不變。

刪除有兩種定位方式：按值（走訪比對 val）與按索引（走固定步數）。兩者共用同一個繞過動作，差別只在「怎麼找到前驅」；最壞情況都要走訪整條串列，時間 O(n)，只用常數個指標變數，空間 O(1)。

## Thinking

刪除的思考模板是「超前檢查」：迴圈裡永遠站在 prev、檢查 `prev.next` 是不是目標，而不是站在目標本身——等你站上目標，能改線的位置已經回不去了。

按值刪除有個經典陷阱：繞過 `prev.next` 之後，prev 不能前進。因為繞過後 `prev.next` 已換成新的節點，它還沒被檢查過；若照常前進，連續重複值就會漏刪——實測把 1→2→2→3 中的 2 全部刪除，每輪都前進的版本會輸出 1→2→3，留下一個 2。正確的迴圈不變式是：「prev 與其之前的節點都已確認保留」，只有在 `prev.next` 確認保留時才推進 prev。這樣每一輪不是刪掉一個節點、就是推進一步，兩者都讓剩餘工作變少，迴圈必然終止。

第二個必答題：目標就是 head 時沒有前驅。要嘛在迴圈前特判「head 連續命中目標值」，要嘛引入一個假前驅（Dummy Head）讓 head 也有前驅可停——後者正是明天的主題。

按索引刪除則是 off-by-one 的主場：要停在前驅，是走 index-1 步而不是 index 步；index 為 0 時同樣落入「沒有前驅」的特判。

## Pattern Recognition

「移除所有等於某值的節點」「刪除第 k 個節點」「依條件過濾串列」都是這個 Pattern 的直接訊號：維護 prev（有時加上 curr）走訪、動態重接指標。還有一個變形值得認識：題目只給你目標節點、不給 head，此時找不到前驅，改用「值覆蓋」——把下一個節點的值抄進目標，再繞過下一個節點，等於讓目標自己扮演前驅。這招的限制是刪不了尾節點（沒有下一個節點可抄），題目也因此保證目標不是尾節點。

## Common Mistakes

刪頭有兩個經典錯誤，後果並不相同。第一，漏掉「目標是 head」的分支：prev 迴圈只檢查 prev.next，head 本身永遠不會被繞過，程式不報錯、只是安靜回傳沒刪乾淨的串列——實測 2→1→2 刪 2 會輸出 2→1。第二，刪頭迴圈忘了收斂 null：`while (head.val === val)` 少寫 `head !== null`，整條串列都是目標值（如 2→2→2）時 head 走到 null，再讀 `head.val` 才真的拋出 TypeError（Python 則是 AttributeError）。第三是「繞過後照常推進 prev」，連續重複值必漏刪——同樣不會炸，只是安靜留下錯誤資料，更難察覺。最後，TypeScript 的 strict 模式下 `prev.next.next` 每一層都可能是 null，必須先確認 `prev.next !== null` 再往下取——這個收斂恰好對應「目標存在才繞過」的邏輯，不要用 `!` 略過。Python 則要小心按索引刪除的迴圈邊界：`range(index - 1)` 才會停在前驅，寫成 `range(index)` 就多走一步、刪錯位置。

## Complexity

O(n) / O(1)。按值或按索引刪除，最壞都要走訪整條串列才找得到前驅，時間 O(n)；「值覆蓋」變形不需走訪，為 O(1)。所有做法都只用常數個指標變數，額外空間 O(1)。

## Digest

刪除即繞過：停在前驅節點，把 prev.next 跨過目標改指向目標的下一個節點，目標就從走訪路徑上消失。三個關鍵：一、能改線的只有前驅，所以迴圈永遠站在 prev 檢查 prev.next；二、繞過後 prev 不可前進，否則連續重複值會漏刪；三、目標是 head 時沒有前驅，必須特判——明天的 Dummy Head 會把這個特例收編。按值與按索引刪除共用同一個繞過動作，時間 O(n)、空間 O(1)；搭配「值覆蓋」變形，還能處理只給目標節點、不給 head 的特殊題型。

## TypeScript Tip

繞過後 prev 不動；strict 模式的 null 收斂正是「目標存在才刪」的邏輯。

```typescript
class ListNode {
  constructor(public val: number, public next: ListNode | null = null) {}
}
function removeElements(head: ListNode | null, val: number): ListNode | null {
  while (head !== null && head.val === val) head = head.next; // 刪頭特判
  let prev = head;
  while (prev !== null && prev.next !== null) {
    if (prev.next.val === val) prev.next = prev.next.next; // 繞過，prev 不動
    else prev = prev.next;
  }
  return head;
}
const h = removeElements(new ListNode(2, new ListNode(1, new ListNode(2, new ListNode(2)))), 2);
if (h === null || h.val !== 1 || h.next !== null) throw new Error("漏刪");
```

## Python Tip

按索引刪除：走 index-1 步停在前驅；index 為 0 走「沒有前驅」的分支。

```python
class Node:
    def __init__(self, val, next=None):
        self.val = val
        self.next = next

def delete_at_index(head, index):
    if head is None:
        return None
    if index == 0:
        return head.next  # 沒有前驅：直接移錨
    prev = head
    for _ in range(index - 1):  # 停在前驅
        if prev.next is None:
            return head  # 索引超界：不動
        prev = prev.next
    if prev.next:
        prev.next = prev.next.next  # 繞過
    return head

head = Node(1, Node(2, Node(3)))
head = delete_at_index(head, 1)
assert head.val == 1 and head.next.val == 3
assert head.next.next is None
```

## Takeaway

刪除即繞過：站在前驅改 prev.next 跨過目標；繞過後 prev 不前進，目標是 head 時要特判。

## Tomorrow Preview

明天進入 Dummy Head Pattern：在 head 前掛一個哨兵節點，讓每個真實節點都有前驅，今天「刪 head 特判」的分支就能收編進同一個迴圈。

## Today's Challenge

- **237** · 只給目標節點、拿不到 head 也找不到前驅，逼你改用值覆蓋：把下一個節點的值抄進來再繞過它，等於讓目標自己扮演前驅。
  - Hint: 想想這招為何刪不了尾節點——題目保證目標不是尾節點，正是在補這個洞。
- **203** · 按值刪除的標準場：追蹤前驅走訪、繞過所有命中節點，並處理 head 本身連續命中的邊界。
  - Hint: 繞過一個節點後 prev 先別動——新的 prev.next 還沒檢查過；連續重複值能否刪乾淨，全看這一步。
