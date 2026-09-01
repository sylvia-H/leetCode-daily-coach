---
id: linked-list-insertion-head-tail
title: Linked List Insertion at Head and Tail
module: linked-list
pattern_label: Pointer Manipulation
complexity_label: 'O(1) for head, O(n) or O(1) with tail / O(1)'
estimated_minutes: 20
exit_criteria:
  - 能藉由正確更新 head 指標，以 O(1) 時間在開頭插入節點
  - 能處理如插入初始為空的串列等邊界情況
---
## Concept

插入節點只有兩個動作：建立新節點、重接指標，真正的難點在「順序」。單向串列有一條隱形的不變式：每個還需要的節點，都必須隨時有至少一條從外部變數出發的參考路徑；一旦所有路徑都被覆蓋，該節點連同其後整條鏈就再也找不回來。指標賦值的順序，就是為了在每一步都維持這條不變式。

以 Head 插入為例：`newNode.next = head` 先讓新節點接住原本的第一個節點，此時舊鏈同時被 `head` 與 `newNode.next` 參考，怎麼改都安全；接著 `head = newNode` 把錨點移過來，插入完成。反過來先做 `head = newNode`，舊的第一個節點的最後一條參考就被覆蓋，整條串列立刻遺失。Head 插入不需走訪任何節點，時間是 O(1)。

Tail 插入則取決於有沒有維護 `tail` 指標：沒有的話必須從 `head` 一路走到 `next` 為 null 的節點才能接上新節點，成本 O(n)；有 `tail` 的話直接 `tail.next = newNode` 再 `tail = newNode`，回到 O(1)。這也是實作 Queue 這類「尾進頭出」結構時，幾乎必然要維護 tail 的原因。

## Thinking

把插入拆成固定的思考模板：先「入鏈」，再「移錨」。新節點要先把該指的對象都指好（入鏈），才能去動 `head` 或 `tail` 這類錨點變數（移錨）。為什麼這個順序一定安全？因為入鏈只寫入新節點自己的欄位，對既有結構是純讀取，不會覆蓋任何舊參考；等新節點接妥後再移動錨點，被覆蓋的舊參考已經有 `newNode.next` 當備份。

第二個必問的問題是空串列：插入第一個節點後，它既是開頭也是結尾，因此 `head` 與 `tail` 必須同時指向它。Tail 插入時尤其容易漏——空串列沒有 `tail.next` 可以接，必須走「head 與 tail 一起指向新節點」的分支；反過來，非空串列的 Head 插入完全不需要動 tail。

最後，在任意索引插入其實是同一招的推廣：走 index-1 步停在前驅節點，把「前驅的 next」當成區域性的 head，做一次相同的兩步接線；index 為 0 時退化成 Head 插入。

## Pattern Recognition

看到「動態建構串列」「實作 MyLinkedList 這類自訂結構」「模擬 Queue 或 Stack 的進出行為」，就是 Pointer Manipulation 的訊號。這類題的共同特徵是：答案不在演算法多聰明，而在每一行指標賦值是否維持結構完整——會頻繁修改節點間的參照，且對賦值順序極度敏感，順序錯一行就斷鏈。

## Common Mistakes

第一名的錯誤永遠是順序顛倒：先 `head = newNode` 再 `newNode.next = head`——第二行接到的已是新節點自己，形成自我循環，原串列整條遺失。第二是空串列邊界：對空串列做 Tail 插入時只更新 tail、忘了 head（或反之），結構從此不一致，之後從 head 的走訪會漏掉所有資料。在 TypeScript 中，head 的型別必須是 `ListNode | null`，strict 模式會逼你在存取 `.next` 前先收斂 null——這其實是在幫你把「空串列分支」寫出來，不要用 `!` 硬壓過去。在 Python 中沒有型別提醒，變數只是物件的參考，覆蓋任何變數前先自問：這是不是某個節點的最後一條參考路徑？

## Complexity

O(1) for head, O(n) or O(1) with tail / O(1)。Head 插入只重接固定兩條指標，與串列長度無關；Tail 插入在未維護 tail 指標時需走訪整條串列為 O(n)，維護後為 O(1)。空間上僅配置一個新節點，額外空間 O(1)。

## Digest

插入節點的鐵律是「先入鏈、再移錨」：先讓新節點的 next 接住既有結構，再更新 head 或 tail。順序顛倒會覆蓋舊節點的最後一條參考，整條串列瞬間遺失。Head 插入為 O(1)；Tail 插入未維護 tail 指標時需 O(n) 走訪，維護後同樣 O(1)。空串列是必考邊界：第一個節點插入後，head 與 tail 必須同時指向它。今天的題目要求完整實作 addAtHead、addAtTail 與 addAtIndex，是把這套賦值順序練成反射動作的最佳場地。

## TypeScript Tip

先入鏈、再移錨；空串列分支讓 head 與 tail 同步。

```typescript
class ListNode {
  constructor(public val: number, public next: ListNode | null = null) {}
}
class MyList {
  head: ListNode | null = null;
  tail: ListNode | null = null;
  addAtHead(val: number): void {
    const node = new ListNode(val, this.head); // 先入鏈
    this.head = node; // 再移錨
    if (this.tail === null) this.tail = node;
  }
  addAtTail(val: number): void {
    const node = new ListNode(val);
    if (this.tail === null) this.head = node;
    else this.tail.next = node;
    this.tail = node;
  }
}
const l = new MyList();
l.addAtTail(2);
l.addAtHead(1);
const a = l.head;
if (a === null || a.val !== 1 || a.next === null || a.next.val !== 2) throw new Error("斷鏈");
if (l.tail !== a.next) throw new Error("tail 未同步");
```

## Python Tip

把兩步攤開寫，順序是可測的：顛倒時走訪斷言會當場抓到成環。

```python
class Node:
    def __init__(self, val, next=None):
        self.val = val
        self.next = next

head = None
for v in (3, 2, 1):
    node = Node(v)
    node.next = head  # 先入鏈：接住舊 head
    head = node       # 再移錨（順序顛倒會讓 next 指向自己）

vals = []
steps = 0
while head:
    steps += 1
    assert steps <= 10, "走訪超出節點數：結構成環"
    vals.append(head.val)
    head = head.next
assert vals == [1, 2, 3], "插入順序錯誤"
```

## Takeaway

先入鏈、再移錨：新節點接住既有結構後才更新 head 或 tail；空串列插入後頭尾指標必須同指新節點。

## Tomorrow Preview

明天進入 Linked List Deletion by Value or Index：插入是把新節點接進鏈裡，刪除則反過來——停在前驅節點，用 prev.next 跨過目標節點，把它從鏈中繞過。

## Today's Challenge

- **707** · 要求親手實作 addAtHead、addAtTail、addAtIndex，三種插入共用同一套「先入鏈、再移錨」的賦值順序；它同時要求 get 與 deleteAtIndex——刪除正是明天的課，先用走訪基本功完成即可。
  - Hint: 空串列插入第一個節點時，head 與 tail 必須同時指向它；addAtIndex 先走 index-1 步停在前驅，再做一次頭插式的兩步接線。
