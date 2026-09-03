---
id: heapify-linear-time-construction
title: Linear Time Heap Construction (Heapify)
module: heap
pattern_label: Bottom-up Heapify
complexity_label: O(n) time / O(1) space
estimated_minutes: 25
exit_criteria:
  - 能說明為何 bottom-up 建構 heap 是 O(n) 而非 O(n log n)。
---
## Concept

Heapify 是把一整條無序陣列就地變成 heap。最直覺的做法是逐一插入：把元素一個個放到尾端再 sift-up，每次至多 O(log n)，總共 O(n log n)。Bottom-up Heapify 反過來用昨天的 sift-down：從**最後一個非葉節點** `floor(n/2) - 1` 開始，索引倒著走到 0，對每個節點做一次 sift-down，總成本只有 O(n)。起點為什麼是 `floor(n/2) - 1`：最後一個元素在索引 `n-1`，它的 parent 是 `floor((n-2)/2)`，也就是 `floor(n/2) - 1`；所有索引 `>= floor(n/2)` 的節點，left child `2i+1 >= n` 不存在，都是葉子。葉子沒有 child，本身就是合法的單節點 heap，不必處理。倒著走的理由是 sift-down 的前提：它要求「兩棵子樹各自已是 heap」。節點 `i` 的 child 索引 `2i+1`、`2i+2` 都比 `i` 大，倒序處理時它們一定已經處理完；於是迴圈不變式是「所有索引大於 `i` 的節點都已是合法子 heap 的 root」，處理到 `i` 時 sift-down 的前提剛好成立，做完 0 就是整棵 heap。

## Thinking

拿 `[4, 3, 2, 1]` 建 Min-Heap。n = 4，起點是索引 1。索引 1 的值 3 只有 left child（索引 3 的 1），1 < 3 交換：`[4, 1, 2, 3]`。索引 0 的值 4，child 是 1 與 2，較小的 1 上來：`[1, 4, 2, 3]`，4 落到索引 1，它的 child 是 3，再換：`[1, 3, 2, 4]`。兩次 sift-down、三次交換，完成。真正要論證的是為什麼總量是 O(n)。關鍵是把每個節點的成本算成它的**高度** h（到最深葉子的距離），而不是深度：sift-down 最多沉 h 層。完全二元樹裡高度為 h 的節點至多 `ceil(n / 2^(h+1))` 個——葉子約 n/2 個高度 0，往上一層約 n/4 個高度 1，再上一層 n/8 個高度 2。總交換次數至多 Σ h · n/2^(h+1) = (n/2) · Σ h/2^h。這個級數不是「等比所以收斂」就能帶過，要真的算：把 Σ h/2^h 拆成一層層的尾和，1/2 + 2/4 + 3/8 + ... = (1/2 + 1/4 + 1/8 + ...) + (1/4 + 1/8 + ...) + (1/8 + ...) + ... = 1 + 1/2 + 1/4 + ... = 2。所以總交換 ≤ (n/2) · 2 = n，比較次數至多兩倍，是 O(n)。以 n = 1023 的滿樹為例，所有節點的高度加總正好是 n − 10 = 1013，用遞減陣列實測，交換次數就是 1013。反觀逐一插入，每個元素的成本是**深度**，而完全二元樹裡有一半的節點深度是 `floor(log2 n)`，遞減輸入建 Min-Heap 時每個新元素都得一路浮到 root，總交換 Σ floor(log2 i) 約等於 n log2 n − 2n，n = 1023 時實測是 8194。這就是 sift-up 版做不到 O(n) 的原因：葉子最多而葉子的深度最長，成本被最多的節點拉高；sift-down 版剛好相反，葉子最多但高度為 0，成本集中在少數靠近 root 的節點上。要公平地說，隨機資料下逐一插入平均只要約 1.2 次交換，也是線性；差別在最壞情況，而演算法的保證看最壞情況。

## Pattern Recognition

觸發訊號是「資料一開始就全部到齊，之後才開始取最值」：heap sort 的第一階段、對整條陣列做前 k 大（先 O(n) 建 heap 再 pop k 次，O(n + k log n)）、多路合併前把每條來源的第一個元素建成 heap，Python 的 `heapq.heapify` 就是這個演算法。反之，元素是一個個到達、到達時就要回答查詢的串流場景，沒有「一次建完」可言，仍然只能逐一插入。

## Common Mistakes

第一，從索引 0 正著做。`[4, 3, 2, 1]` 正著做：索引 0 的 4 跟較小的 child 2 換，得 `[2, 3, 4, 1]`；索引 1 的 3 跟 child 1 換，得 `[2, 1, 4, 3]`；索引 2、3 沒有 child。結果 root 2 比 child 1 大，不是 heap。原因是處理索引 0 時子樹還沒整理過，sift-down 的前提不成立，1 被埋在下面上不來。第二，JavaScript 忘記 `Math.floor`：n = 5 時 `n / 2 - 1` 是 1.5，`h[1.5]` 讀到 `undefined`，所有比較都是 false，迴圈跑完陣列一個字都沒動，`[4, 3, 2, 1, 0]` 原樣回傳。第三，Python 把 `range(n // 2 - 1, -1, -1)` 寫成 `range(n // 2 - 1, 0, -1)`，漏掉 root：`[4, 3, 2, 1]` 只做索引 1，得 `[4, 1, 2, 3]`。第四，以為 heapify 完的陣列是排序好的：`[4, 3, 2, 1]` 建完是 `[1, 3, 2, 4]`，只有 root 是最小值，其餘順序沒有保證。

## Complexity

Bottom-up Heapify 是 O(n) 時間：高度為 h 的節點至多 n/2^(h+1) 個、各沉至多 h 層，總和 (n/2) · Σ h/2^h = n 次交換。就地修改，O(1) 額外空間。逐一插入是 O(n log n) 最壞情況，遞減輸入建 Min-Heap 時可達到。

## Digest

Heapify 把整條無序陣列就地建成 heap：從最後一個非葉節點 `floor(n/2) - 1` 倒著走到 0，對每個節點做一次 sift-down。倒著走是為了讓 sift-down 的前提「兩棵子樹已是 heap」在每一步都成立；索引 `>= floor(n/2)` 的都是葉子，不用處理。總成本是 O(n) 而非 O(n log n)，因為 sift-down 的代價是節點的高度而非深度：高度 h 的節點至多 n/2^(h+1) 個，Σ h · n/2^(h+1) = (n/2) · Σ h/2^h = (n/2) · 2 = n。逐一插入 sift-up 的代價是深度，而一半的節點是深度最大的葉子，最壞情況 n = 1023 時要 8194 次交換，bottom-up 只要 1013 次。從索引 0 正著做會壞掉：`[4, 3, 2, 1]` 會得到 root 2 大於 child 1 的 `[2, 1, 4, 3]`。

## TypeScript Tip

自己寫 bottom-up `heapify`：先精確比對 `[4, 3, 2, 1]` 建完的結果，再用遞減的 1..63 逐對驗 heap property。

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
function heapify(h: number[]): number[] {
  for (let i = Math.floor(h.length / 2) - 1; i >= 0; i--) siftDown(h, i);
  return h;
}
const isMinHeap = (h: number[]) => h.every((v, i) => i === 0 || h[(i - 1) >> 1]! <= v);
if (heapify([4, 3, 2, 1]).join() !== "1,3,2,4") throw new Error("exact");
const big = heapify(Array.from({ length: 63 }, (_, i) => 63 - i));
if (!isMinHeap(big) || big[0] !== 1) throw new Error("property");
```

## Python Tip

自己寫 bottom-up `heapify` 並數交換次數，與逐一插入對照：n = 1023 遞減輸入下前者是節點高度總和 1013，後者 8194。

```python
def sift_down(h, i):
    s = 0
    while (c := 2 * i + 1) < len(h):
        if c + 1 < len(h) and h[c + 1] < h[c]: c += 1
        if h[i] <= h[c]: break
        h[i], h[c] = h[c], h[i]
        i, s = c, s + 1
    return s

def heapify(h):
    return sum(sift_down(h, i) for i in range(len(h) // 2 - 1, -1, -1))

def by_insert(xs):
    h, s = [], 0
    for x in xs:
        h.append(x)
        i = len(h) - 1
        while i and h[(p := (i - 1) // 2)] > h[i]:
            h[i], h[p] = h[p], h[i]
            i, s = p, s + 1
    return s

d = list(range(1023, 0, -1))
assert heapify(d) == 1013 and all(d[(i - 1) // 2] <= d[i] for i in range(1, 1023))
assert by_insert(list(range(1023, 0, -1))) == 8194
```

## Takeaway

從 `floor(n/2) - 1` 倒著對每個節點 sift-down；成本看高度不看深度，Σ h · n/2^(h+1) = n，所以是 O(n)。

## Tomorrow Preview

明天是 Finding Kth Element with Heap：今天先 O(n) 建 heap 再 pop k 次是一條路，維持大小為 k 的 heap 是另一條，明天把兩條路線在時間與空間上比清楚，並延伸到串流資料。

## Today's Challenge

本篇為觀念課，沒有對應的 LeetCode 練習題。請在紙上對 `[9, 8, 7, 6, 5, 4, 3]` 從索引 2 倒著做 sift-down 建 Min-Heap，逐步寫出陣列並數交換次數，再對照「所有節點高度總和」是不是 4；然後試著從索引 0 正著做一次，找出哪一個 parent-child 對壞掉了。
