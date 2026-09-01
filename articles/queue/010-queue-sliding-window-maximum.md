---
id: queue-sliding-window-maximum
title: Sliding Window Maximum with Monotonic Queue
module: queue
pattern_label: Monotonic Queue
complexity_label: O(n) / O(k)
estimated_minutes: 25
exit_criteria:
  - 能從佇列尾端移除比新進元素小的元素。
  - 能從佇列前端移除已滑出 Sliding Window 範圍的元素。
---
## Concept

在大小固定為 k 的滑動視窗中反覆求最大值，暴力解每滑動一步就重掃 k 個元素，總成本 `O(n * k)`。但視窗每次只有一個元素進、一個元素出，其餘 k - 1 個根本沒變，重掃是在浪費先前的資訊。Monotonic Queue（單調佇列）用一個雙端佇列（deque）保存這些資訊：佇列裡存的是「索引」而非數值，且對應數值由前到後遞減。如此一來前端永遠指向當前視窗的最大值，查詢降為 `O(1)`。維護只靠兩條規則：新元素入列前，先從尾端彈掉所有數值不大於它的索引；每一步再檢查前端索引是否已滑出視窗，是就從前端彈掉。

## Thinking

先把需求拆開：要 `O(1)` 查最大值、新元素從右邊進、過期元素從左邊出——同時需要兩端操作，這就是選 deque 而不是 Stack 或普通 Queue 的原因。

尾端彈出的正當性來自一個支配論證：設 j < i 且 `nums[j] <= nums[i]`。視窗右端只會向右推進，所以未來任何還涵蓋位置 j 的視窗必定也涵蓋位置 i；而 i 的值不小於 j，j 永遠當不上視窗最大值。丟掉 j 不會漏掉任何答案，這一步是安全的。

整個演算法可以用一條迴圈不變式收攏：處理完位置 i 之後，佇列由前到後索引遞增、數值遞減，內容恰好是「當前視窗內仍有機會成為某個視窗最大值的候選者」。被支配的從尾端消失、過期的從前端消失，剩下的前端自然就是視窗最大值。

邊界要算清楚：右端在 i 時視窗涵蓋 `[i - k + 1, i]`，因此前端索引只要 `<= i - k` 就已出界；從 `i >= k - 1` 起第一個完整視窗成形，此後每步記錄一次前端對應的數值。

## Pattern Recognition

訊號是「固定大小的區間 + 反覆查詢最大或最小值 + n 大到 `O(n * k)` 會超時」。它與 Monotonic Stack 系出同門：兩者都靠單調性提前淘汰不可能的候選，差別在 Next Greater Element 類問題只需單端操作，而滑動視窗多了「前端過期移除」的需求，所以升級成 deque。求視窗最小值則完全對稱——把單調方向反過來維護遞增佇列即可。

## Common Mistakes

最經典的錯誤是佇列存數值不存索引：過期與否是位置問題，數值不帶位置資訊，遇到重複值時連「前端是不是剛離開的那個」都無法分辨。第二是單調方向搞反：求最大值必須維護遞減佇列，若把尾端「較大者」彈掉，真正的最大值會在入列階段被清除，前端變成最小值。第三是過期條件 off-by-one：正確門檻是前端索引 `<= i - k`；寫成 `< i - k` 會讓剛出界的最大值多霸佔前端一步，多推一格則會誤刪仍合法的左端元素。第四，尾端彈出寫 `<` 或 `<=` 都正確（相等時舊元素已被新元素支配），差別只在佇列留不留重複值。最後是語言細節：JavaScript 陣列的 `shift()` 每次呼叫需搬移剩餘元素，宜改用一個只前進的 head 指標讀取前端。

## Complexity

時間複雜度 `O(n)`（均攤）：每個索引恰好入列一次、至多被彈出一次——不論從前端或尾端——操作總數不超過 2n。單步的 while 迴圈確實可能彈出接近整個佇列（例如一段遞減長跑後接一個大值），但這些成本早在先前各步「只進不彈」時就已付清。空間複雜度 `O(k)`：邏輯佇列（前端到尾端）中的索引全落在當前視窗內，長度不會超過 k。但注意 TS Tip 的 head 指標版底層陣列從不回收，實際持有 O(n) 個索引——這是用空間換掉 shift() 搬移成本的代價；Python 的 popleft 會真正釋出前端，才維持 O(k)。

## Digest

滑動視窗最大值的暴力解 `O(n * k)`，Monotonic Queue 壓到 `O(n)`。deque 存索引、對應值由前到後遞減：新元素入列前彈掉尾端所有不大於它的候選（它們已被支配，未來任何視窗都輪不到），前端索引 `<= i - k` 時彈出（已滑出視窗），前端永遠是當前視窗最大值。每個索引至多進出各一次，均攤 `O(1)`，空間 `O(k)`。

## TypeScript Tip

以只前進的 head 指標取代 `shift()`（後者每次需搬移剩餘元素），普通陣列即可充當 deque：

```typescript
function maxSlidingWindow(nums: number[], k: number): number[] {
  const q: number[] = []; // 存索引，對應值由前到後遞減
  let head = 0;
  const res: number[] = [];
  for (let i = 0; i < nums.length; i++) {
    while (q.length > head && nums[q[q.length - 1]!]! <= nums[i]!) q.pop();
    q.push(i);
    if (q[head]! <= i - k) head++; // 前端已滑出視窗
    if (i >= k - 1) res.push(nums[q[head]!]!);
  }
  return res;
}
if (maxSlidingWindow([1, 3, -1, -3, 5, 3, 6, 7], 3).join() !== "3,3,5,5,6,7")
  throw new Error("assertion failed");
if (maxSlidingWindow([9, 9, 7, 2, 4, 6, 8, 8, 6], 3).join() !== "9,9,7,6,8,8,8")
  throw new Error("assertion failed"); // 此組會真正觸發前端過期
```

## Python Tip

`collections.deque` 兩端的 append 與 pop 皆為 `O(1)`，是 Monotonic Queue 的天然容器：

```python
from collections import deque

def max_sliding_window(nums: list[int], k: int) -> list[int]:
    q: deque[int] = deque()  # 存索引，對應值由前到後遞減
    res = []
    for i, x in enumerate(nums):
        while q and nums[q[-1]] <= x:  # 尾端不大於新值者已被支配
            q.pop()
        q.append(i)
        if q[0] <= i - k:  # 前端已滑出視窗
            q.popleft()
        if i >= k - 1:
            res.append(nums[q[0]])
    return res

assert max_sliding_window([1, 3, -1, -3, 5, 3, 6, 7], 3) == [3, 3, 5, 5, 6, 7]
assert max_sliding_window([9, 9, 7, 2, 4, 6, 8, 8, 6], 3) == [9, 9, 7, 6, 8, 8, 8]
```

## Takeaway

Monotonic Queue 存索引、值遞減：尾端彈掉被支配者、前端彈掉過期者，前端恆為視窗最大值，均攤 `O(n)`。

## Tomorrow Preview

queue 模組到此收官——從 FIFO 基本操作、環形緩衝、雙 Stack 互實作，一路走到 BFS 層序遍歷、無權最短路徑與 Monotonic Queue，佇列的兩種身分「遍歷引擎」與「單調候選池」都已到手。明天起進入新的模組，用同樣的節奏繼續推進。

## Today's Challenge

- **239** · 固定大小視窗反覆求最大值的原型題，暴力解 `O(n * k)` 會超時，正是 Monotonic Queue 把查詢壓到均攤 `O(1)` 的展示場。
  - Hint: 佇列存索引且對應值遞減；新元素入列前彈掉尾端所有不大於它的元素，再檢查前端索引是否已 `<= i - k`。
