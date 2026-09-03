---
id: heap-kth-largest-element
title: Finding Kth Element with Heap
module: heap
pattern_label: Bounded Priority Queue
complexity_label: O(n log k) time / O(k) space
estimated_minutes: 20
exit_criteria:
  - 能維護大小為 k 的 heap 來追蹤極值。
---
## Concept

找第 k 大元素的直覺解是排序後取 `nums[n - k]`，O(n log n)，而且必須把 n 個元素全部握在手上。Bounded Priority Queue 只留 k 個：走訪時維護一個大小不超過 k 的 Min-Heap，走完後 heap 裡就是全部元素中最大的 k 個，root 是這 k 個裡最小的——它正是第 k 大。

為什麼找「最大的 k 個」卻用 Min-Heap？因為每一步要淘汰的是「目前保留的 k 個裡最小的」，Min-Heap 讓它永遠站在 root：O(1) 看得到、O(log k) 踢得掉。root 同時是門檻：新元素比 root 大才有資格進來；小於或等於 root 的元素不比保留的 k 個任何一個大，硬換進來被踢掉的也是它自己或同值的 root，第 k 大的值不變，直接略過。反過來，找第 k 小就維護大小 k 的 Max-Heap，root 是保留的 k 個裡最大的，規則完全對稱。

這題你在 sift-down 那課已用「大小 k 的 Min-Heap」實作過一次，當時重點是 extraction 本身；今天把它抽象成「第 k 大／小 ⇒ 反方向的 k 元素 heap」這個 Pattern，把正確性講清楚，再延伸到資料一筆筆到來的串流版。

## Thinking

用不變式來論證：處理完前 i 個元素後，heap 裡恰好是這 i 個當中最大的 min(i, k) 個。初始為空，成立。來了第 i + 1 個元素 x：若 heap 未滿，直接 push，heap 仍是目前全部；若已滿且 x > root，heap 裡有 k 個值都不小於 root，再加上 x 比 root 大，root 至少已被 k 個元素壓過，不可能再是前 k 大，pop 掉它、push x，不變式恢復；若 x ≤ root，x 比保留的 k 個都不大，heap 不需改動。走完 n 個元素，heap 就是全體前 k 大，root 即第 k 大。

用 `[3, 2, 1, 5, 6, 4]`、k = 2 走一遍：3、2 進入，root 是 2；1 ≤ 2 略過；5 > 2，pop 2、push 5，heap 是 {3, 5}，root 3；6 > 3，pop 3、push 6，heap 是 {5, 6}，root 5；4 ≤ 5 略過。答案 5。

串流版只是把「走訪陣列」換成「每次 add」：建構時把初始元素逐一 add（初始可能少於 k 個，此時 heap 只是還沒填滿，照 push 即可；多於 k 個則必須裁到 k），之後每次 add 先 push、超過 k 就 pop，回傳 root。每次 add 是 O(log k)，與至今看過幾筆無關。若整個陣列一開始就在手上，可先用先修課的 heapify 把前 k 個以 O(k) 建成 heap，剩下的 n − k 個再逐一過門檻。

## Pattern Recognition

訊號有三個：題目問「第 k 大／第 k 小」或「前 k 名」；資料是串流、或 n 遠大於 k 而不想把全部載入記憶體；每筆資料只需與門檻比一次就能決定去留。方向規則只有一條：找第 k 大用大小 k 的 Min-Heap，找第 k 小用大小 k 的 Max-Heap——heap 的方向永遠與要找的極值相反，因為 root 站的是「被淘汰的那一端」。若 k 接近 n，改找第 n − k + 1 小可讓 heap 保持小；k = 1 時 heap 退化成一個變數，掃一遍記錄最大值即可。Quickselect 平均 O(n) 但最壞 O(n^2)，且需要整個陣列可原地分割，串流用不上。

## Common Mistakes

以下反例皆用 `[3, 2, 1, 5, 6, 4]`、k = 2（正解 5）。第一，用大小 k 的 Max-Heap，超過 k 就 pop root：每次丟掉的是最大值，最後留下 {1, 2}，root 是 2——那是第 k 小的鏡像。第二，只 push 不裁：heap 長到 6 個，root 是全域最小值 1。第三，串流版建構子只 heapify 不裁：初始 `[4, 5, 8, 2]`、k = 3 時 heap 留著 4 個，接著 add(3) 只 pop 一次，heap 變成 {3, 4, 5, 8}，回傳 3，正解是 4；建構子必須裁到 k，或直接呼叫 add 逐一放入。第四，先回傳 root 再裁：同一組初始，add(3) push 後 root 是 3，先回傳就拿到 3，pop 掉 3 之後 root 才是 4。第五，把「全部放進 Max-Heap 再 pop k − 1 次」當成錯誤：它是對的，O(n + k log n)，只是空間 O(n) 且串流無法用，是另一種取捨而不是 bug。

## Complexity

時間 O(n log k)：每個元素最多一次 push 與一次 pop，heap 大小不超過 k。空間 O(k)。整個陣列可用時，先 heapify 前 k 個是 O(k)，其餘 n − k 個各 O(log k)。對照：排序 O(n log n)；全部放進 heap 再 pop k − 1 次是 O(n + k log n)、空間 O(n)；Quickselect 平均 O(n)、最壞 O(n^2)、空間 O(1)，但必須整個陣列在手。串流版每次 add 是 O(log k)。

## Digest

找第 k 大不必排序：走訪時維護大小 k 的 Min-Heap，heap 裡永遠是目前為止最大的 k 個，root 是其中最小的，也就是第 k 大的候選門檻。新元素比 root 大才 push 並 pop 掉 root（root 已被 k 個元素壓過，不可能再是前 k 大），否則略過；走完 root 即答案。找第 k 小則對稱地用大小 k 的 Max-Heap——heap 方向永遠與要找的極值相反。時間 O(n log k)、空間 O(k)。串流版每次 add 先 push、超過 k 就 pop、回傳 root；初始少於 k 個時先填滿即可，建構子拿到多於 k 個時必須裁到 k。常見錯法：用 Max-Heap 裁大小會得到第 k 小的鏡像、只 push 不裁讓 root 變成全域最小、先回傳再裁會拿到剛 push 進去的值。

## TypeScript Tip

TS 沒有內建 heap，此處以排序陣列模擬大小 k 的 Min-Heap（`h[0]` 即 root），每次 add 是 O(k log k) 而非 O(log k)，僅示範 Pattern；建構子沿用 add，初始多於或少於 k 個都能處理。

```typescript
class KthLargest {
  private h: number[] = [];
  constructor(private k: number, nums: number[]) {
    for (const x of nums) this.add(x);
  }
  add(x: number): number {
    if (this.h.length < this.k || x > this.h[0]!) {
      this.h.push(x);
      this.h.sort((a, b) => a - b);
      if (this.h.length > this.k) this.h.shift();
    }
    return this.h[0]!;
  }
}
const kl = new KthLargest(3, [4, 5, 8, 2]);
const got = [3, 5, 10, 9, 4].map((x) => kl.add(x));
if (got.join() !== "4,5,5,8,8") throw new Error(`stream ${got}`);
const few = new KthLargest(2, []); // 初始少於 k 個
few.add(1);
if (few.add(7) !== 1 || few.add(3) !== 3) throw new Error("fill-up");
```

## Python Tip

`heappushpop` 一步完成 push 與淘汰最小者；建構子必須裁到 k。斷言涵蓋初始多於 k、少於 k 與離線版（建構完讀 root）；`heapq.nlargest(k, nums)[-1]` 做的正是同一件事。

```python
from heapq import heapify, heappop, heappush, heappushpop

class KthLargest:
    def __init__(self, k: int, nums: list[int]):
        self.k, self.h = k, nums[:]
        heapify(self.h)
        while len(self.h) > k:  # 裁到 k
            heappop(self.h)
    def add(self, val: int) -> int:
        if len(self.h) < self.k:
            heappush(self.h, val)
        else:
            heappushpop(self.h, val)  # O(log k)
        return self.h[0]

kl = KthLargest(3, [4, 5, 8, 2])
assert [kl.add(x) for x in [3, 5, 10, 9, 4]] == [4, 5, 5, 8, 8]
few = KthLargest(2, [])
few.add(1)
assert few.add(7) == 1 and few.add(3) == 3
assert KthLargest(2, [3, 2, 1, 5, 6, 4]).h[0] == 5
```

## Takeaway

第 k 大＝大小 k 的 Min-Heap：root 是保留 k 個裡最小的、正是門檻，比它大才進、進了就踢 root；找第 k 小則反向。

## Tomorrow Preview

明天把同一副骨架套到「出現次數最多的前 k 個元素」：先用 hash map 計數，再讓 heap 比較的量從元素值換成次數。

## Today's Challenge

- **215** · 這題你在 sift-down 那課已用大小 k 的 Min-Heap 解過；今天再解一次，差別在把它當成 Pattern：先論證 root 為何是第 k 大的門檻，再確認自己說得出「找第 k 小時 heap 要反向」。
  - Hint: 走訪陣列維護大小 k 的 Min-Heap，元素大於 root 才 push 並 pop 掉 root；走完回傳 root。整個陣列在手時可先 heapify 前 k 個。
- **703** · 串流版：每次 add 都要回傳當前第 k 大，正是「heap 大小維持 k、root 是門檻」的直接應用，每次只花 O(log k)。
  - Hint: 建構子把初始元素逐一 add 並把 heap 裁到 k（初始可能少於 k 個，先填滿即可）；add 先 push、超過 k 就 pop，最後回傳 root。
