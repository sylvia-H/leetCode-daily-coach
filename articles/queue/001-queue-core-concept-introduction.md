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

Queue 是一種基礎的線性資料結構，其運作核心遵循先進先出（First-In, First-Out, FIFO）的原則。如同現實生活中的排隊買票，最先加入隊伍的人也是最先被服務的人。在 Queue 中，元素從尾端（Rear / Tail）加入，稱為 enqueue 操作；並從前端（Front / Head）離開，稱為 dequeue 操作。這種特性確保了資料處理的時序性，使得先到達的任務能夠優先被執行。

## Thinking

在思考 Queue 的運作時，可以將其視覺化為一根管道或是一個單向通道。資料從一端進入，依序在內部排隊，然後從另一端依序離開。在這個過程中，元素的相對順序保持不變。當我們需要處理具有時間先後順序、需要維持事件到達順序（Chronological Order）的場景時，直覺上就應該聯想到 Queue 資料結構。透過這種思考方式，我們可以明確地掌握資料進出的邊界與時機。

## Pattern Recognition

當題目或系統需求涉及以下特徵時，即可辨識出應採用 FIFO Queue Pattern：1. 資料處理順序必須嚴格按照到達的先後順序進行（Order-Preserving Processing）。2. 涉及到廣度優先搜尋（Breadth-First Search, BFS）的圖論或樹狀結構走訪。3. 需要緩衝或排隊處理非同步事件、訊息佇列（Message Queue）或請求處理。

## Common Mistakes

初學者最常見的錯誤是將 Queue 的 FIFO（先進先出）原則與 Stack 的 LIFO（後進先出）原則相混淆。另一個常見的效能錯誤是在使用一般陣列實作 Queue 時，從前端移除元素（例如 JavaScript 陣列的 shift() 運算）導致後方所有元素必須向前移動，造成 O(n) 的時間複雜度。在需要高效能的場景下，應避免直接使用會觸發記憶體搬移的基礎操作。

## Complexity

enqueue 操作的時間複雜度為 O(1)；dequeue 操作若使用適當的資料結構（如雙向鏈結串列或雙端佇列）亦可達到 O(1)。空間複雜度則為 O(n)，其中 n 為佇列中儲存的元素數量。

## Digest

Queue 核心觀念介紹：本篇深入探討 Queue 資料結構的基礎原理，聚焦於 FIFO（先進先出）原則。透過將資料流比擬為排隊等待的隊伍，學習元素如何從 rear 進入、從 front 離開。文中剖析了 FIFO 與 LIFO 的區別，指出了常規陣列運算在效能上的陷阱，並示範了 TypeScript 與 Python 的基礎實作方式，為後續的演算法應用打下穩固基礎。

## TypeScript Tip

```typescript
import { strict as assert } from 'node:assert';

// In TypeScript, using Array.shift() is O(n). For performance-critical code, consider a linked list or pointer-based queue.
const queue: number[] = [];
queue.push(10); // enqueue
queue.push(20);
const val = queue.shift(); // dequeue

assert.strictEqual(val, 10, "assertion failed");
```

## Python Tip

```python
from collections import deque

# In Python, always use collections.deque for Queue operations.
# List.pop(0) is O(n), whereas deque.popleft() is O(1).
queue = deque()
queue.append(10)  # enqueue
queue.append(20)
val = queue.popleft()  # dequeue

assert val == 10, "assertion failed"
```

## Takeaway

Queue 核心為 FIFO 原則，適用於時序性處理與 BFS，應注意避免使用 O(n) 的前端移除操作。

## Tomorrow Preview

明天我們將探討如何利用 Queue 實作廣度優先搜尋（BFS），並解決經典的圖論與樹狀結構走訪問題。

## Today's Challenge

本篇為觀念課，沒有對應的 LeetCode 練習題。請把時間花在把上面的觀念想透。
