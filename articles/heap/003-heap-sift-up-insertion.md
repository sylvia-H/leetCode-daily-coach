---
id: heap-sift-up-insertion
title: Heap Insertion and Sift-Up Operation
module: heap
pattern_label: Percolate Up
complexity_label: O(log n) time / O(1) space
estimated_minutes: 20
exit_criteria:
  - 能追蹤新加入的元素如何向上冒泡到正確位置。
---
## Concept

昨天把 heap 放進了陣列，今天讓它長大。插入（push）分兩步：先把新元素接在陣列尾端，也就是索引 n 的位置；再從那裡出發，反覆與 parent 比較，若違反 heap property 就交換並上移一層，直到 parent 不比自己大、或已經抵達 root 為止。這個往上走的過程叫 sift-up，也叫 percolate up 或 bubble up。第一步之所以放尾端而不是別處，是為了守住形狀約束：索引 n 正是完全二元樹「最後一層最右邊的下一個空位」，放進去之後整棵樹仍然完全，昨天的三條索引公式全部繼續適用。形狀既然沒壞，剩下要修的就只有順序約束，而且——這是本課的核心——只有一條路徑可能出問題。以下沿用昨天的 Min-Heap 慣例：parent 的值小於或等於每個 child。

## Thinking

先問：放進新元素 x 之後，哪些 parent-child 配對可能違規？牽涉到 x 的配對只有兩種：x 與它的 parent，以及 x 與它的 child——但 x 在索引 n，是葉，沒有 child。所以全樹唯一可能違規的配對是「x 與 x 的 parent」，其他配對的值都沒動過，原本合法就仍然合法。接著看一次交換做了什麼。設 x 在索引 i、parent 在 p，且 `a[p] > x`。交換後 x 上移到 p，原本的 parent 值 v 下移到 i。逐一檢查受影響的配對：v 與它的新 child（x 原本的 child，也就是 v 原本的孫）——v 原本就是那些節點的祖先，沿路徑遞移得 `v <= 孫`，合法；x 與它的新 child v——剛才的比較就是 `v > x`，合法；x 與 x 原本的兄弟（若有）——它現在改掛在 x 底下，而它原本是 v 的 child，`v <= 兄弟` 加上 `x < v` 得 `x < 兄弟`，合法。唯一沒有保證的，又只剩「x 與 x 的新 parent」。這就是迴圈不變式：**每一輪開始時，全樹只有 x 與其 parent 這一對可能違規**。迴圈的終止條件有兩個：`a[parent(i)] <= x`，此時最後一對也合法，全樹恢復 heap property；或 i = 0，x 已是 root，沒有 parent 可違規。兩種結束方式都直接推出正確性。用 `[1, 5, 2, 9, 7, 3]` 插入 0 走一遍：0 放到索引 6，parent 是索引 2 的 2，2 > 0 交換；到索引 2，parent 是 root 的 1，1 > 0 交換；到索引 0，停。途中只碰過索引 6、2、0 三格，其餘位置原封不動——push 不需要碰任何其他子樹，連看都不必看。

## Pattern Recognition

線索是「元素持續進來，且每次進來後都要立刻保住某種順序約束」。串流資料維持目前最小值、Priority Queue 收到新工作、Dijkstra 鬆弛出一條更短的暫定距離——這些場合都是先把新東西放到結構的尾端，再讓它沿一條路徑往上找到該在的位置。辨識時問兩個問題：新元素進來時，形狀能否靠「放在尾端」保住？修復是否只沿一條路徑？兩個都是，就是 sift-up。反過來，若新元素進來後得重排整個結構（例如維持一條完全排序的陣列），那是 O(n) 的插入，不是這個 Pattern。

## Common Mistakes

以下用 Min-Heap 舉反例，錯誤結果都以本篇 Tip 的迴圈寫法（`a[p] <= a[i]` 成立就 break）推得。第一，比較方向寫反：把「parent 比我大才換」寫成 `a[i] > a[p]` 才換。對 `[5, 10]` 插入 3，`3 > 5` 為 `false`，迴圈立刻停，得到 `[5, 10, 3]`，root 不是最小值；對 `[1, 2]` 插入 9 則會一路換到 root，得到 `[9, 2, 1]`。第二，parent 用了 1-based 的 `floor(i / 2)`：對合法的 `[0, 3, 1, 4]` 插入 2，它在索引 4，真正的 parent 是索引 1 的 3，該交換；錯的公式卻算出索引 2 的 1，`1 <= 2` 於是不動，留下 `[0, 3, 1, 4, 2]`，索引 1 的 3 大於它的 child 2，heap 已壞。第三，除法忘了取整：TypeScript 寫 `(i - 1) / 2`，i = 2 時得到 0.5，`a[0.5]` 是 `undefined`，比較恆為 `false` 所以不會 break，反而把值寫進不存在的 0.5 位置、把 `a[2]` 洗成 `undefined`，對 `[5, 10]` 插入 3 得到 `[5, 10, undefined]`；Python 用 `/` 會拋 TypeError，要用 `//`。第四，忘了在 root 停下：迴圈條件少了 `i > 0`，x 到達索引 0 後 parent 算出 -1。TypeScript 的 `a[-1]` 是 `undefined`，比較同樣恆為 `false`，於是把 root 洗成 `undefined`；Python 的 `a[-1]` 是最後一個元素，對 `[1, 5, 2, 9, 7, 3]` 插入 0，0 抵達 root 後會再與尾端的 2 交換，得到 `[2, 5, 1, 9, 7, 3, 0]`，root 大於 child。第五，`heapq` 的命名與教材相反：`heappush` 內部呼叫的是 `_siftdown`，它做的正是本課的往上移動；讀原始碼時以函式做的事為準，別被名字帶偏。

## Complexity

時間 O(log n)：每輪交換讓 x 上升一層，而完全二元樹的高度是 floor(log2 n)，所以最多交換 floor(log2 n) 次，每次是 O(1) 的比較與交換；最好情況是新元素不比 parent 小，一次比較就結束。空間 O(1)：所有操作在原陣列上完成，只多用一個索引變數。

## Digest

插入分兩步：把新元素 x 接在陣列尾端（索引 n），形狀因此仍是完全二元樹；再從那裡沿 parent 公式往上，parent 比 x 大就交換，直到 parent 不比 x 大或 x 成為 root。正確性來自迴圈不變式：每輪開始時，全樹只有「x 與其 parent」這一對可能違規——x 是葉沒有 child，而交換後下移的舊 parent 對它的新 child 仍滿足 `<=`，因為它們原本就是它的後代。迴圈最多走樹高 floor(log2 n) 層，故 O(log n) 時間、O(1) 空間。實作要點：parent 用 `floor((i - 1) / 2)`，迴圈條件含 `i > 0`，Min-Heap 的交換條件是 `a[parent] > a[i]`。

## TypeScript Tip

JavaScript 沒有內建 heap，最小可用的 Min-Heap 只需 push 與 sift-up；斷言除了檢查 root 是最小值與全樹合法，還比對整條陣列的最終布局，確認交換只沿一條路徑發生。

```typescript
class MinHeap {
  a: number[] = [];
  push(v: number): void {
    this.a.push(v);
    let i = this.a.length - 1;
    while (i > 0) {
      const p = Math.floor((i - 1) / 2);
      if (this.a[p]! <= this.a[i]!) break;
      [this.a[p], this.a[i]] = [this.a[i]!, this.a[p]!];
      i = p;
    }
  }
}
const h = new MinHeap();
for (const v of [5, 3, 8, 1, 4, 1]) h.push(v);
const a = h.a;
if (a[0] !== 1) throw new Error("root is not the minimum");
for (let i = 1; i < a.length; i++) if (a[Math.floor((i - 1) / 2)]! > a[i]!) throw new Error("violated at " + i);
if (a.join() !== "1,3,1,5,4,8") throw new Error("unexpected layout " + a.join());
```

## Python Tip

自己寫 sift-up（`heapq` 裡對應的函式偏偏叫 `_siftdown`，別照名字猜）；用同一串輸入與 `heapq.heappush` 逐步對照，每一步的布局都必須完全一致。

```python
import heapq

def push(a: list[int], v: int) -> None:
    a.append(v)
    i = len(a) - 1
    while i > 0:
        p = (i - 1) // 2
        if a[p] <= a[i]:
            break
        a[p], a[i] = a[i], a[p]
        i = p

mine: list[int] = []
ref: list[int] = []
for v in [5, 3, 8, 1, 4, 1]:
    push(mine, v)
    heapq.heappush(ref, v)
    assert mine == ref, f"diverged after pushing {v}: {mine} vs {ref}"
assert mine[0] == 1 and mine == [1, 3, 1, 5, 4, 8], "final layout"
```

## Takeaway

插入放尾端保形狀，再沿 parent 路徑上浮修順序；不變式保證每輪只有一對可能違規，最多走 log n 層。

## Tomorrow Preview

明天是 Heap Extraction and Sift-Down Operation：取出 root 後，把尾端元素搬到 root，再讓它沿另一條路徑往下修復——這次每一步要面對兩個 child，該和誰交換是明天要回答的問題。

## Today's Challenge

本篇為觀念課，沒有對應的 LeetCode 練習題。請用紙筆對 `[1, 5, 2, 9, 7, 3]` 依序插入 4 與 0，寫出每一步的陣列，並標出哪些索引被碰過、哪些原封不動。
