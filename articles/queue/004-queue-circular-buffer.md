---
id: queue-circular-buffer
title: Queue Circular Buffer
module: queue
pattern_label: FIFO Queue
complexity_label: O(1) / O(n)
estimated_minutes: 20
exit_criteria:
  - 能用模數運算讓陣列索引繞回開頭。
  - 能區分 circular buffer 的滿與空兩種狀態。
---
## Concept

Circular buffer（環狀緩衝區）是用固定大小的陣列實作 FIFO queue 的方法。用一般陣列裝 queue 有個兩難：dequeue 時把後面元素整批往前搬是 O(n)；改成只把 head 往後移，出隊過的格子又永遠閒置，佔用空間一路向右增長。環狀緩衝區的解法是把陣列想成頭尾相接的圓環——索引推進用 `(index + 1) % capacity`，走到最後一格自動繞回 0，出隊釋放的格子被後續入隊重複使用。代價是容量固定：建立時一次配好 capacity 格，之後不再配置記憶體，所有操作都是 O(1)。

## Thinking

維護三個狀態：head 指向隊首元素、tail 指向下一個寫入位置、size 記錄目前元素數。先定好不變式再動手：任何時刻，佇列內容就是從 head 出發沿環走 size 步經過的格子。enqueue 先檢查 `size == capacity`（滿則拒絕），把值寫進 tail 格後 `tail = (tail + 1) % capacity`、size 加一；dequeue 先檢查 `size == 0`（空則拒絕），讀出 head 格後 `head = (head + 1) % capacity`、size 減一。

模數映射為何是對的？把入隊次數看成不斷遞增的邏輯序號，第 k 次寫入落在實體格 `k % capacity`——相隔 capacity 次的兩次寫入才會落在同一格，而滿載檢查保證環上同時存活的元素不超過 capacity 個，所以輪到同一格時，前一筆資料必然早已出隊，覆寫是安全的。

為什麼判空判滿需要額外資訊？空佇列時 `head == tail`；連續入隊 capacity 次後，tail 繞完一整圈也回到 head，`head == tail` 同樣成立。單看指標無法區分這兩種狀態，必須補上額外資訊才能區分：最常見的兩種是維護 size 計數器，或改用「犧牲一格」法——規定 tail 永遠不追上 head，`(tail + 1) % capacity == head` 即視為滿，此時 `head == tail` 只剩「空」一種意義，代價是實際只能裝 capacity - 1 個元素（另有維護 full 旗標等變體）。

## Pattern Recognition

題目訊號：要求設計固定最大容量的資料結構，enqueue、dequeue、front、rear 全部 O(1)，且不希望動態配置記憶體。反向訊號也要會讀：若容量無上界、資料量會持續成長，linked list 或動態陣列才是正解，硬套固定容量反而要處理擴容搬移。工程上凡是「資料像水流進出、流量有界、要求穩定延遲」的場景——網路封包緩衝、鍵盤輸入佇列、生產者-消費者之間的緩衝帶——都是這個 Pattern 的棲息地。

## Common Mistakes

一、只用 `head == tail` 判斷狀態：空與滿都會讓兩指標重合，不靠 size 計數器或犧牲一格區分，滿載時繼續入隊會直接覆蓋隊首資料。二、犧牲一格法的滿條件寫錯：正確式是 `(tail + 1) % capacity == head`，寫成 `tail == head - 1` 忘了取模，head 為 0 時判斷失效。三、取隊尾元素忘了負數繞回：rear 在 `(tail - 1 + capacity) % capacity`；TypeScript 的 `%` 對負數回傳負值（`-1 % 5` 是 `-1`），漏加 capacity 就會拿負數當索引，Python 的 `%` 結果取除數的號、除數為正時恆非負（`-1 % 5` 是 `4`），同一行式子兩種語言行為不同。四、混用 tail 慣例：tail 指「下一個寫入位置」與指「最後一個元素」是兩套不變式，判滿與取 rear 的式子都不一樣，寫到一半換慣例是 off-by-one 的溫床。

## Complexity

enqueue、dequeue、front、rear、isEmpty、isFull 每個操作都只做常數次的比較、模數運算與索引存取，時間複雜度 O(1)。空間複雜度 O(n)，n 為建立時固定配置的 capacity，與實際存放的元素多寡無關。

## Digest

Circular buffer：固定大小陣列 + head 與 tail 指標 + 模數運算實作 FIFO queue。索引推進一律 `(i + 1) % capacity`，走到底自動繞回 0，出隊釋放的格子被重複使用，全部操作 O(1)、啟動後不再配置記憶體。唯一陷阱是判空判滿：空與滿時 head 與 tail 都重合，要嘛維護 size 計數器（`size == 0` 為空、`size == capacity` 為滿），要嘛犧牲一格（`(tail + 1) % capacity == head` 為滿）。以 capacity = 3 為例：入隊 1、2、3 後滿，tail 繞回 0 與 head 重合；出隊 1 再入隊 4，4 正好寫進剛釋放的格 0——這就是空間重複利用的全貌。

## TypeScript Tip

用 size 判空判滿最不易出錯；tail 可由 `(head + size) % cap` 導出，少一個要同步的變數。

```typescript
class CircularQueue {
  buf: number[]; head = 0; size = 0;
  constructor(public cap: number) { this.buf = new Array<number>(cap).fill(0); }
  enqueue(v: number): boolean {
    if (this.size === this.cap) return false;
    this.buf[(this.head + this.size) % this.cap] = v; this.size += 1; return true;
  }
  dequeue(): number {
    if (this.size === 0) return -1;
    const v = this.buf[this.head]!;
    this.head = (this.head + 1) % this.cap; this.size -= 1; return v;
  }
}
const q = new CircularQueue(3);
if (![1, 2, 3].every((v) => q.enqueue(v)) || q.enqueue(4)) throw new Error("x");
if (q.dequeue() !== 1 || !q.enqueue(4) || [q.dequeue(), q.dequeue(), q.dequeue()].join() !== "2,3,4") throw new Error("x");
```

## Python Tip

預先配置 `[0] * cap` 的固定 list 並以索引原地覆寫；`pop(0)` 是 O(n)，不要用它模擬出隊。

```python
class CircularQueue:
    def __init__(self, cap: int):
        self.buf = [0] * cap
        self.cap, self.head, self.size = cap, 0, 0

    def enqueue(self, v: int) -> bool:
        if self.size == self.cap:
            return False
        self.buf[(self.head + self.size) % self.cap] = v
        self.size += 1
        return True

    def dequeue(self) -> int:
        if self.size == 0:
            return -1
        v = self.buf[self.head]
        self.head = (self.head + 1) % self.cap
        self.size -= 1
        return v

q = CircularQueue(3)
assert all(q.enqueue(v) for v in (1, 2, 3)) and not q.enqueue(4)
assert q.dequeue() == 1 and q.enqueue(4), "wrap"
assert [q.dequeue() for _ in range(3)] == [2, 3, 4]
```

## Takeaway

索引推進用 `(i + 1) % capacity` 繞回開頭；空與滿時 head 與 tail 會撞在一起，靠 size 計數器或犧牲一格區分。

## Tomorrow Preview

明天探討 Implement Queue using Stacks：用兩個 LIFO 堆疊模擬 FIFO 行為，並用攤銷分析論證為何每個元素只被搬一次、每次操作仍是 amortized O(1)。

## Today's Challenge

- **622** · 原型題：設計固定容量的循環佇列，enQueue、deQueue、Front、Rear 全部 O(1)，判空判滿與模數繞回一次練齊。
  - Hint: 維護 size 計數器最不易出錯：size == 0 為空、size == capacity 為滿；Rear 的索引是 (head + size - 1) % capacity。
