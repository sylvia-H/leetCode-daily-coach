---
id: heap-merge-k-sorted-lists
title: Merge K Sorted Lists
module: heap
pattern_label: Multi-way Merge
complexity_label: O(N log k) time / O(k) space
estimated_minutes: 30
exit_criteria:
  - 能在 heap 中為每個串列維護一個作用中節點，並在取出時推入其後繼節點。
---
## Concept

Linked List 模組的 Merge Two Sorted Linked Lists 已用 Two-Pointer Merge 把兩條已排序串列合成一條，並留下一句鋪梗：「兩條變 k 條時，取所有 head 的最小值交給 Min-Heap 或分治」。今天兌現這句話。Multi-way Merge 的問題是：有 k 條各自已排序的來源（linked list、陣列或 iterator），要合成一條有序序列。兩條版每輪比較兩個 head 取較小者；k 條版每輪要在 k 個 head 之中取最小者，而這正是 heap 擅長的事——把每條串列「目前的 head」放進一顆 Min-Heap，堆頂就是全域最小值。每輪 pop 堆頂接到結果尾端，若它有 next 就把 next push 進去。heap 裡每條串列永遠只有一個代表節點，所以大小不超過 k；N 個節點各進出 heap 一次，每次 O(log k)，總計 O(N log k)。

## Thinking

先確認「pop 堆頂就接上」為什麼安全。兩條版的迴圈不變式照用：結果串列已有序，且尾端值不大於所有剩餘節點；再加一條 heap 專屬的不變式：heap 裡恰好裝著每條尚未耗盡串列的當前 head。每條串列自身有序，它的當前 head 就是該串列剩餘節點的最小值；k 個 head 的最小值就是全部剩餘節點的全域最小值——這正是堆頂。接上尾端後，它不小於舊尾端（舊尾端是上一輪的全域最小值）、不大於其餘節點，第一條不變式維持；把它的 next 推入 heap，該串列的代表換成新 head，第二條不變式維持；若沒有 next，該串列耗盡，heap 少一個代表，仍符合定義。heap 空了就代表所有串列耗盡。

再看複雜度為什麼是 O(N log k)。最直覺的替代是每輪線性掃描 k 個 head，O(N·k)。另一個常見替代是「第 1 條與第 2 條合併，結果再與第 3 條合併……」：第 i 次合併要走完前 i 條的所有節點，前面的節點被重複走過多達 k - 1 次，總計仍是 O(N·k)。分治版把 k 條兩兩配對合併，每一輪 N 個節點都走一遍、輪數 log k，同樣 O(N log k)，額外空間只有 O(log k) 的遞迴深度。heap 版與分治版複雜度相同，差別在場景：heap 版每次只需要 k 個 head 在手邊，來源可以是還沒讀完的檔案或 iterator，是外部排序合併階段的標準做法；分治版不必實作 heap，適合所有串列都已在記憶體中的情況。值相等時 pop 哪一個都不破壞不變式；若要穩定（同值時保持串列編號順序），比較器在值相等時再比串列索引即可。

## Pattern Recognition

訊號是「多個已排序的來源，要合成一個有序結果，而且結果要逐一產出」：k 個已排序陣列合成一個、k 份已排序的日誌檔按時間戳合流、外部排序把多個已排序區塊合併成最終輸出、找出同時涵蓋 k 個串列各一個元素的最小區間。共同骨架都是「heap 裡放每個來源的當前元素、pop 最小、補該來源的下一個」。反過來，若來源本身沒排序，這套做法就不成立——得先各自排序，或把所有元素倒進一顆 heap 逐一 pop，代價升為 O(N log N)。

## Common Mistakes

以下用三條串列 `[1,4,5]`、`[1,3,4]`、`[2,6]` 舉反例，正確輸出是 `1,1,2,3,4,4,5,6`。第一，pop 之後忘記 push 它的 next：heap 初始只有三個 head，pop 三次就空了，輸出 `1,1,2`，其餘五個節點無聲遺失。第二，比較器寫反成 Max-Heap：每輪取的是最大的 head，輸出 `2,6,1,4,5,1,3,4`，既不遞增也不遞減。第三，把空串列的 `null` 也放進 heap：初始化時要跳過空串列，push next 前要先確認存在，否則比較器讀 `null.val` 直接拋錯，輸入 `[[], [1]]` 就會撞到。第四，Python 把節點直接放進 `heapq`：heapq 用 `<` 比較元素，tuple `(val, node)` 在值相同時會退而比較節點，`ListNode` 沒有定義 `__lt__`，兩條串列的 head 同為 `1` 時當場 `TypeError`；改存 `(val, i, node)`，`i` 是串列索引，因為每條串列在 heap 裡最多一個代表，`i` 在 heap 內恆不重複，永遠比不到節點。第五，以為「逐條依序合併」也是 O(N log k)：k 條各長 n 的串列，第 i 次合併走 i·n 個節點，總和約 k²n / 2 = N·k / 2，與線性掃描同級。

## Complexity

時間 O(N log k)：N 個節點各 push 與 pop 一次，heap 大小不超過 k，每次操作 O(log k)；k = 1 時退化為 O(N) 的直接走訪。空間 O(k)：heap 只存 k 個節點的參照，結果串列重接既有節點的 `next`，不配置新節點。分治版時間相同、空間 O(log k) 遞迴深度；線性掃描版 O(N·k) 時間、O(1) 空間，k 很小時未必比較慢。

## Digest

合併 k 條已排序串列，是 Merge Two Sorted Lists 的直接推廣：兩條版每輪比較兩個 head，k 條版把每條串列的當前 head 放進一顆 Min-Heap，堆頂就是全域最小值。迴圈不變式有兩條：結果串列有序且尾端不大於所有剩餘節點；heap 裡恰好是每條未耗盡串列的當前 head。每輪 pop 堆頂接上尾端，再 push 它的 next——這一步是正確性的關鍵，漏掉就會無聲遺失節點。heap 大小不超過 k，N 個節點各進出一次，O(N log k) 時間、O(k) 空間；逐條依序合併看似省事，實際是 O(N·k)。分治兩兩合併同為 O(N log k)，heap 版的優勢在來源可以是尚未讀完的 iterator。Python 的 heapq 要存 `(val, i, node)` 避免值相同時比較到節點本身。

## TypeScript Tip

換頂再下沉：pop 與 push next 合為一次 sift-down，耗盡以 `END` 哨兵替補，回傳值序列。

```typescript
type N = { val: number; next: N | null };
const END: N = { val: Infinity, next: null };
function merge(ls: (N | null)[]): number[] {
  const h = [END, ...ls.filter((n): n is N => !!n)].sort((a, b) => a.val - b.val), out: number[] = [];
  while (h[0] !== END) {
    out.push(h[0]!.val);
    h[0] = h[0]!.next ?? END;
    for (let i = 0, m = 0; ; i = m) {
      for (const c of [2*i+1, 2*i+2]) if (c < h.length && h[c]!.val < h[m]!.val) m = c;
      if (m === i) break;
      [h[i], h[m]] = [h[m]!, h[i]!];
    }
  }
  return out;
}
const L = (...v: number[]) => v.reduceRight<N | null>((next, val) => ({ val, next }), null);
if (merge([L(1,4,5), L(1,3,4), null, L(2,6)]).join() !== "1,1,2,3,4,4,5,6") throw Error("bad");
```

## Python Tip

存 `(val, i, node)`，值相同時比索引 `i`、不會比到節點；兩條串列同以 1 開頭，少了 `i` 會 `TypeError`。

```python
import heapq

class ListNode:
    def __init__(self, val=0, next=None):
        self.val, self.next = val, next

def merge_k(lists):
    h = [(n.val, i, n) for i, n in enumerate(lists) if n]
    heapq.heapify(h)
    dummy = tail = ListNode()
    while h:
        _, i, n = heapq.heappop(h)
        tail.next = n
        tail = n
        if n.next:
            heapq.heappush(h, (n.next.val, i, n.next))
    return dummy.next

def build(vs):
    head = None
    for v in reversed(vs):
        head = ListNode(v, head)
    return head

out, node = [], merge_k([build([1, 4, 5]), build([1, 3, 4]), None, build([2, 6])])
while node:
    out.append(node.val)
    node = node.next
assert out == [1,1,2,3,4,4,5,6]
```

## Takeaway

heap 裡放每條串列的當前 head，pop 最小接上尾端、再 push 它的 next——N 個節點各進出一次，O(N log k)。

## Tomorrow Preview

明天 Find Median from Data Stream 把 heap 從一顆變成兩顆：數字一個個流進來，隨時要答出目前的中位數，關鍵在讓兩顆 heap 的頂端剛好夾住排序後的中間位置。

## Today's Challenge

- **23** · 你在 Linked List 模組用 Two-Pointer Merge 解過兩條版，並見過這題的鋪梗；今天用 Min-Heap 正式解 k 條版，差別在「取最小 head」從一次比較變成 O(log k) 的 pop 與 push。
  - Hint: heap 只放每條非空串列的當前 head；pop 一個接上尾端，若它有 next 就 push next；heap 空了即完成。
