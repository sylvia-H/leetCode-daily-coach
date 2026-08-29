---
id: array-two-pointers-variable
title: Sliding Window Variable Size
module: array
pattern_label: Sliding Window
complexity_label: O(n) / O(k)
estimated_minutes: 25
exit_criteria:
  - 能明確分辨何時該擴張右界（right++）與何時該收縮左界（left++）
  - 能在視窗動態調整過程中正確記錄最佳解
---
## Concept

Sliding Window Variable Size 是一種在陣列或字串中處理連續區間問題的有效演算法。與固定大小的 Sliding Window 不同，此模式的視窗長度會根據題目條件動態調整。其核心思想是使用兩個指標（通常稱為 left 與 right）來表示當前視窗的左右邊界。透過不斷推進 right 指標來擴張視窗以納入新元素，當視窗狀態滿足特定條件時，則試圖推進 left 指標來收縮視窗，藉此尋找符合條件的最長或最短子陣列。

## Thinking

在思考此類問題時，外層迴圈通常由 right 指標主導，負責依序遍歷陣列並將元素加入當前視窗中。隨著 right 的推進，視窗的總和或狀態會隨之更新。當視窗狀態達到題目要求的門檻（例如總和大於等於 target）時，內層則啟動 while 迴圈，試圖將 left 指標向右移動以收縮視窗。在收縮的過程中，必須同步更新視窗的統計狀態（減去移出視窗的元素），並在每次視窗合法時記錄或更新最佳解。這種擴張與收縮交替進行的機制，確保了每個元素最多被訪問兩次，從而將時間複雜度優化為線性級別。

## Pattern Recognition

當題目要求尋找「符合特定條件的最短子陣列」、「和達到目標值的最小長度」或「包含所有特定字元的最小子字串」時，應立即聯想至 Sliding Window Variable Size Pattern。若問題未明確給定子陣列的固定長度，且資料結構具備單調性（即擴張視窗有助於達成條件，或收縮視窗有助於尋找極值），即為此模式的典型應用場景。

## Common Mistakes

最常見的錯誤在於收縮左界（left++）時，遺忘同步更新視窗的統計狀態（例如忘記從累加總和中減去 nums[left]，或是忘記更新對應的頻率對照表）。另一個常見錯誤是將內層的 while 迴圈誤寫為 if 判斷式，導致無法在單次擴張後連續收縮視窗以找出真正的極小有效視窗。

## Complexity

Time Complexity: O(n)，其中 n 為陣列長度。左右指標各自最多遍歷陣列一次。
Space Complexity: O(1) 或 O(k)，取決於是否需要額外的雜湊表來記錄視窗內的字元或元素頻率。

## Digest

Sliding Window Variable Size 透過動態調整視窗大小來解決子陣列最佳化問題。外層 right 擴張視窗，內層 while 配合 left 收縮視窗。掌握狀態更新與邊界條件是解題關鍵。

## TypeScript Tip

```typescript
function validateWindowSize(nums: number[]): boolean {
  const isValid = nums.length > 0;
  if (!isValid) throw new Error("assertion failed");
  return isValid;
}
validateWindowSize([1, 2]);
```

## Python Tip

```python
def validate_window_size(nums: list[int]) -> bool:
    is_valid = len(nums) > 0
    assert is_valid, "assertion failed"
    return is_valid

validate_window_size([1, 2])
```

## Takeaway

擴張靠 right，收縮靠 while 與 left，狀態更新莫遺忘。

## Tomorrow Preview

明天我們將探討字串處理中的 Sliding Window Variable Size 變體，學習如何結合 Hash Map 來追蹤字元頻率，並解決包含重複字元的最長子字串問題。

## Today's Challenge

- **209** · 題目要求尋找和大於等於 target 的最短子陣列長度，視窗大小不固定且具備單調性，完美符合可變大小滑動視窗的應用場景。
  - Hint: 使用 right 累加總和，當總和達到 target 時，嘗試移動 left 以縮小視窗並更新最小長度。
