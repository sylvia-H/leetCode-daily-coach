---
id: heap-find-median-from-data-stream
title: Find Median from Data Stream
module: heap
pattern_label: Two Heaps Balance
complexity_label: O(log n) insert / O(1) median / O(n) space
estimated_minutes: 30
exit_criteria:
  - 能維持兩個 heap 之間的平衡，使兩者的根能直接給出中位數。
---
## Concept

昨天一顆 Min-Heap 合併 k 條已排序來源；今天用兩顆 heap 追蹤一條無序資料流的中位數。中位數是排序後正中間的值：n 為奇數取第 (n + 1) / 2 個，n 為偶數取中間兩個的平均。數字持續流入、隨時要答，重點不是維持整體有序，而是隨時知道「中間」在哪。Two Heaps Balance 把目前所有數字切成兩半：較小的一半放進 Max-Heap `lo`，較大的一半放進 Min-Heap `hi`，兩顆 heap 的頂端剛好是「左半最大」與「右半最小」——排序後相鄰的兩個中間位置。要讓這件事永遠成立，得維持兩條不變式：（一）`lo` 的每個元素都不大於 `hi` 的每個元素；（二）`lo` 的大小等於 `hi`，或恰好多一。有了它們，總數為奇數時中位數就是 `lo` 頂端，偶數時是兩個頂端的平均，讀取 O(1)。

## Thinking

先看兩條不變式為何足夠。把 `lo` 與 `hi` 各自排序後接起來，由（一）可知這串就是全體的遞增排序；由（二）可知 `lo` 佔前半，奇數時多佔正中間那一個。所以正中間位置一定是 `lo` 的最大值，偶數時另一個中間位置是 `hi` 的最小值——兩者正是各自 heap 的頂端。

再看 `addNum` 要怎麼同時保住兩條不變式。直覺做法是把新值直接放進某一邊、事後只修大小，但只修大小救不回（一）。以序列 1、2、3 為例：1 進 `lo`；2 進 `lo` 後 `lo` 比 `hi` 多兩個，把頂端 2 搬去 `hi`，此時 `lo` = {1}、`hi` = {2}；3 進 `lo`，大小 2 比 1 沒有超標，不搬——但 `lo` = {1, 3} 的 3 大於 `hi` 的 2，（一）已壞，回報中位數 3，正確答案是 2。標準做法是讓每個新值都「經過頂端過濾」：先 push 進 `lo`，立刻把 `lo` 頂端 pop 出來 push 進 `hi`。搬過去的是 `lo` 加上新值之後的最大值，它不小於留在 `lo` 的任何元素，而原本 `lo` 的元素都不大於 `hi`，所以（一）在搬完後仍成立。這一搬讓 `hi` 淨多一個；若此時 `hi` 比 `lo` 大，就把 `hi` 頂端搬回 `lo`——搬回的是 `hi` 的最小值，不大於 `hi` 留下的任何元素，（一）同樣不破，（二）也修回來。同一序列以此流程重跑：3 進 `lo` 後 `lo` = {1, 2, 3}，搬 3 到 `hi` = {2, 3}，`hi` 較大，搬 2 回來，得 `lo` = {1, 2}、`hi` = {3}，中位數 2。整個 `addNum` 至多三次 heap 操作，O(log n)。另一種正確寫法是依值分邊（不大於 `lo` 頂端就進 `lo`，否則進 `hi`）再依大小搬頂端，但要特判 `lo` 為空；統一走「先進 `lo`、再搬頂、再回搬」則不需任何特判。

## Pattern Recognition

訊號是「資料只增不減、隨時要問順序統計量」：串流中位數、即時的第 k 小、上下百分位。判斷點是：需要整體有序嗎？只要中間那個位置，就不必——排序陣列每次插入要搬移 O(n)，平衡 BST 能做到 O(log n) 但實作重，兩顆 heap 只維持「每半邊的極值」，剛好夠用。若中位數只問一次、資料已全部到齊，直接排序或 Quickselect 即可，不需要這個架構。

## Common Mistakes

第一，只修大小不過濾頂端，或只看個數分邊（輪流放、哪邊少就放哪邊）：上面的 1、2、3 反例，回報 3 而非 2。第二，少了回搬那一步：只做「進 `lo`、搬頂到 `hi`」，序列 [1] 之後 `lo` 為空、`hi` = {1}，奇數分支去讀 `lo` 頂端，TypeScript 得到 `undefined`、Python 拋 `IndexError`。第三，兩顆 heap 用了同一個比較方向：若 `lo` 也是 Min-Heap，序列 5、1、2、3、6、4 的逐步中位數會變成 5、3、1、2、1、2.5（正確是 5、3、2、2.5、3、3.5），從第三個值起就錯。第四，Python 用取負值模擬 Max-Heap 後忘記負回來：`heappush(lo, -x)` 之後搬頂端寫成 `heappush(hi, heappop(lo))`，單一元素 5 進來會回報 -5；讀中位數時 `lo[0]` 也得負回來。第五，偶數時用整數除法：Python 寫 `(hi[0] - lo[0]) // 2`，序列 1、2 得到 1 而非 1.5。

## Complexity

`addNum` 至多一次 push 進 `lo`、一次 pop 與 push 搬到 `hi`、一次 pop 與 push 搬回，共 O(log n)；`findMedian` 只讀兩個頂端，O(1)。空間 O(n)，所有數字都保留。若題目限定值域很小（例如 0 到 100），可改用計數陣列，以 O(值域) 時間掃到中位數，那是這個架構之外的特殊優化。

## Digest

資料流中位數用兩顆 heap 夾住中間位置：較小的一半放 Max-Heap `lo`，較大的一半放 Min-Heap `hi`，維持兩條不變式——`lo` 的每個元素都不大於 `hi` 的每個元素、`lo` 的大小等於 `hi` 或多一——奇數時中位數是 `lo` 頂端，偶數時是兩個頂端的平均。`addNum` 的關鍵是讓新值「經過頂端過濾」：先 push 進 `lo`，立刻把 `lo` 頂端搬到 `hi`，搬走的是左半的最大值，所以左半仍全都不大於右半；若 `hi` 變得比 `lo` 大，再把 `hi` 頂端搬回。只修大小不過濾的寫法對序列 1、2、3 會回報 3。每次插入 O(log n)、查詢 O(1)、空間 O(n)。Python 的 heapq 只有 Min-Heap，`lo` 存負值模擬 Max-Heap，搬動與讀取都要負回來，偶數時的平均要用 `/` 不用 `//`。

## TypeScript Tip

`lo` 存負值充當 Max-Heap。

```typescript
const push = (a: number[], v: number) => {
  a.push(v);
  for (let i = a.length - 1, p = (i-1)>>1; i > 0 && a[i]! < a[p]!; i = p, p = (i-1)>>1) [a[i], a[p]] = [a[p]!, a[i]!];
};
const pop = (a: number[]) => {
  const t = a[0]!;
  a[0] = a[a.length - 1]!; a.pop();
  for (let i = 0, m = 0; ; i = m) {
    for (const c of [2*i+1, 2*i+2]) if (c < a.length && a[c]! < a[m]!) m = c;
    if (m === i) break;
    [a[i], a[m]] = [a[m]!, a[i]!];
  }
  return t;
};
const lo: number[] = [], hi: number[] = [], g: number[] = [];
for (const x of [5,1,2,3,6]) {
  push(lo, -x); push(hi, -pop(lo));
  if (hi.length > lo.length) push(lo, -pop(hi));
  g.push(lo.length > hi.length ? -lo[0]! : (hi[0]! - lo[0]!) / 2);
}
if (g.join() !== "5,3,2,2.5,3") throw new Error("bad");
```

## Python Tip

「push 進 `lo` 再 pop 頂端」合成一次 `heappushpop`；`lo` 存負值，搬動與讀取都要負回來，偶數平均用 `/`。

```python
import heapq

lo, hi = [], []  # lo 存負值充當 max-heap


def add_num(x):
    heapq.heappush(hi, -heapq.heappushpop(lo, -x))
    if len(hi) > len(lo):
        heapq.heappush(lo, -heapq.heappop(hi))


def find_median():
    return -lo[0] if len(lo) > len(hi) else (hi[0] - lo[0]) / 2


got = []
for x in [5, 1, 2, 3, 6, 4]:
    add_num(x)
    got.append(find_median())
assert got == [5, 3, 2, 2.5, 3, 3.5], got
```

## Takeaway

左半 Max-Heap、右半 Min-Heap，新值先進左再把頂端搬到右、右邊過大就搬回——兩個頂端永遠夾住中位數。

## Tomorrow Preview

明天 Task Scheduler with Cooldown 換一種組合：一顆頻率 Max-Heap 配一條等待佇列，每回合貪婪地執行目前次數最多且不在 cooldown 中的任務。

## Today's Challenge

- **295** · 資料持續流入且隨時要查中位數，排序陣列每次插入 O(n)；兩顆 heap 只維持左半最大與右半最小，插入 O(log n)、查詢 O(1)。
  - Hint: 先 push 進左半 Max-Heap，立刻把它的頂端搬到右半 Min-Heap；右半比左半大就搬回一個。奇數取左頂，偶數取兩頂平均。
