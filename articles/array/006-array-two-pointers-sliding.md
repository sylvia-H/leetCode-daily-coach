---
id: array-two-pointers-sliding
title: Sliding Window Fixed Size
module: array
pattern_label: Sliding Window
complexity_label: O(n) / O(1)
estimated_minutes: 20
exit_criteria:
  - 能正確建立第一個視窗並在視窗移動時只做 O(1) 的增量更新
  - 能正確控制視窗邊界不超出陣列範圍
---
## Concept

Sliding Window Fixed Size 是一種針對線性資料結構（如陣列或字串）的常用最佳化技巧。當題目要求我們在固定長度 k 的子陣列中尋找極值、平均值或特定條件的計數時，若使用暴力解法重新計算每個子陣列的總和或狀態，時間複雜度會達到 O(n * k)。透過 Sliding Window 機制，我們只需要在起始階段花費 O(k) 時間建立第一個視窗，隨後的每次滑動都只需要 O(1) 的常數時間：減去離開視窗左側的舊元素，並加上進入視窗右側的新元素。這種增量更新的特性將整體時間複雜度優化至 O(n)，空間複雜度降至 O(1)。

## Thinking

在解決固定大小的 Sliding Window 問題時，思考流程通常分為兩個階段。第一階段是建立初始視窗：我們使用迴圈或切片取得前 k 個元素的累加結果或狀態，並將此數值記錄為當前視窗的基準答案。第二階段是滑動視窗：透過一個從索引 k 開始的迴圈向右迭代，每次迴圈代表視窗向右移動一個單位。此時必須精準維護邊界，將索引 i - k 的舊元素從總和中移除，並將索引 i 的新元素加入總和中。在每次更新後，立即與全域的最佳解進行比較與更新。這樣的架構確保了所有元素只被進出視窗各一次，邏輯清晰且執行效率極高。

## Pattern Recognition

當題目具備以下特徵時，高度暗示應採用 Sliding Window Fixed Size Pattern：1. 輸入資料為陣列或字串。2. 要求計算或統計「固定長度 k」的子陣列（Subarray）或子字串（Substring）。3. 求解目標為最大值、最小值、平均值或符合特定條件的元素個數。4. 暴力解法會重複計算重疊區間，導致時間複雜度過高。看到這些線索，即可直接鎖定此 Pattern，省去不必要的複雜動態規劃或高階搜尋。

## Common Mistakes

開發者在實作 Sliding Window Fixed Size 時最常犯的錯誤包括：1. 視窗邊界計算錯誤，導致讀取到超出陣列範圍的索引，或漏掉最後一個有效視窗。2. 在視窗右移時，忘記精確減去最左邊的舊元素，或加新元素的順序出錯，造成累積數值嚴重失真。3. 忽略浮點數精確度問題，特別是在計算平均值時若頻繁進行除法運算可能導致誤差，通常建議先比對總和（Sum），直到最後一步才計算平均。4. 初始視窗的範圍設定錯誤，例如將 k 誤認為索引而導致視窗大小不一致。

## Complexity

O(n) / O(1)

## Digest

Sliding Window Fixed Size 是處理固定長度子陣列問題的核心技巧。核心精神在於以 O(k) 建立初始視窗後，利用 O(1) 的增量更新來滑動視窗。掌握邊界控制與狀態增減，能有效將 O(n * k) 暴力解優化至 O(n) 時間複雜度。

## TypeScript Tip

```typescript
import assert from "node:assert";
function solve(nums: number[], k: number): number {
    let sum = 0;
    for (let i = 0; i < k; i++) sum += nums[i];
    let max = sum;
    for (let i = k; i < nums.length; i++) {
        sum += nums[i] - nums[i - k];
        max = Math.max(max, sum);
    }
    return max;
}
const ans = solve([1, 2, 3, 4], 2);
assert.strictEqual(ans, 7);
```

## Python Tip

```python
def solve(nums: list[int], k: int) -> int:
    current_sum = sum(nums[:k])
    max_val = current_sum
    for i in range(k, len(nums)):
        current_sum += nums[i] - nums[i - k]
        max_val = max(max_val, current_sum)
    return max_val

assert solve([1, 2, 3, 4], 2) == 7
```

## Takeaway

固定大小滑動視窗的關鍵在於建立初始視窗並以 O(1) 增量更新，嚴格控制邊界即可達成 O(n) 高效解法。

## Tomorrow Preview

明天我們將進一步探討 Sliding Window Dynamic Size（動態大小滑動視窗），學習當子陣列長度不固定、需要根據條件動態擴展與收縮視窗邊界時的應對策略與經典題型。

## Today's Challenge

- **643** · 要求找出長度為固定 k 的子陣列最大平均數，完全符合固定大小滑動視窗的定義。
  - Hint: 先計算前 k 個元素的總和作為初始視窗，之後每次迴圈減去左邊界、加上右邊界元素。
- **1052** · 秘技時間維持固定分鐘數 k，等同於在滿意度陣列中尋找長度為 k 的視窗以獲得最大效益。
  - Hint: 將未受到祕技影響的基礎滿意度先全部加總，再用長度為 k 的視窗計算秘技可額外挽回的最大顧客數。
- **1456** · 需要在長度為 k 的子字串中統計母音字元的最高數量，屬於標準的固定大小視窗計數問題。
  - Hint: 將母音判斷轉換為 1 與 0，利用滑動視窗維護當前視窗內的母音總數即可。
