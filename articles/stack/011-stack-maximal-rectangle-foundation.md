---
id: stack-maximal-rectangle-foundation
title: Stack Maximal Rectangle Foundation
module: stack
pattern_label: Largest Rectangle in Histogram Core
complexity_label: O(n) / O(n)
estimated_minutes: 25
exit_criteria:
  - 能為直方圖中每個柱高找出左右邊界限制。
  - 能在線性時間內有效率地計算最大矩形面積。
---
## Concept

Stack Maximal Rectangle Foundation 是解決柱狀圖中最大矩形面積問題的核心技術。在包含多個不同高度直方柱的序列中，要找出任一柱子能擴展的最大矩形面積，關鍵在於尋找該柱子左右兩側第一個比它矮的柱子位置。這決定了以當前柱子高度為高的最大橫向寬度。傳統暴力解法需要對每一根柱子向左右掃描，時間複雜度高達 O(n^2)。透過 Monotonic Stack 維持單調遞增的柱子索引序列，我們可以在 O(n) 的線性時間內一次完成所有邊界的確定與面積計算。

## Thinking

思考這個問題時，核心挑戰在於如何有效率地為每個長條柱（bar）決定其左右邊界。若使用 Monotonic Stack（單調遞增堆疊），我們可以在遍歷直方圖時，將柱子的索引依對應高度遞增的順序存入堆疊中。當遇到一個高度小於堆疊頂端高度的新柱子時，這意味著堆疊頂端柱子的右邊界已經確切找到（即當前新柱子的索引）。此時我們可以將堆疊頂端元素彈出，並計算以該被彈出柱子高度為高的矩形面積。此時，被彈出柱子彈出後的新堆疊頂端元素，即為該柱子左側第一個小於它的柱子索引。透過這種方式，每個柱子最多進出堆疊一次，實現了高效能的邊界掃描。

## Pattern Recognition

當題目要求在柱狀圖（Histogram）或二維網格（Grid）中尋找最大矩形面積、最大子矩形或尋找左右第一個小於（或大於）特定元素的邊界時，應立即聯想並套用 Monotonic Stack Pattern。這類問題的共同特徵是：元素向兩側擴展的有效範圍取決於遇到的第一個障礙物（即比自身矮的元素）。透過維護一個單調堆疊，我們能夠在常數均攤時間內確定每個元素的生命週期邊界。

## Common Mistakes

最常見的錯誤包含忘記在直方圖陣列前後加入哨兵值（Sentinel Value，例如高度為 0 的柱子），導致堆疊中剩餘的元素無法在迴圈結束後被正確彈出並計算面積。另一個常見錯誤是混淆了堆疊中儲存的是「柱子的高度」還是「柱子的索引」。為了有效計算寬度，堆疊必須儲存索引（Index），否則無法精確計算左右邊界之間的距離差。此外，未正確處理所有柱子高度均相同或嚴格遞增的邊界情況，也容易引發索引越界錯誤。

## Complexity

時間複雜度為 O(n)，因為陣列中的每個元素最多被壓入堆疊一次、彈出一次。空間複雜度為 O(n)，用於儲存單調堆疊以及可能需要進行邊界填充的修改後陣列。

## Digest

Stack Maximal Rectangle Foundation 是利用 Monotonic Stack 解決直方圖最大矩形面積的核心方法。透過維持遞增堆疊，我們能在 O(n) 時間內找出每根柱子左右兩側第一個較矮的邊界。TypeScript 與 Python 實作時，常在陣列前後補 0 作為哨兵值，簡化堆疊清理邏輯。

## TypeScript Tip

```typescript
function tsTipExample(): void {
  const heights = [2, 1, 5];
  const padded = [0, ...heights, 0];
  if (padded.length !== 5) {
    throw new Error("Sentinel padding failed");
  }
}
tsTipExample();
```

## Python Tip

```python
def py_tip_example() -> None:
    heights = [2, 1, 5]
    padded = [0] + heights + [0]
    assert len(padded) == 5, "Sentinel padding failed"

py_tip_example()
```

## Takeaway

運用單調堆疊與哨兵技巧，在 O(n) 時間內搞定柱狀圖左右邊界與最大矩形面積！

## Tomorrow Preview

明天我們將基於今日的 Stack Maximal Rectangle Foundation，進一步將一維的柱狀圖延伸應用至二維矩陣中，探討 LeetCode 85. Maximal Rectangle。我們將學習如何將二維網格轉化為每一層的累積直方圖，並重複運用單調堆疊高效求解矩陣內的最大矩形。

## Today's Challenge

- **84** · LeetCode 84 正是求直方圖中最大矩形面積的標準題型，完美對應使用 Monotonic Stack 來尋找左右第一小元素的經典場景。
  - Hint: 在陣列前後各補一個 0 可以自動觸發堆疊的結算清理，避免遺漏最高或最後的長條柱。
