---
id: stack-online-stock-span
title: Stack Online Stock Span
module: stack
pattern_label: Monotonic Stack with Accumulation
complexity_label: O(1) amortized
estimated_minutes: 20
exit_criteria:
  - 'Can store pairs of (value, span) in a monotonic stack.'
  - Can aggregate counts of consecutive smaller elements efficiently.
---
## Concept

Stack Online Stock Span 是利用 Monotonic Stack 解決連續小於或等於目前元素數量問題的典型架構。在處理即時資料流（Online Stream Queries）時，若每次查詢都需要向回遍歷歷史資料，時間複雜度將會退化。透過維護一個單調遞減的堆疊（Monotonic Decreasing Stack），我們能夠以 O(1) 的均攤時間複雜度（Amortized Time Complexity）高效率計算出每一筆資料的 span（即包含自身在內、連續小於或等於該值的最大連續天數）。這種架構的核心在於將先前元素的累積 span 與當前元素進行合併，省去重複掃描的時間。

## Thinking

當我們面對即時資料流（Online Stream）並需要查詢連續小於或等於當前值的元素個數時，直覺的做法是使用一個陣列儲存所有歷史數值，每來一個新數值就從當前位置向左逐一檢查。然而，這種暴力解法在最壞情況下的時間複雜度會達到 O(N) 每筆查詢，總體時間複雜度高達 O(N^2)。為了優化此過程，我們思考如何利用堆疊（Stack）來維護歷史資訊。當我們處理一個新價格時，所有小於或等於該價格的歷史價格，其 span 都可以被當前價格『吞併』並累積起來。因此，我們可以在堆疊中儲存二元組（Tuple）如 (price, span)。當新價格進來時，我們持續從堆疊頂部彈出小於或等於該價格的元素，並將其 span 累加到當前的 span 中，直到遇到大於該價格的元素或堆疊清空為止。最後，將合併後的 (price, totalSpan) 壓入堆疊中，並回傳 totalSpan。此過程確保每個元素最多被壓入與彈出堆疊一次，從而實現高效的均攤 O(1) 時間複雜度。

## Pattern Recognition

辨識此 Pattern 的關鍵線索在於題目要求『即時查詢（Online Queries）』且牽涉到『尋找連續小於或等於目前數值的歷史個數』或『計算包含當前元素的最大有效區間』。當問題可以轉化為『當前元素會終結或吞併哪些左側較小的元素』時，通常就是 Monotonic Stack with Accumulation 的最佳施展場景。與傳統的單調堆疊僅用來尋找下一個更大或更小元素（Next Greater/Smaller Element）不同，此處的堆疊元素必須攜帶累積的權重（Span），在彈出時將權重轉移給新進的元素，以維護歷史資料的累積效應。

## Common Mistakes

最常見的錯誤是在彈出較小元素時，忘記將其 span 累加到當前元素的總 span 當中，導致計算出的 span 僅包含當前元素本身與直接前一個元素，遺漏了被跨越的歷史區間。另一個常見錯誤是錯誤維護單調性，例如使用單調遞增堆疊（Monotonic Increasing Stack）而非單調遞減堆疊，導致無法正確吞併較小的歷史價格。此外，在實作類別（Class）時，若未能在物件的狀態中妥善保存堆疊，每次呼叫查詢方法時重新初始化堆疊，將會徹底破壞動態累積的歷史紀錄。

## Complexity

時間複雜度：每次 next 操作的均攤時間複雜度為 O(1)。雖然單次操作可能因為迴圈彈出多個元素而達到 O(N) 的最壞情況，但在整個資料流的生命週期中，每個元素最多被壓入堆疊一次、彈出一次，因此 N 次操作的總時間複雜度為 O(N)。空間複雜度：O(N)，在最壞情況下（例如價格持續遞減），堆疊需要儲存所有的歷史元素及其對應的 span。

## Digest

本篇探討使用 Monotonic Stack with Accumulation 解決線上股價跨度問題。核心在於維護一個單調遞減堆疊，儲存 (price, span) 二元組。當新價格進入時，彈出所有小於或等於該價格的歷史元素，並將其 span 進行累加，實現均攤 O(1) 的高效率查詢。TypeScript 與 Python 實作均透過類別封裝狀態，確保跨呼叫的資料連續性。

## TypeScript Tip

```typescript
class StockSpannerOptimized {
  private stack: number[] = [];
  private spans: number[] = [];

  next(price: number): number {
    let span = 1;
    while (
      this.stack.length > 0 &&
      this.stack[this.stack.length - 1] <= price
    ) {
      this.stack.pop();
      span += this.spans.pop()!;
    }
    this.stack.push(price);
    this.spans.push(span);
    return span;
  }
}

const opt = new StockSpannerOptimized();
if (opt.next(100) !== 1) throw new Error("assertion failed");
if (opt.next(80) !== 1) throw new Error("assertion failed");
```

## Python Tip

```python
class StockSpannerOptimized:
    def __init__(self):
        self.prices: list[int] = []
        self.spans: list[int] = []

    def next(self, price: int) -> int:
        span = 1
        while self.prices and self.prices[-1] <= price:
            self.prices.pop()
            span += self.spans.pop()
        self.prices.append(price)
        self.spans.append(span)
        return span

opt = StockSpannerOptimized()
assert opt.next(100) == 1, "assertion failed"
assert opt.next(80) == 1, "assertion failed"
```

## TypeScript Corner

```typescript
class StockSpanner {
  private stack: [number, number][];

  constructor() {
    this.stack = [];
  }

  next(price: number): number {
    let span = 1;
    while (this.stack.length > 0 && this.stack[this.stack.length - 1][0] <= price) {
      span += this.stack.pop()![1];
    }
    this.stack.push([price, span]);
    return span;
  }
}

const spanner = new StockSpanner();
if (spanner.next(100) !== 1) throw new Error("assertion failed");
if (spanner.next(80) !== 1) throw new Error("assertion failed");
if (spanner.next(60) !== 1) throw new Error("assertion failed");
if (spanner.next(70) !== 2) throw new Error("assertion failed");
if (spanner.next(60) !== 1) throw new Error("assertion failed");
if (spanner.next(75) !== 4) throw new Error("assertion failed");
```

## Python Corner

```python
class StockSpanner:
    def __init__(self):
        self.stack: list[tuple[int, int]] = []

    def next(self, price: int) -> int:
        span = 1
        while self.stack and self.stack[-1][0] <= price:
            span += self.stack.pop()[1]
        self.stack.append((price, span))
        return span

spanner = StockSpanner()
assert spanner.next(100) == 1, "assertion failed"
assert spanner.next(80) == 1, "assertion failed"
assert spanner.next(60) == 1, "assertion failed"
assert spanner.next(70) == 2, "assertion failed"
assert spanner.next(60) == 1, "assertion failed"
assert spanner.next(75) == 4, "assertion failed"
```

## Takeaway

掌握 Monotonic Stack 結合 Span 累積的技巧，將歷史碎片的計數進行動態吞併，是解開線上資料流區間統計題目的關鍵。

## Tomorrow Preview

明天我們將探討 Monotonic Queue 的進階應用，學習如何在滑動視窗中以 O(1) 時間維護最大值或最小值，進一步擴展堆疊與佇列在陣列區間問題中的威力。

## Today's Challenge

- **901** · 典型的線上資料流查詢問題，需要計算連續小於或等於當前價格的天數，完美對應 Monotonic Stack with Accumulation 架構。
  - Hint: 在堆疊中同時保存價格與對應的 span，遇到小於等於當前價格的元素時持續彈出並累加 span。
