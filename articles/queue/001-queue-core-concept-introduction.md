---
id: queue-core-concept-introduction
title: Queue Core Concept Introduction
module: queue
pattern_label: FIFO Queue
complexity_label: O(1) / O(n)
estimated_minutes: 10
exit_criteria:
  - 能在腦中追蹤 enqueue 與 dequeue 的操作過程。
  - 能理解為何佇列被用於保持順序的處理。
---
## Concept

Queue（佇列）是一種線性資料結構，遵循先進先出（First-In, First-Out，FIFO）原則：最早加入的元素，一定在所有較晚加入者之前被取出。它只開放兩個操作端點——新元素從尾端（rear / tail）加入，稱為 enqueue；元素從前端（front / head）離開，稱為 dequeue。把它想成排隊買票：先到的人排在前面、先被服務，後到的人只能接在隊伍最後，沒有人能插隊、也沒有人從中間被抽走。

這個「只能尾進、只能前出」的限制正是 Queue 的價值所在。因為兩種操作都不觸碰中間的元素，佇列內部的相對順序從頭到尾不會被改變。這是一條不變式（invariant）：任何時刻，佇列中元素的排列順序，恆等於它們到達的順序。有了這條不變式，「取出順序等於到達順序」就不是巧合，而是被結構本身保證的性質。

## Thinking

要在腦中追蹤 Queue 的運作，最好用的圖像是一根單向管道：資料從一端塞入、從另一端流出，管內的東西不會互相超車。可以用歸納法說服自己保序真的成立：空佇列顯然保序；每次 enqueue 只把最新到達的元素接在尾端——既有元素的先後關係完全不動，而新元素既排在最後、也確實是最晚到的，兩邊都對得上；每次 dequeue 只拿走前端那一個，剩餘元素的先後關係同樣不動。既然每一步操作都維持保序，任意多步之後依然保序——不需要逐案檢查，結構本身就是證明。

反過來想也很有啟發：如果允許從中間插入或移除，這條不變式立刻被打破，結構就退化成一般的串列。所以 Queue 的「限制」不是缺陷，而是換取順序保證的代價。這是資料結構設計反覆出現的交易：放棄一部分操作自由，換得一個可以無條件依賴的性質。

## Pattern Recognition

看到下列訊號時，應該直覺聯想到 FIFO Queue。一、任務必須嚴格按照到達的先後順序處理，晚到的不能搶先：訂單處理、事件迴圈、列印工作排程。二、廣度優先搜尋（Breadth-First Search，BFS）：「先把這一層看完，才看下一層」，本質上就是把節點按發現順序排隊處理。三、生產者與消費者速度不一致，需要緩衝區暫存尚未處理的資料：訊息佇列、串流緩衝。三種場景的共同關鍵字都是「到達順序不可打亂」。

## Common Mistakes

最常見的錯誤是把 Queue 的 FIFO 和 Stack 的 LIFO（後進先出）搞混：兩者都只在端點操作，差別在取出端——Stack 從加入端取出（最晚進的先出），Queue 從加入端的另一端取出（最早進的先出）。選錯結構，處理順序會整個反過來。第二個是效能陷阱：用一般動態陣列直接模擬 Queue 時，從前端移除（如 JavaScript 的 shift()、Python 的 list.pop(0)）會迫使後方所有元素向前搬移，單次就是 O(n)；下一課會親手實作並剖析這個成本。第三個是對 Queue 做「插隊」式的中間插入或刪除——一旦這麼做，保序性質就失效了，等於根本沒有在用 Queue。

## Complexity

enqueue 在尾端加入，為 O(1)。dequeue 若使用合適的底層結構（如鏈結串列或 deque）亦為 O(1)；若用一般陣列從前端移除，則劣化為 O(n)。空間複雜度為 O(n)，n 為佇列中的元素數量。

## Digest

Queue 是遵循 FIFO 的線性結構：元素從尾端 enqueue、從前端 dequeue，兩種操作都不觸碰中間元素，因此「取出順序等於到達順序」是被結構保證的不變式，而不是巧合。本課用排隊與單向管道的圖像建立直覺，用歸納論證說明保序為何成立，並對照 Stack 的 LIFO 釐清兩者差異；同時預告效能地雷——用一般陣列的前端移除模擬 dequeue 是 O(n)。凡是「到達順序不可打亂」的場景：依序處理任務、BFS 層序走訪、生產者消費者緩衝，都是 Queue 的主場。

## TypeScript Tip

```typescript
import { strict as assert } from 'node:assert';

// 概念示範：push 對應 enqueue、shift 對應 dequeue。
// 注意：shift() 會搬移整個陣列，單次 O(n)，下一課深入這個成本。
const queue: number[] = [];
queue.push(10); // enqueue
queue.push(20);
queue.push(30);
assert.equal(queue.shift(), 10); // dequeue：最早進的最先出
assert.equal(queue.shift(), 20);
assert.deepEqual(queue, [30]);
```

## Python Tip

```python
from collections import deque

# collections.deque 是 Python 的標準佇列選擇：
# append 對應 enqueue、popleft 對應 dequeue，兩者皆 O(1)。
# list.pop(0) 語意相同，但代價是 O(n)。
queue = deque()
queue.append(10)  # enqueue
queue.append(20)
queue.append(30)
assert queue.popleft() == 10  # 最早進的最先出
assert queue.popleft() == 20
assert list(queue) == [30]
```

## Takeaway

Queue 只允許尾進前出，保序因此是結構保證的不變式；到達順序不可打亂的問題，就交給它。

## Tomorrow Preview

明天進入 Queue Array Implementation：親手用動態陣列實作佇列，實際看見從前端移除元素時整批搬移的 O(n) 成本，體會「能動」和「有效率」是兩回事。

## Today's Challenge

本課是純觀念課，沒有搭配的 LeetCode 練習題。請在腦中完整走一次：空佇列依序 enqueue 三個元素、再 dequeue 兩次，每一步都說出前端與尾端各是誰——能不看筆記講完，就達成今天的目標了。
