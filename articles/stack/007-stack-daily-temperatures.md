---
id: stack-daily-temperatures
title: Stack Daily Temperatures
module: stack
pattern_label: Monotonic Stack (Next Greater Element)
complexity_label: O(n) / O(n)
estimated_minutes: 25
exit_criteria:
  - 能在 stack 中儲存索引，同時維持對應值的遞減順序。
  - 能在遇到更大的元素時，結算尚待處理的索引。
---
## Concept

Monotonic Stack 是一種特殊的堆疊資料結構，其內部元素保持單調遞增或單調遞減的順序。在處理陣列問題時，當我們需要尋找每個元素右側或左側第一個大於（或小於）它的元素時，Monotonic Stack 是效率極高的核心武器。透過維護單調性，我們可以在平均 O(n) 的時間複雜度內解決原本需要巢狀迴圈（O(n^2)）才能完成的尋找問題。

## Thinking

當我們從左至右掃描陣列時，必須思考如何有效率地記錄那些尚未找到「下一個更高溫度」的天數。如果將目前的溫度與堆疊頂端的歷史溫度進行比較，當前溫度大於堆疊頂端所代表的溫度時，就意味著我們找到了該歷史天數的解答。此時即可將其彈出堆疊，並計算天數差。透過這種方式，堆疊內部的元素將保持嚴格遞減的對應數值順序，確保每次比較與彈出都能直接鎖定正確的解答。

## Pattern Recognition

辨識此 Pattern 的核心線索在於尋找「下一個更大」或「下一個更小」的元素，並且問題往往涉及距離或相對位置的計算。當題目要求對每一個元素找出其右側或左側第一個滿足特定大小關係的目標時，且暴力解法需要雙重迴圈時，這就是使用 Monotonic Stack 的強烈訊號。

## Common Mistakes

最常見的錯誤是在堆疊中儲存數值本身，而不是儲存陣列的索引。由於本題需要計算等待的天數差（即位置的距離），如果只儲存溫度數值，將無法得知該溫度在原陣列中的正確位置。另一個常見錯誤是忘記在迴圈結束後處理堆疊中剩餘的元素，這些元素在歷經整個陣列掃描後仍然找不到更高溫度，其對應的答案應該保持為預設值零。

## Complexity

Time Complexity: O(n), each element is pushed and popped from the stack at most once. Space Complexity: O(n), in the worst-case scenario (e.g., strictly decreasing temperatures), all indices will be stored in the stack.

## Digest

本課程深入探討了 Monotonic Stack 在解決 Daily Temperatures 問題時的核心原理。透過在堆疊中儲存索引並維持遞減順序，我們能夠在線性時間內找出下一個更高溫度的出現位置。文章詳細說明了從左至右掃描、彈出堆疊、計算索引差的思考過程，並點出了儲存數值與索引的盲點。最後透過 TypeScript 與 Python 的標準實作範例，確保學習者能夠正確掌握語法細節與記憶體操作。

## TypeScript Tip

在 TypeScript 中實作時，建議使用數字陣列作為堆疊，並明確運用非空斷言或型別檢查來確保索引安全。陣列操作如 push 與 pop 均為 O(1) 均攤時間複雜度，效能極佳。
```typescript
function tsTipDemo(): void {
  const stack: number[] = [];
  stack.push(10);
  const val = stack.pop();
  if (val !== 10) throw new Error("assertion failed");
}
tsTipDemo();
```

## Python Tip

在 Python 中，一般串列（list）即可完美作為堆疊使用。利用負索引 stack[-1] 可以非常直覺且安全地存取堆疊頂端元素，無需額外匯入其他資料結構。
```python
def py_tip_demo() -> None:
    stack: list[int] = []
    stack.append(10)
    val = stack.pop()
    assert val == 10, "assertion failed"
py_tip_demo()
```

## Takeaway

掌握 Monotonic Stack 的核心在於儲存索引、維持單調性，並在遇到突破條件時進行彈出與結算。

## Tomorrow Preview

明天我們將探討下一個有關 Monotonic Stack 的經典應用，學習如何處理含有環狀陣列或是尋找下一個更大元素的變形題目，進一步鞏固堆疊操作的抽象思考能力。

## Today's Challenge

- **739** · 本題需要尋找陣列中每個元素右側第一個大於自身的元素，且必須計算兩者之間的距離，是 Monotonic Stack 的絕對標準題型。
  - Hint: 在堆疊中儲存天數的索引，當遇到溫度大於堆疊頂端索引所對應的溫度時，即為解答。
