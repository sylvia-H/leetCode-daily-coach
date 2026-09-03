---
id: stack-using-queues
title: Implement Stack using Queues
module: queue
pattern_label: Queue-to-Stack Transformation
complexity_label: O(n) push / O(1) pop
estimated_minutes: 15
exit_criteria:
  - 能重排佇列元素，讓最新的元素保持在最前端。
  - 能分析「push 昂貴」與「pop 昂貴」兩種做法之間的時間取捨。
---
## Concept

Implement Stack using Queues 是昨天 queue-using-stacks 的鏡像題：手上只有支援尾端 enqueue、前端 dequeue 的 Queue（FIFO），要做出 LIFO 的 Stack。但兩題的成本結構並不對稱——把 Stack 倒進另一個 Stack，順序會倒轉；把 Queue 倒進另一個 Queue，先進的還是先出，順序原封不動，「倒轉」這招在 Queue 上完全失效。我們只能改用「旋轉」：每次 push 新元素後，把它前面的舊元素逐一從前端取出、接回尾端，硬是把新元素轉到隊首。如此 pop 與 top 都能直接讀隊首，代價是 push 變成 O(n)，而且這個 O(n) 無法靠攤銷（amortized，又稱均攤）攤平。

## Thinking

單一 Queue 的 push 昂貴（costly push）做法：設 push 前佇列已有 k 個元素，先把新元素 enqueue 到尾端，再重複 k 次「從前端 dequeue 一個、enqueue 回尾端」。不變式（invariant）：每次 push 完成後，佇列從前到後恰好是「由新到舊」的 LIFO 順序。歸納論證：push 前若已滿足不變式，新元素接在尾端後，前面 k 個元素依序旋轉到它後面；旋轉不改變這 k 個元素的相對順序，它們仍由新到舊，而新元素成為隊首——不變式保持。於是 pop＝dequeue、top＝讀隊首，都是 O(1)。為什麼攤銷救不了 push：連續 n 次 push 的旋轉總成本是 0+1+…+(n-1)，即 O(n^2)，攤到每次仍是 O(n)。對照昨天：雙 Stack 裡每個元素一生最多被搬移一次；這裡的舊元素卻在往後每一次 push 都被再旋轉一輪，成本重複累積，這就是兩題複雜度分道揚鑣的根本原因。

## Pattern Recognition

辨識線索：介面被限制成只能用 Queue 的標準操作（尾端進、前端出），卻要求 LIFO 行為；或需要「讓最新元素隨時待在可讀取的那一端」。設計決策在於把 O(n) 放在哪一邊：push 昂貴讓 pop 與 top 都是 O(1)，適合讀多寫少；pop 昂貴（push 為 O(1)，pop 時用輔助 Queue 把前 k 個搬走、取出最後一個）適合寫多讀少。判別法與昨天一致：先問「這個容器倒進另一個自己，順序會不會倒轉」——會，就有機會攤銷；不會，就只能逐次旋轉、乖乖付線性成本。

## Common Mistakes

第一：旋轉圈數算錯。該轉的是「新元素之前」的 k 個舊元素；若誤以 push 後的長度 k+1 來轉，新元素會被多轉一圈送回尾端。另一種寫壞法是 `while (佇列非空) { 取出前端、接回尾端 }`——旋轉不改變長度，條件永遠成立、迴圈不會結束；正確寫法是把圈數釘死在 push 前的 k。第二：搞混方向——旋轉是「前端取出、接回尾端」；若改用 deque 的 appendleft 直接把新元素插到前端，等於動用雙端佇列的能力，違反題目只允許標準 Queue 介面的限制。第三：以為改用兩個 Queue 能改善漸進複雜度——雙 Queue 只是把搬移成本從 push 挪到 pop（或反向），在這兩種標準做法下總有一個操作是 O(n)，與昨天雙 Stack 的攤銷 O(1) 本質不同。第四：pop 昂貴版在搬移時忘了留下最後一個元素，把整條佇列都搬走，pop 反而取不到目標。

## Complexity

push 昂貴版：push 為 O(n)（旋轉先前全部元素），pop、top、empty 為 O(1)；且這個 O(n) 是每次 push 都實付的成本，攤銷後仍是 O(n)。pop 昂貴版則相反：push 為 O(1)、pop 為 O(n)。空間複雜度 O(n)；單 Queue 版只用一個容器，雙 Queue 版多維護一個暫時的輔助容器。

## Digest

用 Queue 模擬 Stack 靠的是旋轉：push 新元素後，把它前面的 k 個舊元素逐一從前端取出、接回尾端，新元素便站上隊首；佇列從此保持由新到舊，pop 與 top 直接讀隊首即 O(1)。與雙 Stack 模擬 Queue 不同——Queue 倒進 Queue 順序不變、借不到倒轉的力，舊元素在每次 push 都要重轉一輪，成本重複累積，攤銷後 push 仍是 O(n)。另一路線是 pop 昂貴：push O(1)，pop 時搬移到只剩最後一個再取出。兩種取捨依讀寫頻率選邊。

## TypeScript Tip

用 `number[]` 模擬 Queue 時，`shift` 對應 dequeue。注意 `shift` 本身就是 O(n)（後面元素整段前移），教學實作可接受，正式環境應換成真正的 Queue 結構。

```typescript
class MyStack {
  private q: number[] = [];
  push(x: number): void {
    this.q.push(x);
    for (let i = 0; i < this.q.length - 1; i++) this.q.push(this.q.shift()!);
  }
  pop(): number {
    const v = this.q.shift();
    if (v === undefined) throw new Error("empty stack");
    return v;
  }
}
const s = new MyStack();
s.push(1); s.push(2); s.push(3);
if (s.pop() !== 3 || s.pop() !== 2) throw new Error("assertion failed");
s.push(4);
if (s.pop() !== 4 || s.pop() !== 1) throw new Error("assertion failed");
```

## Python Tip

`collections.deque` 的 `append` 與 `popleft` 都是 O(1)，是標準 Queue 的正確替身；旋轉時只用這兩個方法，別碰 `appendleft`——那已超出題目允許的介面。

```python
from collections import deque

class MyStack:
    def __init__(self) -> None:
        self.q: deque[int] = deque()

    def push(self, x: int) -> None:
        self.q.append(x)
        for _ in range(len(self.q) - 1):
            self.q.append(self.q.popleft())

    def pop(self) -> int:
        return self.q.popleft()

s = MyStack()
s.push(1); s.push(2); s.push(3)
assert s.pop() == 3 and s.pop() == 2, "assertion failed"
s.push(4)
assert s.pop() == 4 and s.pop() == 1, "assertion failed"
```

## Takeaway

Queue 倒進 Queue 不會倒轉順序，只能在 push 時旋轉出 LIFO：用 O(n) 換 pop 的 O(1)。

## Tomorrow Preview

明天佇列將回到它最重要的舞台：Queue BFS Level Order Traversal（queue-bfs-level-order-traversal）。我們會用佇列實作 Breadth-First Search，以「佇列長度快照」逐層走訪二元樹的節點，一次處理完整的一層。

## Today's Challenge

- **225** · 本題是旋轉技巧的原型：介面被限制成只能用 Queue 的標準操作，卻要交出 push、pop、top、empty 的 LIFO 行為；push 昂貴與 pop 昂貴的取捨正是題目的討論核心。
  - Hint: push 新元素後，把它前面原有的 k 個元素依序 dequeue 再 enqueue 回尾端。
