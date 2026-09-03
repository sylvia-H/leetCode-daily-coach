---
id: stack-online-stock-span
title: Stack Online Stock Span
module: stack
pattern_label: Monotonic Stack with Accumulation
complexity_label: O(1) amortized
estimated_minutes: 20
exit_criteria:
  - '能在 Monotonic Stack 中儲存 (value, span) 的成對資料。'
  - 能有效率地累計連續較小元素的數量。
---
## Concept

先釘死 span 的定義：對今天的價格，從今天往前數，價格連續小於或等於今天的天數（含今天）就是今天的 span。Online 代表資料逐筆到達——每收到一筆價格就要立刻回答它的 span，而且看不到未來。若每次都向左回掃歷史陣列，單次查詢最壞 O(n)，n 筆資料合計 O(n^2)。Monotonic Stack with Accumulation 的解法：維護一個由底到頂價格嚴格遞減的堆疊，每個元素存 (price, span) 成對資料——price 是當時的價格，span 是它目前「代表」的天數。新價格進來時，把頂端所有小於或等於它的元素依序彈出，並把它們的 span 累加到自己身上，最後壓入 (price, 累計 span) 並回傳累計值。每筆價格最多進出堆疊各一次，均攤 O(1)。

## Thinking

先看暴力解浪費在哪：同一段連續較小的歷史，會被之後每一個更高的價格反覆回掃。要省掉重掃，關鍵是回答一個問題——價格 p 一旦被較大的新價格 q（p ≤ q）蓋過，未來還有誰需要它？分兩種情況論證。未來某天價格為 r：若 r ≥ q，回掃只要能走到 q（中間沒有更高的價格先擋住），因 p ≤ q ≤ r 也一定走得過 p，p 貢獻的整段天數都會被算進去——而這段天數已經累加在 q 的 span 裡，直接取用即可；若中途被更高的價格擋住，那連 q 都到不了，更走不到 p。若 r < q，回掃在 q 就停了，同樣永遠走不到 p。兩種情況 p 都不再需要以「價格」的身分被比較，需要留下的只有它代表的天數，所以彈出 p 時把 span 轉移給 q，資訊零遺失——這就是「彈出即丟棄」安全的正確性論證。由此得到迴圈不變式：每次 next 結束時，堆疊由底到頂價格嚴格遞減，且所有 span 的總和恰等於至今處理的總天數，每一天恰好被堆疊中的一個元素代表。以 100, 80, 60, 70, 60, 75, 85 為例：處理 75 時依序彈出 60（span 1）與 70（span 2），span = 1 + 1 + 2 = 4，堆疊剩 100、80，再壓入 (75, 4)。最後注意邊界：彈出條件必須是「小於或等於」，因為定義把等價的日子也算進連續天數；寫成嚴格小於，等價的那天會留在堆疊裡被漏算。

## Pattern Recognition

兩個訊號同時出現時優先考慮此 Pattern：一是查詢為 online、資料逐筆到達且要即時回答；二是問題可以改寫成「當前元素能往左吞併多長的連續區間」或「連續往前小於或等於當前值的個數」。對照 prerequisite：Daily Temperatures 的堆疊存 index，答案是距離，彈出時算索引差；Next Greater Element II 的堆疊存 value，答案是值本身，彈出代表候選被擋住、永久丟棄——兩者的堆疊元素都不攜帶需要合併的計數。本課的分歧點在於元素帶著權重（span），彈出時必須把權重轉移給吞併它的元素。凡是「被彈出者的某種計數必須併入彈出者」的題型，就是 Accumulation 變形。

## Common Mistakes

一、彈出時忘記累加被彈出者的 span：算出來的 span 只剩自己或相鄰一格，整段被吞併的歷史憑空消失。二、彈出條件寫成嚴格小於：等價的價格留在堆疊頂端，依定義本該計入的等價日被漏算。三、類別實作把堆疊宣告在 next 方法內部：每次呼叫都重建空堆疊，歷史全失，永遠回傳 1——堆疊必須在建構式初始化為實例屬性，跨呼叫保存。四、單調方向弄反：維護成遞增堆疊，較大的新價格進來時彈不出任何東西，吞併邏輯完全失效。

## Complexity

時間複雜度：單次 next 最壞可能彈出 O(n) 個元素，但每筆價格整個生命週期最多被壓入一次、彈出一次，n 次呼叫的總工作量為 O(n)，均攤每次 O(1)——這是最壞情況下的均攤保證，不是機率上的平均。空間複雜度：O(n)，價格嚴格遞減時沒有任何元素會被彈出，堆疊存下全部歷史。

## Digest

Online Stock Span 用單調遞減堆疊解決線上資料流的 span 查詢：堆疊儲存 (price, span) 成對資料，新價格彈出所有小於或等於它的元素並累加其 span，再壓入合併後的結果。彈出安全的理由：被蓋過的價格對未來查詢要嘛整段被吞併、要嘛根本掃不到，只需保留它代表的天數。每筆價格進出堆疊各至多一次，均攤 O(1)、空間 O(n)。實作上以類別把堆疊封裝為實例狀態，讓歷史跨呼叫延續；彈出條件含等號，等價日才不會漏算。

## TypeScript Tip

用 tuple 陣列存成對資料，`pop()` 的回傳值直接取 span 累加；`noUncheckedIndexedAccess` 下，已確認長度的索引與 `pop()` 用 `!` 收斂型別。

```typescript
import assert from "node:assert";

class StockSpanner {
  private stack: [price: number, span: number][] = [];

  next(price: number): number {
    let span = 1;
    while (
      this.stack.length > 0 &&
      this.stack[this.stack.length - 1]![0] <= price
    ) {
      span += this.stack.pop()![1];
    }
    this.stack.push([price, span]);
    return span;
  }
}

const s = new StockSpanner();
const spans = [100, 80, 60, 70, 60, 75, 85, 85].map((p) => s.next(p));
assert.deepStrictEqual(spans, [1, 1, 1, 2, 1, 4, 6, 7]);
```

## Python Tip

堆疊放 tuple，`while self.stack and self.stack[-1][0] <= price` 一行同時處理空堆疊與比較；狀態在 `__init__` 初始化，跨 `next` 呼叫保存。

```python
class StockSpanner:
    def __init__(self) -> None:
        self.stack: list[tuple[int, int]] = []  # (price, span)

    def next(self, price: int) -> int:
        span = 1
        while self.stack and self.stack[-1][0] <= price:
            span += self.stack.pop()[1]
        self.stack.append((price, span))
        return span

s = StockSpanner()
spans = [s.next(p) for p in [100, 80, 60, 70, 60, 75, 85, 85]]
assert spans == [1, 1, 1, 2, 1, 4, 6, 7], "span accumulation failed"
```

## Takeaway

彈出時把被吞併者的 span 轉移給吞併者，天數零遺失，均攤 O(1) 回答每筆線上 span 查詢。

## Tomorrow Preview

明天進入 Sum of Subarray Minimums：同樣是 monotonic stack，但改為替每個元素找出它作為最小值時能延伸的左右邊界，計算它對所有 subarray 的總貢獻——把「累計」從一維的天數推廣到區間計數。

## Today's Challenge

- **901** · 標準的線上 span 查詢：每天收到一個價格，立刻回答連續往前小於或等於它的天數，正是 (price, span) 成對累計的 Monotonic Stack with Accumulation 原型題。
  - Hint: 堆疊存 (price, span)；只要頂端價格小於或等於新價格就彈出並累加其 span，最後壓入合併後的成對資料並回傳 span。
