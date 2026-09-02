---
id: heap-core-concept-introduction
title: Heap and Priority Queue Core Concept
module: heap
pattern_label: Heap / Priority Queue
complexity_label: O(log n) / O(n)
estimated_minutes: 15
exit_criteria:
  - 能說明 min-heap 與 max-heap 性質的差異。
---
## Concept

Heap 是一棵帶有兩條額外約束的二元樹。第一條是形狀約束：它必須是完全二元樹（Complete Binary Tree）——除了最後一層，每一層都填滿；最後一層的節點由左往右連續排列，中間不留空位。第二條是順序約束，稱為 heap property：Min-Heap 要求每個 parent 的值小於或等於它的每個 child；Max-Heap 則要求每個 parent 大於或等於每個 child。兩者只差比較方向，之後的所有討論以 Min-Heap 為主，Max-Heap 把不等號反過來即可。注意這條約束只寫在「parent 與 child」之間：它沒有規定左 child 與右 child 誰大，也沒有規定不同子樹之間的關係。但這個局部規則會沿著路徑累積成一個全域結論：從 root 走到任一節點的路徑上，值一路不減，所以 root 一定小於或等於樹裡每一個節點——最小值永遠在 root。這就是 heap 的全部承諾：**隨時知道最值在哪，其餘元素只維持「夠用」的部分順序**。Priority Queue 則是抽象資料型態：一般 queue 依進入順序出隊（FIFO），Priority Queue 依優先權出隊，每次取出的都是目前最小（或最大）的元素；heap 是它最常見的實作，兩者不是同一層的概念。

## Thinking

理解 heap 的關鍵是把「為什麼要弱化順序」想清楚。假設需求是：資料持續進來，而你隨時要拿到目前的最小值。用排序陣列，讀最小值是 O(1)，但每次插入要把後面的元素整批往後挪，是 O(n)。用平衡的 Binary Search Tree，插入是 O(log n)，可是 BST 維持的是「左子樹 < 節點 < 右子樹」這條強得多的全域順序，為了在插入後保住它，得靠旋轉等平衡機制，實作複雜。Heap 走的是折衷路線：只要求每條 root 到 leaf 的路徑上單調，路徑之間互不約束。約束弱，代表插入或取出後要修復的範圍小——新元素放進最後一層的第一個空位，只需沿著它往上的那一條路徑修復；取出 root 時把最後一個元素搬到 root，只需沿著往下的一條路徑修復。每次修復只走一條路徑，而完全二元樹的高度是 floor(log2 n)，所以兩種操作都是 O(log n)。這裡形狀約束是配角卻不可少：如果允許樹退化成一條鏈，高度會變成 n，同一套操作就退化成 O(n)。反過來看代價：heap 放棄了「找任意元素」的能力，因為除了 root 之外，任何值都可能落在任何子樹裡，沒有東西幫你剪枝。至於這棵完全二元樹為何不需要指標、能直接塞進一條陣列，是明天的主題。

## Pattern Recognition

觸發訊號是「動態」加「最值」同時出現：元素會持續加入或移除，而每一步都要問「現在最小（大）的是誰」——例如不斷合併多個已排序來源時挑出下一個最小值、串流資料裡維持目前的前 K 大、按優先權排程工作。若資料是靜態的、只問一次最小值，掃一遍 O(n) 就好，不需要 heap；若問題是「某個特定值在不在」，heap 幫不上忙，該用 hash table 或 BST。分辨 Min-Heap 與 Max-Heap 的方法是看每次想丟掉誰：維持前 K 大時每次淘汰的是目前最小者，所以用 Min-Heap；反之用 Max-Heap。

## Common Mistakes

以下用同一棵 Min-Heap 舉反例：root 是 1，它的 child 是 5 與 2；5 底下是 9 與 7；2 底下是 3。逐層由左至右寫出來是 `[1, 5, 2, 9, 7, 3]`。第一，以為 heap 是排序好的陣列：這串序列裡 5 排在 2 前面，對它做二分搜尋找 3，會先看中間的 2 判定往右、看 7 判定往左、看 9 判定往左，區間用盡後回報「不存在」——但 3 明明在裡面。第二，以為左 child 一定小於右 child：同一棵樹裡左 child 是 5、右 child 是 2，heap property 只約束祖先與後代，兄弟之間沒有任何順序。第三，以為 heap 能像 BST 一樣 O(log n) 找任意值：對 Min-Heap `[1, 2, 3, 7, 5, 4, 6]`（root 1；child 2 與 3；2 底下 7 與 5；3 底下 4 與 6）找 6，root 的兩個 child 都小於 6，兩邊子樹都可能藏著它，四個 leaf 之間又毫無順序，最壞要把 leaf 全部看過，是 O(n)。第四，把 Priority Queue 當一般 queue：依序放入 5、1、4，一般 queue 先出 5，Priority Queue 先出 1。第五，弄錯語言內建結構的方向：Python 的 `heapq` 只提供 Min-Heap，放入 5 與 10 後 `heappop` 得到的是 5，想要 Max-Heap 得把值取負再放入。

## Complexity

peek（讀 root）為 O(1)；插入與取出最值皆為 O(log n)，因為只沿一條長度不超過 floor(log2 n) 的路徑修復。把 n 個無序元素一次建成 heap 可做到 O(n)，後續課程會證明。查找任意值為 O(n)，heap 對此沒有優勢。空間為 O(n)，只存元素本身，不需額外指標。

## Digest

Heap 是一棵完全二元樹，額外滿足 heap property：Min-Heap 要求每個 parent 小於或等於它的每個 child，Max-Heap 則相反。這條規則只約束 parent 與 child，不約束兄弟或不同子樹，但沿著任一條路徑累積起來就保證 root 是全樹最值。它刻意比排序陣列與 BST 維持更弱的順序，換來插入與取出最值都只需修復一條路徑，長度不超過 floor(log2 n)，所以是 O(log n)；代價是找任意值退回 O(n)。Priority Queue 是「依優先權出隊」的抽象型態，heap 是它的標準實作；一般 queue 依進入順序出隊，兩者不可混用。看到「資料動態變動、隨時要最值」就是 heap 的場景。

## TypeScript Tip

TypeScript 沒有內建 heap，先把 heap property 寫成判定函式：每個節點的兩個 child 都不小於自己，再遞迴檢查子樹；測資覆蓋含重複值的合法樹、深層違規、右 child 違規。

```typescript
class Node {
  constructor(public val: number, public left: Node | null = null, public right: Node | null = null) {}
}
function isMinHeap(n: Node | null): boolean {
  if (n === null) return true;
  for (const c of [n.left, n.right]) if (c !== null && c.val < n.val) return false;
  return isMinHeap(n.left) && isMinHeap(n.right);
}
const ok = new Node(1, new Node(5, new Node(9), new Node(7)), new Node(2, new Node(2)));
if (!isMinHeap(ok)) throw new Error("valid rejected");
if (isMinHeap(new Node(1, new Node(5, new Node(4)), new Node(2)))) throw new Error("deep miss");
if (isMinHeap(new Node(1, new Node(2), new Node(0)))) throw new Error("right miss");
```

## Python Tip

用 `deque` 與 `heapq` 對照一般 queue 與 Priority Queue：同樣依序放入，前者依進入順序出隊，後者永遠先出最小值。`heapq` 底下的 list 只保證 `pq[0]` 是最小值，list 本身並未排序，逐次 `heappop` 才會得到排序結果。

```python
from collections import deque
from heapq import heappush, heappop

fifo, pq = deque(), []
for x in [5, 1, 4, 2, 3]:
    fifo.append(x)
    heappush(pq, x)
assert fifo.popleft() == 5, "queue follows insertion order"
assert pq[0] == 1 and pq != sorted(pq), "root is min, list is not sorted"
assert [heappop(pq) for _ in range(5)] == [1, 2, 3, 4, 5], "pops come out sorted"
```

## Takeaway

Heap 只約束 parent 與 child 的順序，沿路徑累積保證 root 是最值；形狀完全、高度 log n，插入取出皆 O(log n)。

## Tomorrow Preview

明天進入 Array Representation of Binary Heap：完全二元樹的形狀讓它不需要任何指標，只靠索引運算就能找到 parent 與 child，把整棵樹放進一維陣列。

## Today's Challenge

本篇為觀念課，沒有對應的 LeetCode 練習題。請在紙上畫出 `[1, 5, 2, 9, 7, 3]` 那棵 Min-Heap，再用同樣六個數字依 Max-Heap 的規則重新填一棵，確認自己說得出兩者只差在不等號方向。
