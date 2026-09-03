---
id: linked-list-traversal-basics
title: Linked List Traversal Basics
module: linked-list
pattern_label: Linear Scan
complexity_label: O(n) / O(1)
estimated_minutes: 15
exit_criteria:
  - 能寫出以 current = current.next 前進且不遺失參照的 while 迴圈
  - 能正確處理空串列的情況
---
## Concept

走訪（Traversal）是從 head 出發、沿著 next 指標依序拜訪每一個節點的基本操作。標準模板只有三個動作：先讓暫時指標 current 指向 head；以 `while (current !== null)` 作為迴圈條件；迴圈內先處理 current 指到的節點，再以 `current = current.next` 前進一步。因為節點散落在非連續記憶體中、無法按索引直達，「看過每個節點」在鏈結串列上只有這一條路——計數、找值、印出、找中點，全是這個模板的變形。

## Thinking

這個模板的正確性可以用迴圈不變式（loop invariant）說清楚：每輪迴圈開始時，current 指向第一個尚未處理的節點，且 current 之前的所有節點都恰好被處理過一次。初始時 current = head、尚未處理任何節點，不變式成立；每輪處理完 current 再前進一步，不變式維持；結束時 current 為 null，代表「尚未處理的節點」已不存在——n 個節點恰好各處理一次。終止性同樣有保證：無環串列長度有限，current 每輪沿鏈前進一格，恰好 n 輪後抵達 null——五個節點就是五次迭代。但前提是「無環」——若串列成環，current 永遠遇不到 null，這個迴圈不會終止；環的偵測是之後快慢指標課的主題。再想清楚為什麼條件是 current 不為 null，而不是 current.next 不為 null：後者會在最後一個節點提前收工、漏掉它；而且空串列時 current 本身就是 null，取 current.next 會當場出錯。

## Pattern Recognition

只要題目要求檢查、統計、搜尋或輸出 singly linked list 的全部元素，而結構又不支援隨機存取，就是 Linear Scan：計算長度、找特定值、找中點（先走一趟數出 n，再走 n/2 步）、比對兩條串列是否相等。更複雜的鏈結串列題往往也是「走訪骨架＋額外簿記」——先把骨架練到反射性正確，再往上疊操作。

## Common Mistakes

第一，單輪推進兩次（連寫兩句 `current = current.next`，或直接取 `current.next.next`）：必然跳過約一半節點——偶數長度不報任何錯、靜默漏看一半，更難察覺；奇數長度則在尾端對 null 取屬性，Python 拋 AttributeError、JavaScript 拋 TypeError，而本專案的 strict TypeScript 因為 next 型別含 null，這兩種寫法根本過不了編譯。第二，直接拿 head 當走訪指標：迴圈結束後 head 變成 null，串列入口遺失、無法再從頭操作——永遠另取暫時指標，讓 head 原地不動。第三，忽略空串列：head 為 null 是合法輸入，標準條件會讓迴圈一次都不執行、自然安全略過；但若在迴圈之外先取 head.val 或 head.next，就會當場出錯。第四，TypeScript 特有：走訪變數的型別要收斂為「節點或 null 的聯集」，若從非空節點推論而來，後續把可能為 null 的 next 指回去會被型別檢查擋下。

## Complexity

時間複雜度 O(n)：每個節點恰好拜訪一次、每次做常數量的工作。空間複雜度 O(1)：無論串列多長，只用到一個走訪指標與少量累計變數。

## Digest

走訪是鏈結串列一切操作的地基：current 從 head 出發，`while (current !== null)` 保護每次存取都落在真實節點上，處理完再以 `current = current.next` 前進。迴圈不變式保證每個節點恰好處理一次，無環前提下恰好 n 步終止；空串列則讓條件直接為偽、安全略過。三個紀律：用暫時指標而非 head 本身、先處理再前進、單輪只前進一次。把這個 O(n) 時間、O(1) 空間的骨架練熟，後續的插入、刪除、反轉都只是在骨架上加動作。

## TypeScript Tip

`while (current !== null)` 不只是安全檢查，也讓 TS 在迴圈內把 current 收斂成非 null，存取 val 與 next 都不需要 `!` 斷言。

```typescript
class ListNode {
  next: ListNode | null = null;
  constructor(public val: number) {}
}

const head = new ListNode(1);
head.next = new ListNode(2);
head.next.next = new ListNode(3);

let total = 0;
let current: ListNode | null = head;
while (current !== null) {
  total += current.val;
  current = current.next;
}
if (total !== 6) throw new Error("traversal sum assertion failed");
```

## Python Tip

慣用寫法 `while curr:` 把 `None` 視為假值，空串列與走到鏈尾由同一個條件自然收束。

```python
class ListNode:
    def __init__(self, val=0, next=None):
        self.val = val
        self.next = next

head = ListNode(1, ListNode(2, ListNode(3)))
total = 0
curr = head
while curr:
    total += curr.val
    curr = curr.next
assert total == 6, "traversal sum assertion failed"
assert curr is None
```

## Takeaway

用暫時指標從 head 出發，迴圈內先處理再 current = current.next，每個節點恰好一次，O(n) 時間、O(1) 空間。

## Tomorrow Preview

明天是 Linked List Insertion（Head 與 Tail）：在串列開頭與尾端接上新節點，第一次真正動手改寫指標——今天的走訪骨架會直接用來找到尾端。

## Today's Challenge

- **876** · 找中點最直觀的解法完全建立在標準走訪上：先走一趟數出長度 n，再從 head 走 floor(n/2) 步即是中點，兩趟都是今天的模板。
  - Hint: 偶數長度時題目要的是第二個中點——走 floor(n/2) 步在奇偶兩種長度下都正好落在正確節點；寫成 (n-1)/2 會偏到第一個中點。
- **430** · 多層雙向串列的攤平仍是「每個節點恰好拜訪一次」的線性掃描，只是節點多了 child 分支：深入子層前必須先保存原本的 next，是「前進前不遺失參照」紀律的加強版。
  - Hint: 遇到 child 就先把 next 壓進堆疊，子層走完再取出接回；接回時記得同步修正 prev 並把 child 清成 null。
