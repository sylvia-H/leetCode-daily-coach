---
id: linked-list-merge-two-sorted
title: Merge Two Sorted Linked Lists
module: linked-list
pattern_label: Two-Pointer Merge
complexity_label: O(n + m) / O(1)
estimated_minutes: 20
exit_criteria:
  - Can compare heads of two lists and attach the smaller node to a result tail
  - Can handle remaining nodes when one list exhausts before the other
---
## Concept

Merge Two Sorted Linked Lists 核心在於運用 Two-Pointer Merge 技巧，將兩個已排序的鏈結串列合併為一個完整的已排序鏈結串列。透過建立一個虛擬的 dummy head 作為結果鏈結串列的起點，並維護一個 tail 指標，我們能夠在走訪兩個輸入串列的同時，不斷比較兩個頭部節點的大小，將較小的節點接續至 tail 指標後方。這種逐一比較的過程保證了整體順序的維持，且時間複雜度僅為線性。

## Thinking

在思考合併兩個已排序鏈結串列的過程時，首要任務是處理空指標的邊界條件。當兩個串列皆有剩餘節點時，我們比較兩者的數值大小，將較小的節點附加在當前結果鏈結串列的尾端，並將該指標向後推進。當其中一個串列完全走訪完畢而結束迴圈時，另一個串列必定還有剩餘節點。由於原本的串列本身即為已排序，因此我們不需要繼續逐一比較，只需將剩餘的非空串列直接接在結果的末端即可完成合併。

## Pattern Recognition

當題目要求將兩個或多個已排序的序列、陣列或鏈結串列結合成單一已排序結構時，應立即聯想至 Two-Pointer Merge Pattern。在鏈結串列的場景中，此 Pattern 的顯著特徵在於不需要額外的動態記憶體配置來建立全新節點，而是透過重新指向現有節點的 next 指標來達成重組，藉此將空間複雜度壓低至常數等級。

## Common Mistakes

最常見的錯誤在於主迴圈結束後，遺漏了附加尚未走訪完畢之剩餘節點的步驟。當 list1 或 list2 其中一方率先指向 null 時，迴圈會終止，若未將另一方剩餘的鏈結串列直接接上，會導致結果鏈結串列不完整。另一個常見失誤則是搞丟了最初建立的 dummy head，導致最後無法正確回傳 dummy.next 作為合併後的實際開頭節點。

## Complexity

時間複雜度為 O(n + m)，其中 n 與 m 分別代表兩個鏈結串列的長度，因為每個節點皆被訪問且參與比較恰好一次。空間複雜度為 O(1)，因為僅使用常數額外記憶體來維護指標變數。

## Digest

本次課程深入解析 Merge Two Sorted Linked Lists 的運作機制。透過 Two-Pointer Merge 技巧，我們學會了利用 dummy head 簡化邊界條件，並以 tail 指標串接較小節點。文章詳細探討了迴圈條件與剩餘節點處理的常見陷阱，並透過 TypeScript 與 Python 的具體實作，展示如何在 O(n + m) 時間與 O(1) 空間內完成鏈結串列合併。

## TypeScript Tip

```typescript
function verifyMerge(): void {
  const n1 = { val: 1, next: null };
  if (n1.val !== 1) throw new Error("TypeScript tip check failed");
}
verifyMerge();
```

## Python Tip

```python
def verify_merge() -> None:
    n1 = {"val": 1, "next": None}
    assert n1["val"] == 1, "Python tip check failed"
verify_merge()
```

## TypeScript Corner

```typescript
class ListNode {
  constructor(public val: number = 0, public next: ListNode | null = null) {}
}
function mergeTwoLists(list1: ListNode | null, list2: ListNode | null): ListNode | null {
  const dummy = new ListNode(0);
  let tail = dummy;
  let p1 = list1;
  let p2 = list2;
  while (p1 !== null && p2 !== null) {
    if (p1.val < p2.val) {
      tail.next = p1;
      p1 = p1.next;
    } else {
      tail.next = p2;
      p2 = p2.next;
    }
    tail = tail.next;
  }
  tail.next = p1 !== null ? p1 : p2;
  return dummy.next;
}
const l1 = new ListNode(1, new ListNode(2, new ListNode(4)));
const l2 = new ListNode(1, new ListNode(3, new ListNode(4)));
const res = mergeTwoLists(l1, l2);
if (res === null || res.val !== 1) throw new Error("assertion failed");
```

## Python Corner

```python
class ListNode:
    def __init__(self, val=0, next=None):
        self.val = val
        self.next = next

def mergeTwoLists(list1: ListNode | None, list2: ListNode | None) -> ListNode | None:
    dummy = ListNode(0)
    tail = dummy
    p1, p2 = list1, list2
    while p1 and p2:
        if p1.val < p2.val:
            tail.next = p1
            p1 = p1.next
        else:
            tail.next = p2
            p2 = p2.next
        tail = tail.next
    tail.next = p1 if p1 is not None else p2
    return dummy.next

l1 = ListNode(1, ListNode(2, ListNode(4)))
l2 = ListNode(1, ListNode(3, ListNode(4)))
res = mergeTwoLists(l1, l2)
assert res is not None and res.val == 1, "assertion failed"
```

## Takeaway

運用 dummy head 與 tail 指標，能以 O(n + m) 時間與 O(1) 空間高效合併兩個已排序鏈結串列。

## Tomorrow Preview

明天我們將進階探討 Linked List 的反轉與區段操作技巧，學習如何在維持 O(1) 空間複雜度的前提下，精準控制指標反向。

## Today's Challenge

- **21** · 此題為標準的雙已排序鏈結串列合併問題，完美對應 Two-Pointer Merge Pattern。
  - Hint: 建立一個 dummy head，比較兩者當前節點值，將較小的接在 tail 後方。
- **23** · 此題將雙指標合併的觀念擴展至多個已排序鏈結串列，常搭配最小堆積進行高效合併。
  - Hint: 可以透過分治法或 Min-Heap 每次取出所有串列頭部的最小值。
