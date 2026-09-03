---
id: queue-array-implementation
title: Queue Array Implementation
module: queue
pattern_label: FIFO Queue
complexity_label: O(n) / O(n)
estimated_minutes: 15
exit_criteria:
  - 能用陣列寫出基本的佇列 class。
  - 能說明為何在一般陣列上 shift() 或 pop(0) 的時間複雜度是 O(n)。
---
## Concept

用動態陣列實作 Queue，是最直接、零依賴的做法：陣列尾端天然對應佇列尾端，push 或 append 就是 enqueue；陣列開頭對應佇列前端，移除索引 0 的元素就是 dequeue。它完全正確地實作了 FIFO 語意——問題不在正確性，而在成本。陣列的本質是一段連續記憶體，「第 i 個元素就放在第 i 格」正是它 O(1) 隨機存取的來源；但同一個性質也決定了：移除索引 0 之後，若要讓索引 0 繼續代表前端，後方每一個元素都必須往前搬一格。這不是某個語言實作得懶，而是連續記憶體的必然——JavaScript 的 shift() 與 Python 的 list.pop(0) 都因此是 O(n)。

## Thinking

動手前先想清楚兩種操作的成本來源。enqueue 在尾端：多數時候尾端仍有預留容量，直接寫入即可；偶爾容量用盡需要擴容搬遷，但把這筆成本分攤到先前的多次寫入上，每次仍是均攤 O(1)。dequeue 在前端則出現設計分歧。做法一：每次移除都把後方元素整批前移，維持「索引 0 就是前端」的不變式，代價是每次 O(n)。做法二：不搬移，改為維護一個 head 索引指向目前前端，dequeue 只是把 head 加一——時間降回 O(1)，但被跳過的前段格子再也不會被使用，記憶體占用只增不減。兩種做法都「對」，差別在於你用時間換空間，還是用空間換時間；認清這個權衡，才能理解後續實作要解決的到底是什麼。

## Pattern Recognition

什麼時候會用上陣列版佇列？一、環境受限：白板面試或一次性的小工具，不想匯入專用容器、資料量又小，O(n) 搬移根本感覺不到。二、教學與底層理解：它是體會「資料結構的成本來自記憶體行為」的最佳教材。同時要練反向辨識：只要在迴圈裡看到 shift() 或 pop(0)，就要立刻警覺——單次 O(n) 放進跑 n 次的迴圈，整體就是 O(n^2)，這是許多 BFS 寫法效能退化的元凶。

## Common Mistakes

第一個錯誤：以為所有陣列基本操作都是 O(1)。尾端快是因為不必搬移，前端慢是因為必須搬移——快慢由「有多少元素要跟著動」決定，不是由語法長短決定。第二個錯誤：採用 head 索引法卻忘了它的空間代價，長時間執行的程式會累積大量無法回收的閒置格子；務實的補救是當 head 超過某個比例（例如陣列長度的一半）時做一次整批壓縮，把搬移成本均攤掉。第三個錯誤：在 TypeScript 開啟 noUncheckedIndexedAccess 時忽略索引存取可能回傳 undefined——正確做法是先做邊界檢查再收斂型別，而不是假裝取值一定成功。

## Complexity

enqueue 為均攤 O(1)（偶發擴容分攤後）。dequeue 採搬移法為 O(n)；採 head 索引法為 O(1)，但閒置空間隨移除次數增加。空間複雜度為 O(n)；採 head 索引法且未壓縮時，這個 n 要算成曾進入佇列的元素數量。

## Digest

用動態陣列實作佇列完全正確，但成本藏在連續記憶體的本質裡：enqueue 靠預留容量達到均攤 O(1)；dequeue 卻因為「索引 0 必須是前端」而被迫整批搬移，單次 O(n)，放進迴圈就是 O(n^2)。改用 head 索引可把時間降回 O(1)，代價是前段閒置空間只增不減——時間與空間的交換沒有免費的午餐。本課帶你把兩種做法都想清楚，並動手實作其中效率較好的一種，看清 shift() 與 pop(0) 便宜語法背後的昂貴代價。

## TypeScript Tip

```typescript
import { strict as assert } from 'node:assert';

class ArrayQueue<T> {
  private items: T[] = [];
  private head = 0; // 指向目前前端，dequeue 不搬移元素

  enqueue(item: T): void { this.items.push(item); }

  dequeue(): T | undefined {
    if (this.head >= this.items.length) return undefined;
    const item = this.items[this.head]!; // 邊界已檢查，收斂型別
    this.head++;
    return item;
  }
}

const q = new ArrayQueue<number>();
q.enqueue(1);
q.enqueue(2);
assert.equal(q.dequeue(), 1); // O(1)：只前移 head，不搬移元素
assert.equal(q.dequeue(), 2);
assert.equal(q.dequeue(), undefined);
q.enqueue(3);
assert.equal(q.dequeue(), 3); // 清空後仍能續用：邊界檢查若寫成 > 會在此回傳 undefined
```

## Python Tip

```python
# list.pop(0) 是 O(n)：CPython 會把剩餘元素整批往前搬
queue = [1, 2, 3]
assert queue.pop(0) == 1
assert queue == [2, 3]  # 剩下的元素都被搬移過一格

# 實務上請改用 collections.deque：兩端操作皆為 O(1)
from collections import deque
dq = deque([1, 2, 3])
assert dq.popleft() == 1
assert list(dq) == [2, 3]
```

## Takeaway

陣列佇列的瓶頸在前端移除的整批搬移；看到迴圈裡的 shift() 或 pop(0)，先想想它是不是 O(n^2) 的源頭。

## Tomorrow Preview

明天進入 Queue Linked List Implementation：改用單向鏈結串列並同時維護 head 與 tail 指標，讓 enqueue 與 dequeue 都達到 O(1)，擺脫陣列搬移與閒置空間的兩難。

## Today's Challenge

本課沒有搭配的 LeetCode 練習題。請自己動手：用陣列寫一個佇列 class，先用搬移法、再改成 head 索引法，並在紙上畫出各自 dequeue 三次之後的陣列狀態——能畫出兩者的差異，你就真的懂了。
