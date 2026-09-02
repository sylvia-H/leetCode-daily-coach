---
id: linked-list-merge-two-sorted
title: Merge Two Sorted Linked Lists
module: linked-list
pattern_label: Two-Pointer Merge
complexity_label: O(n + m) / O(1)
estimated_minutes: 20
exit_criteria:
  - 能比較兩個串列的 head，並將較小的節點接到結果串列的尾端
  - 能在其中一個串列先耗盡時處理剩餘節點
---
## Concept

Two-Pointer Merge 處理的問題是：把兩條各自已排序的鏈結串列，合併成一條仍然有序的串列，而且不複製任何節點。做法是先掛一個 dummy head 作為結果串列的錨點，再維護一個 tail 指標，指向結果串列目前的最後一個節點。只要兩條串列都還有節點，就比較兩者當前的 head，把值較小的那個節點接到 tail 後方，並推進該串列的指標與 tail；當其中一條耗盡，把另一條的剩餘部分整段接上即完成。整個過程只是改寫既有節點的 `next` 指標，不配置與輸入規模相關的記憶體。

## Thinking

為什麼「每次取較小的 head」就能保證結果有序？關鍵在一條迴圈不變式：任何時刻，結果串列已按遞增排列，且尾端值不大於兩條串列的所有剩餘節點。初始時結果為空，不變式自動成立。每一輪，因為兩條輸入各自有序，`list1` 當前的 head 是 list1 剩餘節點的最小值，`list2` 亦然——兩者取較小者，就是全部剩餘節點的全域最小值。把它接上尾端：它不小於 tail（tail 是上一輪的全域最小值），有序性不破；它不大於其餘所有剩餘節點，不變式維持。這就是這個貪婪選擇安全的原因。迴圈結束時其中一條為空，另一條的剩餘節點全都不小於 tail 且自身有序，直接整段接上即可，不需再逐一比較。兩邊值相等時取哪邊都不破壞不變式；習慣上用 `<=` 優先取 `list1`，可讓合併保持穩定（同值時維持原相對順序）。

## Pattern Recognition

這正是 Merge Sort 合併階段的鏈結串列版本：看到「兩個或多個已排序的序列要合成一個有序結果」，就該想到雙指標逐一比較。鏈結串列版的特徵是零配置——陣列合併需要 O(n) 的輸出陣列，串列只要重接 `next` 指標，空間壓到 O(1)。擴充方向也很固定：兩條變 k 條時，「取所有 head 的最小值」從一次比較升級為 Min-Heap（每次取出堆頂，代價 O(log k)），或改用分治兩兩合併。

## Common Mistakes

最經典的錯誤是主迴圈結束後忘了接剩餘段：`while (list1 && list2)` 在任一方耗盡時就停，若不補上 `tail.next = list1 ?? list2`，另一方的節點會全數遺失，而且不會有任何錯誤訊息提醒你。第二是弄丟 dummy：tail 一路後移，最後回傳的必須是 `dummy.next`，不是 tail 也不是 dummy 本身。第三是指標推進錯誤——每輪只能推進「被接走那個節點」所屬串列的指標；同時推進兩邊會跳過節點，推錯邊則會把同一個節點重複接入而成環。TypeScript 還有個型別陷阱：`let tail = dummy` 推得的型別是 `ListNode`，直接寫 `tail = tail.next` 會因為 `ListNode | null` 不可指派而編譯失敗；若為此把宣告放寬成 `ListNode | null`，後續每次存取又都得補 non-null 斷言。改成「先接上節點、再讓 tail 直接指向剛接上的那個節點」，tail 的型別恆為 `ListNode`，兩種麻煩都不會發生。

## Complexity

時間 O(n + m)：主迴圈每輪恰好把一個節點移入結果串列，節點總數為 n + m，尾段整批接上只需一步。空間 O(1)：全程只用 dummy、tail 與兩條走訪指標。若改寫成「建立新節點複製值」的版本，空間會升為 O(n + m)，在面試中通常被視為不必要的浪費。

## Digest

合併兩條已排序鏈結串列的關鍵是一條迴圈不變式：結果串列永遠有序，且尾端值不大於所有剩餘節點。因為兩條輸入各自有序，「較小的那個 head」就是全部剩餘節點的全域最小值，接上尾端必然安全——這是貪婪選擇的正確性論證。實作上以 dummy head 起頭免去空串列特判、tail 指標以 O(1) 接上新節點；任一方耗盡後，把另一方整段接上（剩餘段本身有序且全都不小於 tail），不需逐一比較。全程只重接 next 指標、不建新節點，時間 O(n + m)、空間 O(1)。這套合併正是 Merge Sort 的合併階段；推廣到 k 條串列時，「取所有 head 的最小值」交給 Min-Heap 處理。

## TypeScript Tip

接上節點後讓 `tail` 直接指向該節點（而非 `tail = tail.next`），tail 的型別恆為 `ListNode`，不需 non-null 斷言。

```typescript
class ListNode { constructor(public val: number, public next: ListNode | null = null) {} }

function merge(a: ListNode | null, b: ListNode | null): ListNode | null {
  const dummy = new ListNode(0);
  let tail = dummy;
  while (a && b) {
    if (a.val <= b.val) { tail.next = a; tail = a; a = a.next; }
    else { tail.next = b; tail = b; b = b.next; }
  }
  tail.next = a ?? b;
  return dummy.next;
}

const build = (vs: number[]) => vs.reduceRight<ListNode | null>((n, v) => new ListNode(v, n), null);
const out: number[] = [];
for (let p = merge(build([1, 4]), build([2, 3])); p; p = p.next) out.push(p.val);
if (out.join() !== "1,2,3,4") throw new Error("merge failed");
```

## Python Tip

tuple 同步賦值可以一行完成「接上節點＋推進來源指標」，右式會先全數求值，不會互相干擾。

```python
class ListNode:
    def __init__(self, val=0, next=None):
        self.val = val
        self.next = next

def merge(a, b):
    dummy = tail = ListNode(0)
    while a and b:
        if a.val <= b.val:
            tail.next, a = a, a.next
        else:
            tail.next, b = b, b.next
        tail = tail.next
    tail.next = a or b
    return dummy.next

def build(vs):
    head = None
    for v in reversed(vs):
        head = ListNode(v, head)
    return head

out = []
node = merge(build([1, 4]), build([2, 3]))
while node:
    out.append(node.val)
    node = node.next
assert out == [1, 2, 3, 4], "merge failed"
```

## Takeaway

較小的 head 就是全部剩餘節點的最小值——dummy head 起頭、tail 逐一串接、剩餘段整批接上，O(n + m) 時間、O(1) 空間完成合併。

## Tomorrow Preview

明天是 Linked List 模組的收官課 Palindrome Linked List Check：把快慢指標找中點、反轉後半段、雙指標同步比對三項基本功組成一條流水線，在 O(1) 空間內檢查串列是否為迴文。

## Today's Challenge

- **21** · 雙串列合併的標準題：dummy head 起頭、逐一比較接上較小節點，是 Two-Pointer Merge 的直接落實。
  - Hint: 迴圈結束後，記得把未耗盡那條串列整段接上 tail。
- **23** · 把兩條合併推廣到 k 條：每輪要取 k 個 head 的最小值，適合用 Min-Heap 或分治兩兩合併。
  - Hint: 用 Min-Heap 存各串列當前 head，每次取出堆頂接上結果，再放入它的下一個節點。
