---
id: heap-top-k-frequent-elements
title: Top K Frequent Elements
module: heap
pattern_label: Frequency Heap
complexity_label: O(n log k) time / O(n) space
estimated_minutes: 25
exit_criteria:
  - 能使用 min-heap 取出頻率最高的 K 個元素。
---
## Concept

Top K Frequent 是先修課「第 k 大」的直接延伸，只是比較的量從元素值換成出現次數，所以多了一個前置步驟：先用 hash map 掃一遍陣列，統計每個相異值出現幾次，O(n)。統計完手上是 m 組 (次數, 值)，m 是相異值的個數，m ≤ n；問題就變成「在 m 組裡找次數最大的前 k 組」——套用同一副骨架：維護大小 k 的 Min-Heap，比較鍵是次數，root 是保留 k 組裡次數最少的，也就是入選門檻；新的一組次數大於 root 才進來並踢掉 root。走完 m 組，heap 裡的 k 組就是答案，輸出它們的「值」，順序不限。

要留意複雜度裡的 n 和 m 是兩個量：計數階段掃 n 個元素；heap 階段只走 m 組，每組 O(log k)，合計 O(n + m log k)。因為 m ≤ n，寫成 O(n log k) 是它的上界：m 接近 n 時兩者相同，重複很多時 heap 階段幾乎免費。另一條路是依次數做 bucket sort：次數最多是 n，開 n + 1 個桶，從高次數往低掃到收滿 k 個，O(n)——一句話對照即可，今天練 heap。

## Thinking

用 `[3, 1, 1, 1, 2, 2]`、k = 2 走一遍。計數得到 3 出現 1 次、1 出現 3 次、2 出現 2 次，m = 3。依 map 的順序處理：(1, 3) 進入，heap 未滿；(3, 1) 進入，heap 滿，root 是 (1, 3)；(2, 2) 的次數 2 > 1，pop (1, 3)、push (2, 2)，root 變成 (2, 2)。走完，heap 裡是 (2, 2) 與 (3, 1)，輸出值 [2, 1]，任意順序皆可。

不變式與「第 k 大」一模一樣：處理完前 i 組後，heap 裡恰好是這 i 組中次數最高的 min(i, k) 組；淘汰 root 是安全的，因為 heap 裡已有 k 組次數都不低於它，再加上新來這組更高，它至少已被 k 組壓過。題目保證答案唯一，所以次數相等的組不會恰好卡在第 k 名的邊界上，門檻用「大於才進」即可。

實作上 heap 裡放 (次數, 值) 這樣的組合，讓比較先看次數。Python 的 tuple 在次數相同時會接著比第二個元素，值是整數時無妨，若元素是不可比較的物件就得改用 key 或以索引代替。TypeScript 沒有內建 heap，面試時可以自己寫一個小的 Min-Heap，或先用 Array 排序模擬並誠實說明它不是 O(log k)。

## Pattern Recognition

訊號是兩層結構：先對每個元素算出一個分數（這裡是次數，也可能是距離、權重、得分），再取分數最高的前 k 個，且 k 明顯小於相異值數 m。看到「最常出現」「出現次數最多的 k 個」「前 k 個最……」就先想 hash map 計分、再想大小 k 的 heap。若 k 接近 m，heap 的 log k 與排序的 log m 差不多，直接對 m 組排序更省事；若分數是有上界的整數（次數 ≤ n），bucket sort 能做到 O(n)；若題目要求依次數由高到低輸出，heap 逐一 pop 出來是由低到高，最後反轉即可。

## Common Mistakes

反例皆用 `[3, 1, 1, 1, 2, 2]`、k = 2，正解是 {1, 2}。第一，直接把元素值放進 heap：比較的是值不是次數，大小 2 的 Min-Heap 留下最大的兩個值 {2, 3}。第二，走訪原陣列而非相異值：每出現一次就 push 一次 (次數, 值)，值 1 的三筆 (3, 1) 會把 heap 塞滿，輸出 [1, 1]，同一個值重複出現在答案裡。第三，回傳次數而非值：輸出 [2, 3]，恰好長得像合法答案，容易看走眼。第四，全部 m 組放進 Min-Heap 再 pop k 次：pop 出來的是次數最少的兩組，得到 {3, 2}；要從整個 heap 裡 pop 出高頻者得用 Max-Heap，O(m + k log m)。第五，heap 排成遞減（Max 方向）卻沿用「大於 root 才進」的門檻：先進 (1, 3)、(3, 1) 後 root 是 (3, 1)，(2, 2) 因為 2 < 3 被擋在外面，答案變成 {1, 3}——門檻與 root 的方向必須一致。

## Complexity

計數 O(n) 時間、O(m) 空間；heap 階段 O(m log k) 時間、O(k) 空間；合計 O(n + m log k) 時間、O(m) 空間，m ≤ n，故寫成 O(n log k) / O(n) 是上界。對照：對 m 組排序 O(m log m)；bucket sort O(n) 時間、O(n) 空間；全部放進 Max-Heap 再 pop k 次 O(m + k log m)。

## Digest

Top K Frequent 是「第 k 大」骨架的延伸：先用 hash map 掃一遍陣列統計每個相異值的次數（O(n)，得到 m 組，m ≤ n），再對這 m 組維護大小 k 的 Min-Heap，比較鍵是次數，root 是保留 k 組裡次數最少的入選門檻；次數大於 root 才 push 並 pop 掉 root。走完 heap 裡的 k 組就是答案，輸出它們的值、順序不限。複雜度要分清 n 與 m：O(n + m log k) 時間、O(m) 空間，寫成 O(n log k) / O(n) 是上界；依次數 bucket sort 可做到 O(n)。常見錯法：把值而非 (次數, 值) 放進 heap、走原陣列讓同一值重複入選、回傳次數而非值、把全部組放進 Min-Heap 再 pop k 次（拿到的是最不常出現的）。

## TypeScript Tip

TS 沒有內建 heap，此處以排序陣列模擬大小 k 的 Min-Heap（`h[0]` 即 root），每次插入 O(k log k)，僅示範 Pattern。測資把低頻值放在最前面，能抓出「heap 方向與門檻不一致」；`k = m` 的案例確認不會多踢。

```typescript
function topKFrequent(nums: number[], k: number): number[] {
  const cnt = new Map<number, number>();
  for (const x of nums) cnt.set(x, (cnt.get(x) ?? 0) + 1);
  const h: [number, number][] = []; // [次數, 值]
  for (const [v, c] of cnt) {
    if (h.length < k || c > h[0]![0]) {
      h.push([c, v]);
      h.sort((a, b) => a[0] - b[0]);
      if (h.length > k) h.shift();
    }
  }
  return h.map(([, v]) => v);
}
const r = topKFrequent([3, 1, 1, 1, 2, 2], 2);
if ([...r].sort((a, b) => a - b).join() !== "1,2") throw new Error(`got ${r}`);
if (topKFrequent([9, 4, 4], 2).sort((a, b) => a - b).join() !== "4,9") throw new Error("k = m");
```

## Python Tip

`Counter` 一行完成計數；`heappushpop` 先 push 再 pop 最小者，比分開兩步少一次修復。斷言比對的是「值的集合」而非次數，能殺掉回傳次數、走原陣列重複 push、方向反了三種寫法。

```python
from collections import Counter
from heapq import heappush, heappushpop

def top_k_frequent(nums: list[int], k: int) -> list[int]:
    cnt = Counter(nums)            # O(n)，得到 m 個相異值
    h: list[tuple[int, int]] = []  # (次數, 值)，大小維持 k
    for v, c in cnt.items():       # 走 m 組，不是 n 個元素
        if len(h) < k:
            heappush(h, (c, v))
        elif c > h[0][0]:
            heappushpop(h, (c, v))
    return [v for _, v in h]

assert sorted(top_k_frequent([3, 1, 1, 1, 2, 2], 2)) == [1, 2]
assert sorted(top_k_frequent([9, 4, 4], 2)) == [4, 9]
```

## Takeaway

先 hash map 計數得 m 組，再對次數維護大小 k 的 Min-Heap；O(n + m log k)，輸出的是值不是次數。

## Tomorrow Preview

明天換一種用法：用 Min-Heap 合併 k 條已排序串列，heap 裡放的是每條串列目前的頭，而不是候選答案。

## Today's Challenge

- **347** · 核心 Pattern 本尊：hash map 計數把「最常出現」轉成「次數最大的前 k 組」，再套先修課的大小 k Min-Heap；題目保證答案唯一，門檻不必處理平手。
  - Hint: 先計數得到 (次數, 值)，只走相異值、不要走原陣列；heap 以次數比較、大小維持 k；最後輸出 heap 裡每組的「值」，任意順序，不是次數。
