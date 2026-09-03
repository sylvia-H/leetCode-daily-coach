---
id: queue-bfs-level-order-traversal
title: Queue BFS Level Order Traversal
module: queue
pattern_label: Breadth-First Search
complexity_label: O(n) / O(n)
estimated_minutes: 20
exit_criteria:
  - 能利用佇列長度快照逐層處理節點。
  - 能把子節點存入佇列，供後續層使用。
---
## Concept

前面幾課我們把佇列（Queue）當成獨立的資料結構來認識，這一課它第一次真正上場工作：驅動 Breadth-First Search（BFS），把一棵樹一層一層走完。

先自足地定義本課用到的結構：二元樹（binary tree）由節點（node）組成，每個節點帶一個值，以及 left、right 兩個指標，各自指向左、右子節點（可能為空）；整棵樹從唯一的根節點（root）出發。所謂「第 k 層」，就是距離根節點恰好 k 條邊的所有節點——根在第 0 層，它的子節點在第 1 層，依此類推。

BFS 的做法：把根節點放進佇列，之後重複「從隊首取出一個節點、處理它、把它的非空子節點依序放進隊尾」，直到佇列清空。它為什麼保證「淺的先於深的」？關鍵是一條迴圈不變式：任一時刻，佇列裡的節點依「距根距離」由小到大排列，且最大與最小距離相差不超過 1。初始只有根（距離 0），成立；之後每次取出距離 d 的節點，放入的是距離 d+1 的子節點，它們接在既有節點之後，排序性不被破壞。FIFO 因此讓較淺、較早被發現的節點永遠先被處理，這正是層序（level order）成立的根據。

## Thinking

單純的 BFS 只保證「淺的先出」，但許多題目要求把每一層明確分組，這需要多一個動作：層長快照（size snapshot）。在處理每一層之前，先把當下的佇列長度記成 size，內層迴圈恰好跑 size 次。

為什麼這樣就能切乾淨？把不變式收緊一階：外層迴圈每次開始時，佇列裡恰好是某一層的全部節點，不多也不少。第一輪只有根節點，成立。歸納地看：若進入外層時佇列恰為第 k 層全體，內層取出這 size 個節點的過程中，只會放入它們的子節點——也就是第 k+1 層的全體；跑滿 size 次後，第 k 層全數出隊，佇列剩下的恰好是第 k+1 層。於是每輪外層迴圈對應一層，取出的 size 個節點就是該層成員，分組自然正確。

這個技巧也順手解了「樹的最大深度」：不必記錄節點值，只在每輪外層迴圈結束時把深度計數加一，佇列清空時的計數就是層數。

## Pattern Recognition

看到這些訊號就該想到 Queue BFS：要求逐層輸出（每層一個子陣列）、要對每一層做聚合（每層平均值、每層最右邊的節點）、求樹的最大或最小深度，或問「最少幾步能到達」這類無權圖最短距離問題。反過來說，若題目關心的是一條從根到葉的完整路徑（路徑總和、回溯枚舉），深入單一分支的 DFS 通常更貼合。

## Common Mistakes

- 內層迴圈直接拿 queue.length（或 len(queue)）當終止條件：有子節點入隊時長度成長，下一層節點被混進當前層；反之整層都是葉節點時長度縮短，該層又會被硬拆成兩輪——病灶是終止判斷被自己的副作用污染，不是單一方向的多或少。
- 忘了空樹：root 為空仍直接入隊，取出後存取 val 就會出錯；入口先判空、回傳空結果。
- 把空子節點也塞進佇列：之後每次取出都得再判一次空，容易漏判；在入隊前檢查「非空才入隊」最省事。
- JavaScript 陣列的 shift() 是 O(n) 操作，整趟走訪最壞退化到 O(n^2)；題目規模小可接受，但要知道替代方案——用讀取索引取代 shift，或每層換一個新陣列。

## Complexity

O(n) / O(n)。時間：每個節點恰好入隊一次、出隊一次，每次處理是常數工作量，n 為節點總數。空間：佇列同時最多裝著最寬的一層，每層都填滿的二元樹最底層約有 n/2 個節點，仍是 O(n) 等級。

## Digest

Queue BFS Level Order Traversal 用佇列的 FIFO 特性驅動逐層走訪：根節點入隊後，反覆「取出節點、把非空子節點放到隊尾」，佇列不變式保證淺層節點永遠先被處理。要把節點按層分組，就在每層開始前記下佇列長度 size 當快照，內層恰好處理 size 個節點——此刻佇列裡剛好是完整的一層，處理完後剩下的剛好是下一層。同一副骨架，收集節點值就是層序輸出，只數外層迴圈輪數就是最大深度，之後還會延伸成無權圖最短路徑。時間 O(n)、空間 O(n)。

## TypeScript Tip

`shift()` 回傳 `T | undefined`，快照保證非空，用 `!` 收斂。

```typescript
import { strict as assert } from "node:assert";

type N = { val: number; left?: N; right?: N };

function levelOrder(root?: N | null): number[][] {
  const out: number[][] = [], q: N[] = root ? [root] : [];
  while (q.length > 0) {
    const level: number[] = [];
    for (let size = q.length; size > 0; size--) {
      const node = q.shift()!; level.push(node.val);
      if (node.left) q.push(node.left);
      if (node.right) q.push(node.right);
    }
    out.push(level);
  }
  return out;
}

assert.deepEqual(levelOrder({ val: 1, left: { val: 2, left: { val: 4 } }, right: { val: 3 } }), [[1], [2, 3], [4]]);
assert.deepEqual(levelOrder(null), []);
```

## Python Tip

`range(len(q))` 建立時就把層長定格，等同快照；`popleft()` 是 O(1)，`list.pop(0)` 則是 O(n)。

```python
from collections import deque

class Node:
    def __init__(self, val: int, left: "Node | None" = None, right: "Node | None" = None):
        self.val, self.left, self.right = val, left, right

def level_order(root: "Node | None") -> list[list[int]]:
    out: list[list[int]] = []
    q = deque([root] if root else [])
    while q:
        level: list[int] = []
        for _ in range(len(q)):  # 層長快照
            node = q.popleft(); level.append(node.val)
            q.extend(c for c in (node.left, node.right) if c)
        out.append(level)
    return out

assert level_order(Node(1, Node(2, Node(4)), Node(3))) == [[1], [2, 3], [4]]
assert level_order(None) == []
```

## Takeaway

BFS 靠佇列 FIFO 讓淺層先出，層長快照讓每輪內層迴圈恰好處理完整的一層。

## Tomorrow Preview

明天把同一套「逐層向外擴散」從樹搬到無權圖：BFS 每擴一層距離加一，第一次抵達某個節點時，走過的步數就是最短距離。

## Today's Challenge

- **102** · 標準的層序分組輸出：每層要收成一個子陣列，正是「佇列 + 層長快照」的原型題。
  - Hint: 外層每輪先記下 size，內層恰好取出 size 個節點並收集其值，子節點入隊留給下一輪。
- **104** · 求最大深度不必記任何節點值，只要數外層迴圈跑了幾輪——每處理完一層，深度加一。
  - Hint: 佇列清空時的層數計數就是答案；root 為空時直接回傳 0。
