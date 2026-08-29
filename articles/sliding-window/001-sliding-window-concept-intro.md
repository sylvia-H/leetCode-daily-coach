---
id: sliding-window-concept-intro
title: Sliding Window Core Concept
module: sliding-window
pattern_label: Sliding Window
complexity_label: O(n) / O(1)
estimated_minutes: 15
exit_criteria:
  - >-
    Can explain why recalculating every subarray from scratch leads to redundant
    work.
  - >-
    Can trace how adding a new element and dropping an old element updates the
    window state.
---
## Concept

Sliding Window 核心觀念在於透過維護一個動態的資料視窗，將連續子陣列或子字串問題的時間複雜度從暴力解的 O(n^2) 優化至 O(n)。當我們在處理這類問題時，若每次移動邊界都重新計算整個視窗內的總和或頻率，會重複執行大量相同的計算。Sliding Window 的精髓在於重複利用重疊的計算量：當右端點擴展加入一個新元素、左端點收縮移除一個舊元素時，我們只需以 O(1) 的常數時間更新當前的視窗狀態，而不需要重新掃描整個視窗。這種藉由狀態轉移來消除冗餘計算的策略，是處理連續區間問題時極為高效的核心思維。

## Thinking

在著手設計 Sliding Window 演算法時，首要任務是明確界定視窗的範圍與狀態。思考過程通常包含三個關鍵步驟：第一，確認問題是否要求尋找連續的子陣列或子字串，並且區間的擴大與縮小具有單調性。第二，定義視窗內需要維護的狀態，例如總和、最大值、字元出現次數或特定條件的滿足數量。第三，設計指標的移動邏輯：通常使用右指標 (right pointer) 逐一將新元素納入視窗並更新狀態，當視窗狀態違反約束條件時，則移動左指標 (left pointer) 依序剔除舊元素直到恢復合法狀態。透過這種左右指針的交替推進，我們能夠完整走訪所有可能的最優解區間。

## Pattern Recognition

辨識 Sliding Window Pattern 的關鍵線索在於題目的輸入型態與求解目標。當題目要求處理陣列 (array) 或字串 (string) 中的「連續子陣列 (contiguous subarray)」或「子字串 (substring)」，且其條件與區間長度、區間總和、特定元素頻率或最值相關時，極高機率適用此 Pattern。另一個強烈的辨識信號是：當暴力解需要使用雙重迴圈窮舉所有可能的起始與結束位置時，若內層迴圈的計算與外層迴圈具有高度重疊性，且當右邊界向右延伸時，左邊界也只需單向向右收縮而不需要回溯，這正是典型可以套用 Sliding Window 的情境。

## Common Mistakes

在實作 Sliding Window 時最常見的錯誤，是遺漏了當左指標移動時，必須正確從執行狀態中移除舊元素的貢獻。開發者經常在右指標加入新元素時寫好對應的狀態更新邏輯，卻忘記在縮減視窗的迴圈中同步扣除或重置被移出視窗的舊元素數值，導致視窗狀態持續累積錯誤。另一個常見失誤是搞混了視窗長度的計算時機，未能在更新最大或最小解時準確對應當前的左右邊界範圍。此外，未妥善處理邊界條件（例如當陣列長度小於視窗大小，或目標條件無法達成時的例外情況）也經常引發執行階段錯誤。

## Complexity

O(n) / O(1)

## Digest

Sliding Window 核心觀念在於透過維護一個動態的資料視窗，將連續子陣列或子字串問題的時間複雜度從暴力解的 O(n^2) 優化至 O(n)。當我們在處理這類問題時，若每次移動邊界都重新計算整個視窗內的總和或頻率，會重複執行大量相同的計算。Sliding Window 的精髓在於重複利用重疊的計算量：當右端點擴展加入一個新元素、左端點收縮移除一個舊元素時，我們只需以 O(1) 的常數時間更新當前的視窗狀態，而不需要重新掃描整個視窗。這種藉由狀態轉移來消除冗餘計算的策略，是處理連續區間問題時極為高效的核心思維。在著手設計 Sliding Window 演算法時，首要任務是明確界定視窗的範圍與狀態。思考過程通常包含三個關鍵步驟：第一，確認問題是否要求尋找連續的子陣列或子字串，並且區間的擴大與縮小具有單調性。第二，定義視窗內需要維護的狀態，例如總和、最大值、字元出現次數或特定條件的滿足數量。第三，設計指標的移動邏輯：通常使用右指標逐一將新元素納入視窗並更新狀態，當視窗狀態違反約束條件時，則移動左指標依序剔除舊元素直到恢復合法狀態。辨識 Sliding Window Pattern 的關鍵線索在於題目的輸入型態與求解目標。當題目要求處理陣列或字串中的連續子陣列或子字串，且其條件與區間長度、區間總和、特定元素頻率或最值相關時，極高機率適用此 Pattern。在實作時常見的錯誤為遺漏了當左指標移動時，必須正確從執行狀態中移除舊元素的貢獻。

## TypeScript Tip

```typescript
function verifyWindow(): void {
  const nums = [1, 2, 3, 4];
  const k = 2;
  let sum = nums[0] + nums[1];
  if (sum !== 3) throw new Error("assertion failed");
  sum = sum + nums[2] - nums[0];
  if (sum !== 5) throw new Error("assertion failed");
}
verifyWindow();
```

## Python Tip

```python
def verify_window() -> None:
    nums = [1, 2, 3, 4]
    k = 2
    current_sum = nums[0] + nums[1]
    assert current_sum == 3, "assertion failed"
    current_sum = current_sum + nums[2] - nums[0]
    assert current_sum == 5, "assertion failed"

verify_window()
```

## Takeaway

運用 Sliding Window 透過加入右端元素並移除左端元素，以 O(1) 狀態轉移將連續區間問題從 O(n^2) 優化至 O(n)。

## Tomorrow Preview

明天我們將進一步探討 Fixed Size Sliding Window 的具體實作技巧與經典應用場景，學習如何在固定長度的限制下，高效追蹤區間內的極值與總和變化，並深入剖析指標控制的細節。

## Today's Challenge

本篇為觀念課，沒有對應的 LeetCode 練習題。請把時間花在把上面的觀念想透。
