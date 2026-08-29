---
id: array-move-zeroes
title: Moving Zeroes to End
module: array
pattern_label: Fast-Slow Pointers
complexity_label: O(n) / O(1)
estimated_minutes: 15
exit_criteria:
  - 能將非零元素依序移至前方並將剩餘空間補零
  - 能確保非零元素的相對順序不變
---
## Concept

Moving Zeroes to End 是一種常見的陣列操作技巧，核心精神在於藉由 Fast-Slow Pointers 在原地（in-place）重新排列元素。當我們需要將某個特定元素（例如零）集中到陣列末端，同時維持其餘非零元素的相對順序時，暴力解法往往需要額外的儲存空間或多次走訪。透過 Fast-Slow Pointers，我們能夠在單一次走訪中完成非零元素的壓縮，並在後續階段補齊剩餘空間，達到時間複雜度 O(n) 與空間複雜度 O(1) 的最佳效率。

## Thinking

在思考這類原地陣列調整問題時，直覺上可能會想要每遇到一個零就將其移除並塞到後面，但這會導致頻繁的陣列元素搬移，使得時間複雜度惡化至 O(n^2)。此時應轉念採用 Fast-Slow Pointers 策略。我們設定一個慢指標（slow pointer）用來記錄下一個非零元素應該擺放的位置，並用一個快指標（fast pointer）逐一掃描整個陣列。當快指標指向非零元素時，我們便將其賦值到慢指標所在的位置，並將慢指標向前推進。當快指標走完全部陣列後，所有非零元素都已經整齊地排列在陣列前端。最後，我們只需要從慢指標當前的位置開始，將陣列剩餘的空間全部填入零即可完成任務。

## Pattern Recognition

當題目要求符合以下特徵時，即可強烈識別出 Fast-Slow Pointers 的應用時機：第一，必須在原地修改陣列，不允許使用額外的陣列空間（Space Complexity: O(1)）；第二，需要過濾、移除或集中特定元素（如零、特定數值或重複元素）；第三，必須嚴格維持其餘未被移除元素的相對順序。這種雙指標的互動方式能有效避免不必要的元素搬移，是處理陣列重組問題的核心模型。

## Common Mistakes

最常見的錯誤是在單一次迴圈中試圖同時處理非零元素的搬移與零的填補，導致指標邏輯混亂或覆寫了尚未處理的有效元素。另一個常見誤區是在交換或搬移過程中，不小心改變了非零元素原本的相對順序。此外，初學者常忽略最後必須將慢指標之後的空間補零的步驟，導致陣列長度改變或尾端殘留舊資料，進而引發測試案例驗證失敗。

## Complexity

Time Complexity: O(n)，其中 n 為陣列長度。我們僅需對陣列進行常數次的線性掃描（一次尋找非零並搬移、一次補零）。Space Complexity: O(1)，所有操作皆在原陣列上進行，不需要配置額外的儲存空間。

## Digest

Moving Zeroes to End 是學習 Fast-Slow Pointers 的經典範例。透過快指標掃描陣列尋找非零元素，慢指標標記放置位置，我們能在 O(n) 時間內完成非零元素的重組，並在結尾補上零。此技巧不僅能保持元素相對順序，更能達成 O(1) 的空間複雜度，是處理原地陣列變動不可或缺的核心手法。

## TypeScript Tip

```typescript
function moveZeroesTS(nums: number[]): void {
  let slow = 0;
  for (let fast = 0; fast < nums.length; fast++) {
    if (nums[fast] !== 0) {
      if (slow !== fast) {
        const temp = nums[slow];
        nums[slow] = nums[fast];
        nums[fast] = temp;
      }
      slow++;
    }
  }
}
const testArr = [0, 1, 0, 3, 12];
moveZeroesTS(testArr);
if (testArr[0] !== 1) throw new Error('assertion failed');
```

## Python Tip

```python
def move_zeroes_py(nums: list[int]) -> None:
    slow = 0
    for fast in range(len(nums)):
        if nums[fast] != 0:
            nums[slow], nums[fast] = nums[fast], nums[slow]
            slow += 1

test_arr = [0, 1, 0, 3, 12]
move_zeroes_py(test_arr)
assert test_arr[0] == 1, 'assertion failed'
```

## Takeaway

掌握 Fast-Slow Pointers 的核心精神：快指標探索、慢指標定位，原地達成 O(n) 時間與 O(1) 空間的陣列重組。

## Tomorrow Preview

明天的課程將進入經典的 Two Pointers 延伸應用，探討如何利用左右雙指標在已排序陣列中尋找特定總和的數對，進一步深化指標在陣列搜尋與區間收斂上的強大威力。

## Today's Challenge

- **283** · 題目要求原地將所有 0 移到結尾，同時必須維持非零元素的相對順序，這是 Fast-Slow Pointers 壓縮陣列元素的典型應用場景。
  - Hint: 利用快指標尋找非零元素並將其搬移到慢指標所在位置，迴圈結束後再將慢指標之後的剩餘位置全部填入 0。
