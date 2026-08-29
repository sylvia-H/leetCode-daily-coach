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

Linked List Dummy Head Pattern（亦稱 Sentinel Node）是一種在處理 Linked List 題目時極具價值的設計模式。透過在實際的 head 節點之前人為地插入一個額外的 dummy 節點，我們可以為整個串列提供一個永久且固定的前導節點。此 Pattern 的核心目的在於消除當 head 節點本身需要被修改、刪除或在最前方插入新節點時所需的額外邊界條件判斷。由於有了 dummy 節點，原本必須獨立處理的「當前操作會影響 head」之特殊情境，便能與一般節點的操作邏輯完全一致，大幅提升程式碼的簡潔度與正確性。

## Thinking

在處理 Linked List 的演算法問題時，我們通常需要維護一個指標來走訪節點。若我們直接使用原有的 head 指標進行節點的刪除或插入，當修改發生在第一個節點時，會導致 head 本身的指向改變，從而必須在程式碼中寫入額外的情境判斷（例如 if (head === target)）。為了根除這類複雜的邊界條件，思考的切入點應該是：在演算法執行之初，先建立一個虛擬的 dummy 節點，並將 dummy.next 指向原本的 head。在所有的指標操作過程中，我們從 dummy 開始走訪，所有的刪除與插入操作都在目前指標的 next 進行。最後，函式僅需穩定地回傳 dummy.next 即可取得修改後的正確串列頭部。

## Pattern Recognition

當你在閱讀 Linked List 題目時，若發現操作情境符合以下特徵，便高度契合 Dummy Head Pattern：第一，題目的操作可能會導致原本的 head 節點被刪除或取代（例如刪除串列中所有等於特定值的節點）；第二，需要在串列的最前端進行動態插入新節點；第三，在進行複雜的節點重組、合併或兩數相加時，回傳的新串列開頭位置在演算法執行初期無法事先確定。只要會頻繁更動串列的起點結構，或希望統一「頭部節點」與「一般節點」的處理邏輯，就應該立即聯想到使用 Sentinel Node。

## Common Mistakes

開發者在初次使用 Dummy Head Pattern 時最常見的錯誤，就是在函式結尾處回傳了 dummy 節點本身（return dummy），而不是回傳真正串列的開頭 dummy.next。這會導致呼叫端拿到的是我們額外附加的虛擬節點，而非實際的 Linked List 內容，進而引發後續的指標錯誤或測試失敗。另一個常見的錯誤是在走訪過程中，不小心把 dummy 指標本身的指向覆蓋掉，導致最後無法找回正確的起點；正確的做法應當是使用一個額外的走訪指標（例如 let current = dummy），而讓 dummy 保持不動以作為最終回傳的錨點。

## Complexity

O(n) / O(1)

## Digest

Linked List Dummy Head Pattern 透過引入一個哨兵節點，完美解決了頭部節點變動所帶來的邊界問題。掌握此模式能大幅減少程式碼中的特殊狀況判斷。

## TypeScript Tip

```typescript
// TypeScript 中初始化 Dummy Head 的標準寫法
class ListNode {
    constructor(public val: number = 0, public next: ListNode | null = null) {}
}

function createList(arr: number[]): ListNode | null {
    const dummy = new ListNode(0);
    let current = dummy;
    for (const num of arr) {
        current.next = new ListNode(num);
        current = current.next;
    }
    return dummy.next;
}

const testList = createList([1, 2]);
if (testList?.val !== 1) throw new Error("assertion failed");
```

## Python Tip

```python
# Python 中初始化 Dummy Head 的標準 idiom
class ListNode:
    def __init__(self, val=0, next=None):
        self.val = val
        self.next = next

def create_list(nums: list[int]) -> ListNode | None:
    dummy = ListNode(0)
    current = dummy
    for num in nums:
        current.next = ListNode(num)
        current = current.next
    return dummy.next

test_res = create_list([1, 2])
assert test_res.val == 1, "assertion failed"
```

## Takeaway

善用 Dummy Head 消除頭部邊界條件，牢記回傳 dummy.next。

## Tomorrow Preview

明天我們將探討 Two Pointers 技巧在 Linked List 中的進階應用，學習如何有效率地尋找環狀結構與中點位置。

## Today's Challenge

- **203** · 目標數值可能剛好出現在串列的最前端，使用 dummy head 可以直接刪除頭部節點而無需額外分流處理。
  - Hint: 建立 dummy 節點指向 head，利用 current.next 進行值比對與刪除。
- **83** · 在移除排序串列中的重複元素時，若遇到重複值需要將指標跨越，dummy 模式能保持一致的走訪邏輯。
  - Hint: 當 current.next 與 current.next.next 的值相同時，調整指標跳過重複節點。
- **2** · 兩數相加產生的新串列起點在初期無法預知，使用 dummy 節點能輕鬆串接新產生的進位節點並在最後回傳結果。
  - Hint: 宣告 dummy 節點作為新串列的錨點，用 tail 指標向後延伸並處理 carry。
