---
id: stack-next-greater-element-ii
title: Stack Next Greater Element II
module: stack
pattern_label: Circular Monotonic Stack
complexity_label: O(n) / O(n)
estimated_minutes: 20
exit_criteria:
  - 能用 modulo 索引模擬環狀陣列的走訪。
  - 能跨越陣列的環狀邊界找出 next greater element。
---
## Concept

Stack Next Greater Element II 代表處理循環陣列（circular array）中尋找下一個更大元素問題的經典技巧。當陣列頭尾相接時，陣列末尾的元素需要能夠回頭檢視陣列開頭的元素以找出其 Next Greater Element。利用 Monotonic Stack 結合模擬兩倍長度的走訪過程，可以有效地在線性時間內解決此類環狀依賴問題。

## Thinking

在處理這類問題時，首先要克服的是環狀陣列（circular array）的邊界條件。如果實際去複製一個陣列來串接，會增加額外的記憶體開銷。因此，核心思考方式是透過模擬將陣列邏輯上延長為兩倍長度，即長度為 2 * n。我們從右至左進行走訪（從 2 * n - 1 到 0），並利用 modulo 運算子將索引對應回原陣列的合法範圍。Monotonic Stack 在此處維護一個遞減的序列，用來記錄可能成為左側元素之 Next Greater Element 的候選者。當我們走到索引 i 時，堆疊頂部若小於或等於當前元素，則將其彈出，直到堆疊頂部為大於當前元素的數值，此即為答案；若堆疊為空，則代表不存在這樣的元素。最後，只有當實際索引小於 n 時，我們才將結果寫入答案陣列中，因為超出 n 的前半段循環僅用於提供右側元素的查詢依據。

## Pattern Recognition

當題目明確提到陣列是循環的（circular）、頭尾相接，且要求尋找下一個更大或更小元素（Next Greater/Smaller Element）時，即可高度識別為 Circular Monotonic Stack 模式。此模式的關鍵特徵在於不需要實際重建或複製資料結構，而是藉由將迴圈次數擴大為兩倍（2 * n - 1 至 0），並配合取模運算子（modulo operator）來處理跨越邊界的查詢需求。

## Common Mistakes

最常見的錯誤是忘記使用 modulo 運算來進行索引包覆（index wrapping），導致存取超出原陣列邊界而引發錯誤，或者只走訪了一次原陣列長度，導致陣列末尾的元素無法正確查詢到開頭的元素。另一個常見失誤是沒有正確控制將結果寫入答案陣列的時機，誤將模擬前半段索引（大於等於 n 的部分）的計算結果覆寫或記錄下來，導致最終輸出長度不正確。

## Complexity

時間複雜度為 O(n)，因為每個元素最多被推入（push）堆疊一次、彈出（pop）一次，整體走訪次數為 2 * n 次。空間複雜度為 O(n)，主要取決於儲存答案的陣列以及用來維護單調遞減性質的堆疊空間。

## Digest

Stack Next Greater Element II 介紹了處理循環陣列中尋找下一個更大元素的進階技巧。核心概念是透過模擬兩倍長度的走訪，結合單調堆疊與取模運算，讓陣列末尾的元素能夠跨越邊界查詢開頭的元素。文章詳細說明了從右至左的走訪順序、單調堆疊的維護邏輯、時間與空間複雜度分析，並提供了 TypeScript 與 Python 的完整實作程式碼與斷言測試，幫助開發者徹底掌握環狀單調堆疊的精髓。

## TypeScript Tip

```typescript
function tsTipDemo(): void {
  const n = 3;
  const indices: number[] = [];
  for (let i = 2 * n - 1; i >= 0; i--) {
    indices.push(i % n);
  }
  if (indices.length !== 6) throw new Error("assertion failed");
}
tsTipDemo();
```

## Python Tip

```python
def py_tip_demo():
    n = 3
    indices = [i % n for i in range(2 * n - 1, -1, -1)]
    assert len(indices) == 6, "assertion failed"

py_tip_demo()
```

## Takeaway

掌握循環陣列的 Next Greater Element 問題，關鍵在於將迴圈長度擴大為 2 * n 並運用 modulo 運算子搭配 Monotonic Stack 進行有效查詢。

## Tomorrow Preview

明天我們將探討 Monotonic Stack 在矩形與長條圖區域問題中的應用，學習如何透過維護高度的單調性來計算最大矩形面積，進一步拓展堆疊資料結構在進階演算法中的應用場景。

## Today's Challenge

- **503** · 此題為標準的循環陣列 Next Greater Element 問題，必須透過模擬兩倍長度走訪與單調堆疊來處理頭尾相接的查詢需求。
  - Hint: 嘗試將迴圈範圍設定為 2 * n - 1 到 0，並使用 i % n 來取得實際的陣列索引。
