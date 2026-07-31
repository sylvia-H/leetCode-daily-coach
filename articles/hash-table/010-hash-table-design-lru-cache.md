---
id: hash-table-design-lru-cache
title: Hash Map with Doubly Linked List for O(1) Cache
module: hash-table
pattern_label: HashMap + Doubly Linked List
complexity_label: O(1) / O(n)
estimated_minutes: 20
exit_criteria:
  - >-
    Can explain why a hash map alone is insufficient for LRU cache (needs
    ordering)
  - Can implement node relocation and eviction using a linked list
---
## Concept

Hash Map with Doubly Linked List for O(1) Cache 是一種結合雜湊表與雙向鏈結串列的進階資料結構設計模式。雜湊表提供 O(1) 時間複雜度的鍵值查找能力，而雙向鏈結串列則負責維護元素的相對順序（如最近最少使用原則）。透過將雜湊表的值指向鏈結串列中的節點，開發者能夠在常數時間內完成查找、插入、更新與刪除操作，是解決高效能快取設計問題的核心架構。

## Thinking

在設計需要 O(1) 時間複雜度進行 get 與 put 操作的快取時，單純使用陣列或雜湊表會面臨瓶頸：雜湊表無法有效率地維護元素的存取順序以供容量超載時進行淘汰；而雙向鏈結串列雖然可以在 O(1) 時間內完成節點的插拔，但搜尋特定鍵值卻需要 O(n) 的線性掃描。因此，必須將兩者結合，由雜湊表儲存鍵值到鏈結串列節點的參照指標，並由雙向鏈結串列維持資料的新舊排序，從而達成雙重優勢的互補。

## Pattern Recognition

當題目要求設計一個資料結構，其 get 與 put 操作皆須達到 O(1) 時間複雜度，且具備容量限制與特定的淘汰機制（例如 LRU 或 LFU）時，即可明確辨識出應採用 Hash Map with Doubly Linked List 的 Pattern。此 Pattern 的明顯特徵在於需要同時維護『快速鍵值對應』與『動態順序調整』兩種需求。

## Common Mistakes

最常見的錯誤在於更新快取時，僅修改了雜湊表或僅調整了鏈結串列的指標，導致兩者資料不同步。另一個常見失誤是忽略了邊界條件的處理，例如當快取為空、快取達到容量上限需要淘汰尾端節點，或是更新已經存在的鍵值時，未正確調整 head 與 tail 指標，進而引發記憶體區段錯誤或邏輯崩潰。

## Complexity

Time Complexity: get 和 put 操作均為 O(1)。Space Complexity: 需儲存所有快取項目，空間複雜度為 O(n)，其中 n 為快取的容量上限。

## Digest

Hash Map with Doubly Linked List 是解決高效能快取設計的核心 Pattern。透過雜湊表對應鍵值與鏈結串列節點的指標，實現 O(1) 時間複雜度的存取與更新。雙向鏈結串列的優勢在於已知節點參照時，插拔操作僅需 O(1)，非常適合用來維護元素的訪問順序，如 LRU Cache 與 LFU Cache 的容量淘汰策略。

## TypeScript Tip

```typescript
// TypeScript 提示：使用明確的介面與型別定義節點指標
class CacheNode {
  constructor(
    public key: number,
    public val: number,
    public prev: CacheNode | null = null,
    public next: CacheNode | null = null
  ) {}
}
const node = new CacheNode(1, 10);
if (node.val !== 10) throw new Error("assertion failed");
```

## Python Tip

```python
# Python 提示：善用虛擬頭尾節點（Dummy Head and Tail）簡化鏈結串列邊界判斷
class DummyNode:
    def __init__(self):
        self.prev = None
        self.next = None
node = DummyNode()
assert node.prev is None, "assertion failed"
```

## TypeScript Corner

```typescript
class Node {
  constructor(public key: number, public val: number, public prev: Node | null = null, public next: Node | null = null) {}
}
class LRUCache {
  private capacity: number;
  private map = new Map<number, Node>();
  private head: Node = new Node(0, 0);
  private tail: Node = new Node(0, 0);
  constructor(capacity: number) {
    this.capacity = capacity;
    this.head.next = this.tail;
    this.tail.prev = this.head;
  }
  public get(key: number): number {
    if (!this.map.has(key)) return -1;
    const node = this.map.get(key)!;
    this.remove(node);
    this.insert(node);
    return node.val;
  }
  public put(key: number, value: number): void {
    if (this.map.has(key)) {
      this.remove(this.map.get(key)!);
    }
    if (this.map.size >= this.capacity) {
      this.remove(this.tail.prev!);
    }
    const newNode = new Node(key, value);
    this.insert(newNode);
  }
  private remove(node: Node): void {
    this.map.delete(node.key);
    node.prev!.next = node.next;
    node.next!.prev = node.prev;
  }
  private insert(node: Node): void {
    this.map.set(node.key, node);
    node.next = this.head.next;
    node.prev = this.head;
    this.head.next!.prev = node;
    this.head.next = node;
  }
}
const cache = new LRUCache(2);
cache.put(1, 1);
cache.put(2, 2);
if (cache.get(1) !== 1) throw new Error("assertion failed");
```

## Python Corner

```python
class Node:
    def __init__(self, key: int, val: int):
        self.key = key
        self.val = val
        self.prev = None
        self.next = None
class LRUCache:
    def __init__(self, capacity: int):
        self.capacity = capacity
        self.map = {}
        self.head = Node(0, 0)
        self.tail = Node(0, 0)
        self.head.next = self.tail
        self.tail.prev = self.head
    def get(self, key: int) -> int:
        if key not in self.map:
            return -1
        node = self.map[key]
        self._remove(node)
        self._insert(node)
        return node.val
    def put(self, key: int, value: int) -> int:
        if key in self.map:
            self._remove(self.map[key])
        if len(self.map) >= self.capacity:
            self._remove(self.tail.prev)
        new_node = Node(key, value)
        self._insert(new_node)
    def _remove(self, node):
        del self.map[node.key]
        node.prev.next = node.next
        node.next.prev = node.prev
    def _insert(self, node):
        self.map[node.key] = node
        node.next = self.head.next
        node.prev = self.head
        self.head.next.prev = node
        self.head.next = node
cache = LRUCache(2)
cache.put(1, 1)
cache.put(2, 2)
assert cache.get(1) == 1, "assertion failed"
```

## Takeaway

結合 Hash Map 與 Doubly Linked List 可完美實現 O(1) 快取，關鍵在於同步維護雜湊對應與鏈結串列的指標。

## Tomorrow Preview

明天將探討 Heap 與 Priority Queue 的應用，學習如何有效率地處理動態排序與最值尋找問題。

## Today's Challenge

- **146** · LRU Cache 需要在 O(1) 時間內完成資料的查找、更新以及容量超載時的最近最少使用淘汰，完全符合 Hash Map 與雙向鏈結串列結合的設計模式。
  - Hint: 使用虛擬頭尾節點來避免邊界條件的額外檢查。
- **460** · LFU Cache 進一步擴充了 LRU 的概念，需要依據存取頻率進行分層維護，透過多個雙向鏈結串列與雜湊表的結合來達到 O(1) 的頻率更新與淘汰操作。
  - Hint: 除了記錄鍵值到節點的對應外，還需額外維護頻率到雙向鏈結串列的對應關係。
