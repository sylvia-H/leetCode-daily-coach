---
id: heap-sift-down-extraction
title: Heap Extraction and Sift-Down Operation
module: heap
pattern_label: Percolate Down
complexity_label: O(log n) time / O(1) space
estimated_minutes: 25
exit_criteria:
  - 能將根與最後一個元素交換、pop 出來，並對新的根執行 sift down。
---
## Concept

Extraction 是從 heap 取走 root（最值）並讓剩下的元素仍是合法 heap。它是昨天 sift-up 的鏡像：插入把新元素放在陣列尾端、沿一條路徑往上修；取出則把陣列尾端的元素搬到 root、沿一條路徑往下修，這條往下修的動作叫 sift-down（Percolate Down）。以 Min-Heap 為例，三個步驟是：記下 `h[0]`；把最後一個元素 `pop` 出來放進 `h[0]`（若 pop 之後已經空了就直接回傳）；從索引 0 開始，把目前節點和它**較小的那個 child** 比較，child 更小就交換並沿著它繼續，否則停止。為什麼補位的一定是最後一個元素？因為 heap 的形狀約束要求完全二元樹，唯一能拿走而不留下空洞的位置就是最後一層最右邊那格，對陣列來說就是 `pop`。若改成「把較小的 child 往上提、一路提到底」，空洞會停在某個不是尾端的葉子上，陣列中間出現缺口，索引公式 `2i+1`、`2i+2` 就全部失效。至於為什麼修一條路徑就夠：搬進來的元素只可能違反它與自己 child 之間的約束，樹裡其他所有 parent-child 對都還成立，sift-down 只是把這一個違規點往下推，直到它消失。

## Thinking

用 Min-Heap `[1, 3, 2, 7, 4, 5, 6]` 走一遍。取出 1，`pop` 出 6 放到 root，得 `[6, 3, 2, 7, 4, 5]`。索引 0 的 child 是 3 與 2，較小的是 2，2 < 6 所以交換：`[2, 3, 6, 7, 4, 5]`。6 落到索引 2，它的 left child 是索引 5 的 5，right child 索引 6 已超出長度，只能跟 5 比，5 < 6 再交換：`[2, 3, 5, 7, 4, 6]`。6 到了索引 5，沒有 child，結束。為什麼一定要先在兩個 child 之中挑較小的，而不是只跟其中一個比？看反例 `[1, 2, 5, 3]`：取出 1 之後 3 補到 root，兩個 child 是 2 與 5。若只拿 3 跟較大的 5 比，3 不大於 5 就不交換，結果停在 `[3, 2, 5]`，root 3 比 child 2 大，heap 壞了；先在 2 與 5 之中挑出較小的 2，3 > 2 才交換，得到 `[2, 3, 5]`。道理是交換後那個 child 會變成新的 parent，它必須不大於**兩個**原本的 child——只有較小的那個天生滿足這件事，因為它不大於自己的兄弟，也不大於被推下去的元素（否則我們不會交換）。每交換一次，違規點只可能出現在被推下去的元素身上，其他地方都已經合法，這就是迴圈不變式。終止很容易看出來：索引每一步至少從 `i` 變成 `2i+1`，翻倍以上，在 n 個元素裡最多走 `floor(log2 n)` 步。最後留一個伏筆：sift-down 的前提只有「兩棵子樹各自已是 heap」，沒有要求起點是 root。這代表它可以套在任意節點上，明天會靠這點做一件比逐一插入便宜得多的事。

## Pattern Recognition

觸發訊號是「反覆取走目前的最值」：priority queue 依優先權出隊、把 n 個元素依序取光就是 heap sort、多路合併時每次挑出最小的頭。今天的題目 215 Kth Largest 則是它的一個變形：維持一個大小固定為 k 的 Min-Heap，只裝目前見過的 k 個最大值，root 就是其中最小的，也就是「第 k 大」。新元素若比 root 大，就把 root 換掉再 sift-down；比 root 小的元素連進 heap 的資格都沒有。整個過程只用到今天教的一條操作。

## Common Mistakes

第一，忘記檢查 child 是否存在。`[2, 3, 5, 7, 4, 6]` 有 6 個元素，索引 2 只有 left child（索引 5），若程式假設有 left 就一定有 right、直接讀索引 6，Python 會拋 IndexError；TypeScript 在 `noUncheckedIndexedAccess` 下會在編譯期擋下，但若用 `!` 硬壓過去，拿 `undefined` 比較會安靜地得到 false。第二，看到 left child 比自己小就立刻交換、沒先比較兩個 child。`[1, 3, 2, 7, 4, 5, 6]` 取出 1 後 6 補到 root，left 是 3，3 < 6 就交換，得 `[3, 6, 2, ...]`，root 3 比 right child 2 大，heap 壞了。第三，只寫 `h[0] = h[n-1]` 卻沒有 `pop`：`[1, 3, 2]` 取出 1 之後會變成 `[2, 3, 2]`，長度沒縮短、2 被留了兩份，之後每次取出都只會拿到同一個 2。第四，heap 只剩一個元素時 `pop` 之後陣列已空，若無條件再寫回 `h[0]`，那個元素會被復活，`[5]` 取出 5 之後又變回 `[5]`，永遠取不完。

## Complexity

sift-down 只沿一條 root 到 leaf 的路徑走，完全二元樹的高度是 `floor(log2 n)`，每步做至多兩次比較與一次交換，所以取出是 O(log n) 時間、O(1) 額外空間。用在 215 時 heap 大小固定為 k，n 個元素各至多一次 sift-down，是 O(n log k) 時間、O(k) 空間。

## Digest

Extraction 從 heap 取走 root，再把最後一個元素 `pop` 出來補到 root——只有尾端能拿走而不破壞完全二元樹的形狀。接著 sift-down：把目前節點和**較小的那個 child** 比，child 更小就交換並沿著它往下，沒有 child 或自己已不大於兩個 child 就停。一定要挑較小的 child，因為它交換上去後得同時不大於兩個原本的 child；`[1, 2, 5, 3]` 取出 1 後若只拿 3 跟較大的 5 比，就會停在壞掉的 `[3, 2, 5]`。索引每步至少翻倍，最多走 `floor(log2 n)` 步，所以是 O(log n)。實作上要記得檢查 right child 是否存在、`pop` 之後陣列可能已空。215 用大小為 k 的 Min-Heap 反覆做這件事，root 就是第 k 大。

## TypeScript Tip

TypeScript 沒有內建 heap，自己寫 `siftDown`：先在兩個 child 中找較小者，再決定是否交換。測資讓 6 補到 root 後一路沉到底、途中經過沒有 right child 的節點；最後把 heap 取光，順序必須是升冪。

```typescript
function siftDown(h: number[], i: number): void {
  for (;;) {
    let m = i;
    for (const c of [2 * i + 1, 2 * i + 2]) if (c < h.length && h[c]! < h[m]!) m = c;
    if (m === i) return;
    [h[i], h[m]] = [h[m]!, h[i]!];
    i = m;
  }
}
function extractMin(h: number[]): number {
  const top = h[0]!;
  const last = h.pop()!;
  if (h.length > 0) { h[0] = last; siftDown(h, 0); }
  return top;
}
const h = [1, 3, 2, 7, 4, 5, 6];
if (extractMin(h) !== 1 || h.join() !== "2,3,5,7,4,6") throw new Error("path");
const out: number[] = [];
while (h.length > 0) out.push(extractMin(h));
if (out.join() !== "2,3,4,5,6,7") throw new Error("order");
```

## Python Tip

自己寫 `sift_down` 直接解 215：前 k 個用 `heappush` 建好大小為 k 的 heap，之後比 root 大的元素覆蓋 root 再 sift-down。測資含重複值，第 4 大是 4；若錯拿 root 跟較大的 child 交換會得到 5。

```python
from heapq import heappush

def sift_down(h: list[int], i: int) -> None:
    while True:
        m = i
        for c in (2 * i + 1, 2 * i + 2):
            if c < len(h) and h[c] < h[m]:
                m = c
        if m == i:
            return
        h[i], h[m] = h[m], h[i]
        i = m

def kth_largest(nums: list[int], k: int) -> int:
    h: list[int] = []
    for x in nums:
        if len(h) < k:
            heappush(h, x)
        elif x > h[0]:
            h[0] = x
            sift_down(h, 0)
    return h[0]

assert kth_largest([3, 2, 3, 1, 2, 4, 5, 5, 6], 4) == 4, "duplicates kept"
```

## Takeaway

取出 root 後用最後一個元素補位，再和較小的 child 交換往下沉，直到不大於兩個 child；路徑長至多 log n。

## Tomorrow Preview

明天是 Linear Time Heap Construction（Heapify）：sift-down 只要求兩棵子樹已是 heap，所以能套在任意節點上。把它用在整條無序陣列上，可以一次建出 heap，而且證明得出總成本是 O(n)，比逐一插入的 O(n log n) 便宜。

## Today's Challenge

- **215** · 「第 k 大」不需要排序整個陣列：維持一個大小為 k 的 Min-Heap，裡面永遠是目前最大的 k 個值，root 就是答案。每個新元素只和 root 比一次，比 root 大才覆蓋 root 並 sift-down。
  - Hint: 重複值不要去掉，`[3, 2, 3, 1, 2, 4, 5, 5, 6]`、k=4 的答案是 4。前 k 個元素先放進 heap，之後只在 `x > h[0]` 時覆蓋 root 並 sift-down；跑完後回傳 `h[0]`。
