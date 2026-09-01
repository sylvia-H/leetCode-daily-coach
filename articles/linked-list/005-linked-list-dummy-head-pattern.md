---
id: linked-list-dummy-head-pattern
title: Linked List Dummy Head Pattern
module: linked-list
pattern_label: Sentinel Node
complexity_label: O(n) / O(1)
estimated_minutes: 15
exit_criteria:
  - 能初始化一個指向實際 head 的 dummy 節點
  - 能一致地回傳 dummy.next 作為修改後的串列 head
---
## Concept

Dummy Head Pattern（亦稱 Sentinel Node）是處理 Linked List 修改類題目的基本功。做法極簡：在真正的 head 之前掛一個額外的 dummy 節點（`dummy.next = head`），所有操作從 dummy 出發，最後回傳 `dummy.next`。它解決的是單向鏈結串列一個結構性的不對稱：刪除或插入節點靠的都是「改寫前驅節點的 next」，但 head 沒有前驅——要刪掉 head，只能直接改動外部持有的 head 參照，於是「操作對象是不是 head」就得另寫一條分支。dummy 補上了這個缺口：有了它，每一個真實節點都擁有前驅，「頭部」不再是特例，同一段迴圈邏輯就能覆蓋整條串列。

## Thinking

先想清楚 dummy 為什麼正確，而不只是好用。刪除節點的通用規則是：站在前驅 cur 上檢查 cur.next，要刪就寫 `cur.next = cur.next.next`，不刪就前進 `cur = cur.next`。這條規則成立的前提是「被檢查的節點有前驅」。加入 dummy 後，這個前提對包含 head 在內的所有真實節點都成立，於是迴圈不變式「cur 之前的節點都已處理完畢，且 cur 永遠是下一個待檢節點的前驅」能一路維持到結尾——這就是 dummy 消除邊界分支的論證，而非只是經驗法則。實作固定三步：建立 dummy 並指向 head；另用走訪指標 cur 從 dummy 出發執行所有操作，dummy 本身不動；結束時回傳 dummy.next。dummy 還有第二種用法：組裝新串列時當作錨點——新串列的第一個節點是誰事先未知，先一律接在 dummy 後面、用 tail 指標一路延伸，最後同樣回傳 dummy.next，開頭自然就是第一個被接上的節點。

## Pattern Recognition

三種訊號提示你使用 dummy：一、操作可能刪除或取代 head，例如刪除所有等於目標值的節點、而目標值恰好出現在開頭；二、可能在串列最前端插入新節點；三、要組裝一條事先不知道開頭是誰的新串列（合併、逐位相加、重排）。反過來說，若題目保證起點結構不變（純走訪、只改節點的值），dummy 沒有壞處但也非必要——判斷依據永遠是「串列的起點結構會不會變動」。

## Common Mistakes

第一個經典錯誤：結尾回傳了 dummy 本身而不是 dummy.next，呼叫端會多拿到一個無意義的哨兵節點。第二：直接拿 dummy 當走訪指標移動，走完後失去回傳錨點；正確做法是另立 cur 走訪，dummy 從頭到尾不動。第三：刪除後立刻前進。刪除與前進必須是互斥分支——刪掉 cur.next 之後，新的 cur.next 可能同樣需要刪除（連續目標值），此時前進會漏刪。第四：型別與初始化寫錯。TypeScript 若把 next 宣告成 `ListNode` 而漏掉 `| null`，尾端的「沒有下一個節點」就無法表達，`new ListNode(0, head)` 在 head 可能為 null 時直接編譯不過；Python 則常見建了 `ListNode(0)` 卻忘了設 `dummy.next = head`，最後回傳的 dummy.next 恆為 None，整條串列憑空消失。dummy 的值不參與運算，設什麼都可以。

## Complexity

O(n) / O(1)。走訪整條串列一次，時間 O(n)；dummy 只額外配置一個節點與常數個指標變數，空間 O(1)，不隨串列長度成長。

## Digest

Dummy Head Pattern 在真正的 head 前掛一個哨兵節點，讓每個真實節點都擁有前驅，「刪改會動到 head」的特殊情境從此與一般節點共用同一段迴圈邏輯。實作三步：建立 dummy 指向 head、另用 cur 從 dummy 出發完成所有操作、最後回傳 dummy.next。它同時是組裝新串列的錨點：開頭未知時先接在 dummy 後面延伸，結束一樣回傳 dummy.next。成本僅一個節點的常數空間。

## TypeScript Tip

```typescript
class ListNode {
    constructor(public val: number = 0, public next: ListNode | null = null) {}
}

function removeVal(head: ListNode | null, target: number): ListNode | null {
    const dummy = new ListNode(0, head);
    let cur = dummy;
    while (cur.next !== null) {
        if (cur.next.val === target) cur.next = cur.next.next; // 刪除後不前進
        else cur = cur.next;
    }
    return dummy.next;
}

const list = new ListNode(7, new ListNode(7, new ListNode(1, new ListNode(7))));
const res = removeVal(list, 7);
if (res?.val !== 1 || res.next !== null) throw new Error("連續或尾端的目標值未刪乾淨");
```

建構式直接收 next，`new ListNode(0, head)` 一行完成初始化。測資含連續與尾端目標值：「刪除後照樣前進」的寫法會在此失敗。

## Python Tip

```python
class ListNode:
    def __init__(self, val=0, next=None):
        self.val = val
        self.next = next

def remove_val(head, target):
    dummy = ListNode(0, head)
    cur = dummy
    while cur.next:
        if cur.next.val == target:
            cur.next = cur.next.next  # 刪除後停在原地
        else:
            cur = cur.next
    return dummy.next

res = remove_val(ListNode(7, ListNode(7, ListNode(1, ListNode(7)))), 7)
assert res.val == 1 and res.next is None
```

`ListNode(0, head)` 是標準 idiom；測資含連續與尾端目標值，刪除後照樣前進的寫法過不了這個 assert。

## Takeaway

dummy 讓每個真實節點都有前驅，頭部不再是特例；操作從 dummy 出發，最後回傳 dummy.next。

## Tomorrow Preview

明天進入 Slow and Fast Pointers：讓兩個指標以不同速度或固定間距走訪，在單趟之內找到串列的中點，或定位倒數第 k 個節點。

## Today's Challenge

- **203** · 昨天你已用「前驅走訪＋head 特判」解過這題；今天用 dummy 重解一次，體會特判整段消失、head 與中間節點統一由前驅處理的差別。
  - Hint: cur 從 dummy 出發，head 命中與否都走同一條 cur.next 刪除路徑；刪除後仍不前進，連續命中才刪得乾淨。
- **83** · 排序串列去重保留每組第一個節點，head 一定留下，其實不加 dummy 也能解；適合對照體會 dummy 真正必要的時機。
  - Hint: 站在 cur 比對 cur.next 的值是否與 cur 相同，相同就跨越，不同才前進。
- **2** · 相加產生的新串列開頭事先未知，dummy 作為組裝錨點，用 tail 一路接上每一位的和，最後回傳 dummy.next。
  - Hint: 用 while (l1 || l2 || carry) 單一迴圈涵蓋補位與最後的進位，就不需要事後補節點。
