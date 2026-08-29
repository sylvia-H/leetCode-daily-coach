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

LRU Cache 要求三件事同時成立：get 以 O(1) 取值、put 以 O(1) 寫入、容量滿時以 O(1) 淘汰「最久未使用」的資料。單一資料結構做不到——Hash Map 查找是 O(1)，卻不記錄使用順序，找不出誰最久沒被用；鏈結串列能以 O(1) 拆接已知節點，卻要 O(n) 才能找到某個 key 對應的節點。解法是讓兩者互補：Hash Map 存 key 到串列節點的參照，負責「瞬間定位」；Doubly Linked List 依使用時間排列節點，頭端是最近使用、尾端是最久未使用，負責「維持順序」。每次存取都把節點搬到頭端，淘汰永遠發生在尾端，兩個 O(1) 拼出完整的 O(1) 快取。

必須用「雙向」串列的原因：把節點從串列中間拆下來，要同時改它前驅與後繼的指標；單向串列拿不到前驅，得從頭掃 O(n)，而雙向串列的節點自帶 prev 與 next，拆接只動四個指標。

## Thinking

先想清楚三條操作路徑。get(key)：查 Map，未命中回傳 -1；命中則透過參照拿到節點，把它從原位置拆下、接回頭端（讀取也算「使用」，必須刷新新鮮度），再回傳值。put(key, value) 且 key 已存在：更新節點的值並搬到頭端，容量不變、不觸發淘汰。put 且 key 不存在：建新節點接上頭端、寫入 Map；若超過容量，拆下尾端節點，並用該節點記錄的 key 回頭刪除 Map 中的對應項目——這正是節點必須同時存 key 與 value 的原因，否則淘汰時無從得知該刪 Map 裡的哪個鍵。

實作上建議放 dummy head 與 dummy tail 兩個哨兵節點：讓每個真實節點永遠有前後鄰居，插入與拆除就不必判斷「是否為頭尾」的特殊情況，空串列與單節點串列也走同一套邏輯。

## Pattern Recognition

題目同時出現「設計一個資料結構」、「get 與 put 皆須 O(1)」、「容量上限與淘汰策略」三個條件，即為此 Pattern。核心特徵是同時需要「快速鍵值定位」與「動態順序維護」兩種能力，而任何單一結構只能滿足其一。LFU 是同型延伸：以頻率分層，每個頻率各掛一條 Doubly Linked List，再用 minFreq 追蹤最低頻率層，同層內部仍以 LRU 決定淘汰對象。

## Common Mistakes

第一，兩個結構不同步：淘汰時只拆了串列節點、忘了刪 Map 項目，Map 就留下懸空參照，之後查同一個 key 會「命中」已淘汰的節點；反過來只刪 Map 不拆節點，串列則會越積越長。第二，節點只存 value 不存 key：淘汰尾端時無法反查 Map，該刪的鍵刪不掉。第三，get 忘了搬節點：讀取也是使用，不刷新順序會讓活躍資料被誤淘汰。第四，指標更新順序錯誤：拆接時應先把鄰居參照存好再改指標，順序一亂就會斷鏈或成環，之後的走訪會遺失節點或陷入無窮迴圈——JS 與 Python 不會因此當機，但邏輯已悄悄壞掉；這類錯誤用容量 1、重複 put 同一鍵這種邊界測試最容易抓出來。

## Complexity

時間複雜度：get 與 put 皆為 O(1)——Map 查找平均 O(1)，已知節點的拆除與插入只動固定數量的指標。空間複雜度 O(n)：Map 與串列各存一份節點參照，n 為快取的容量上限。

## Digest

LRU Cache 的答案是一對互補結構：Hash Map 存 key 到節點的參照，負責 O(1) 定位；Doubly Linked List 依使用順序排列節點，負責 O(1) 拆接與淘汰——頭端最新、尾端最舊，每次存取搬到頭端，容量滿時從尾端淘汰。三個關鍵細節：節點必須同時存 key 與 value（淘汰時要反查 Map 刪鍵）、get 命中也要搬節點（讀取算使用）、dummy 哨兵讓插拆免判邊界。兩個結構的每一步更新都必須同步，漏掉任一邊就會留下懸空參照或髒資料。

## TypeScript Tip

容量上限 2；dummy 哨兵讓插拆免判邊界，prev/next 以 this 自指避開 null 聯集。

```typescript
class N {
  prev: N = this;
  next: N = this;
  constructor(public key = 0, public val = 0) {}
}
const map = new Map<number, N>();
const head = new N(), tail = new N();
head.next = tail; tail.prev = head;
const cut = (n: N) => { n.prev.next = n.next; n.next.prev = n.prev; };
const push = (n: N) => { n.prev = head; n.next = head.next; head.next.prev = n; head.next = n; };
function put(key: number, val: number): void {
  const n = new N(key, val);
  map.set(key, n);
  push(n);
  if (map.size > 2) { const lru = tail.prev; cut(lru); map.delete(lru.key); }
}
put(1, 10); put(2, 20);
const hot = map.get(1);
if (hot) { cut(hot); push(hot); }
put(3, 30);
if (map.has(2) || !map.has(1)) throw new Error("assertion failed");
```

## Python Tip

拆接集中成 helper；tuple assignment 右側先求值，但 head.next 要在被改動前先讀到。

```python
class Node:
    def __init__(self, key=0, val=0):
        self.key, self.val = key, val
        self.prev = self.next = self

head, tail = Node(), Node()
head.next, tail.prev = tail, head

def remove(n):
    n.prev.next, n.next.prev = n.next, n.prev

def add_front(n):
    n.prev, n.next = head, head.next
    head.next.prev = n
    head.next = n

a, b = Node(1, 10), Node(2, 20)
add_front(a)
add_front(b)
remove(a)
add_front(a)
assert head.next.key == 1 and tail.prev.key == 2, "assertion failed"
```

## Takeaway

Hash Map 管 O(1) 定位、Doubly Linked List 管 O(1) 順序；節點要存 key、兩結構同步更新，快取才完整。

## Tomorrow Preview

hash-table 模組到此收官——從存在性檢查、頻率統計、前綴和一路走到 O(1) 快取設計，雜湊思維已是你的基本功。明天起展開全新的模組，用同樣的節奏繼續推進。

## Today's Challenge

- **146** · 設計題原型：get 與 put 皆須 O(1) 且容量滿時淘汰最久未使用者，Map 定位加雙向串列排序缺一不可。
  - Hint: 節點同時存 key 與 value，並用 dummy 哨兵讓插拆免判邊界。
- **460** · 把 LRU 升級為頻率淘汰：每個頻率各掛一條雙向串列，再以 minFreq 追蹤最低層，同層內仍按 LRU 排序。
  - Hint: 需要兩張 Map——key 到節點、頻率到串列——並在每次存取後正確維護 minFreq。
