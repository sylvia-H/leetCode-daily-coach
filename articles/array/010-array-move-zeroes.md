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

Moving Zeroes to End 要求在原地（in-place）把陣列中所有的零集中到末端，同時保持非零元素的相對順序。它是 Fast-Slow Pointers 的又一經典應用，關鍵在於視角轉換：與其思考「怎麼把零往後丟」，不如反過來想「怎麼把非零元素依序往前收」。快指標負責由左至右找出每一個非零元素，慢指標標記下一個非零元素應該落腳的位置；當所有非零元素依掃描順序被安置到陣列前端後，剩下的位置自然就該全是零。這個轉換讓整個問題化約成一次線性掃描，達到 O(n) 時間與 O(1) 空間的最佳效率。

## Thinking

直覺的做法是每遇到一個零就把它刪除、再補回尾端，但每次刪除都會牽動後方所有元素搬移，最壞情況退化為 O(n^2)。改用 Fast-Slow Pointers 後有兩種等價寫法。第一種是「覆寫＋補零」兩階段：fast 掃描整個陣列，遇到非零元素就寫入 nums[slow] 並推進 slow；掃描結束後，再把 slow 到結尾的區段全部填零。第二種是「交換」一趟完成：fast 遇到非零元素就把 nums[fast] 與 nums[slow] 交換，然後推進 slow。兩種寫法共享同一個迴圈不變式：任何時刻，nums[0..slow-1] 都是「目前已掃描到的全部非零元素，且維持原本的相對順序」；交換版還額外保證 nums[slow..fast-1] 全為零，因此每次交換必然是「非零往前、零往後」，不會波及其他元素。相對順序之所以不會亂，是因為 fast 由左至右逐一檢查、slow 依序遞增寫入——先被掃到的非零元素必定先落位，寫入順序與掃描順序完全一致。

## Pattern Recognition

三個訊號同時出現時，就該想到這個 Pattern：一、必須原地修改陣列，空間限制為 O(1)；二、需要過濾、移除或集中特定元素（零、特定數值）；三、其餘元素的相對順序必須保持不變。最後一點尤其關鍵——若順序允許打亂，從兩端夾擠的對撞指標也能解；正因為順序不可變，才必須採用同向前進的快慢指標。這個「同向掃描、條件寫入」的骨架，與先前的原地移除、原地去重是同一套模型，變的只是寫入條件：這裡的條件是「元素不為零」。

## Common Mistakes

最常見的錯誤是想在同一次迴圈裡同時搬移非零元素又補零，兩件事的指標邏輯糾纏在一起，容易覆寫尚未處理的有效元素；兩階段寫法「先壓縮、後補零」分工清楚得多。第二種錯誤是採用會破壞相對順序的策略，例如從陣列兩端向中間交換，會讓後面的非零元素跑到前面。第三是兩階段版忘記最後補零，導致尾端殘留舊資料而驗證失敗。另外交換版有個細節：當 slow 與 fast 相等時，交換等於自己跟自己交換，雖然無害，但加上 `slow !== fast` 的判斷可以省去多餘寫入。

## Complexity

Time Complexity: O(n)，其中 n 為陣列長度：交換版只需一趟線性掃描，覆寫版是「一趟壓縮＋一趟補零」，皆為常數次線性走訪。Space Complexity: O(1)，所有搬移都在原陣列上完成，不需配置額外空間。

## Digest

Moving Zeroes to End 是 Fast-Slow Pointers 的經典範例：fast 掃描陣列尋找非零元素，slow 標記下一個放置位置，nums[0..slow-1] 始終維持「已掃描的非零元素、順序不變」的不變式。可以選擇「覆寫＋補零」兩階段，或「交換」一趟完成——後者同時保證 slow 與 fast 之間全為零。兩者皆為 O(n) 時間、O(1) 空間，是原地陣列重組的核心手法。

## TypeScript Tip

```typescript
function moveZeroesTS(nums: number[]): void {
  let slow = 0;
  for (let fast = 0; fast < nums.length; fast++) {
    if (nums[fast] !== 0) {
      if (slow !== fast) {
        const temp = nums[slow]!;
        nums[slow] = nums[fast]!;
        nums[fast] = temp;
      }
      slow++;
    }
  }
}
const testArr = [0, 1, 0, 3, 12];
moveZeroesTS(testArr);
if (testArr.join(",") !== "1,3,12,0,0") throw new Error("assertion failed");
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
assert test_arr == [1, 3, 12, 0, 0], "assertion failed"
```

## Takeaway

快指標探索、慢指標定位，同向掃描讓非零元素依序前移，原地達成 O(n) 時間與 O(1) 空間的重組。

## Tomorrow Preview

Moving Zeroes to End 為快慢指標的系列應用畫下句點。接下來課程將進入新的主題；行前不妨回顧這幾課的共同骨架——fast 負責探索、slow 維護已完成區間，變的永遠只是寫入條件。

## Today's Challenge

- **283** · 原地把所有零移到結尾且維持非零元素的相對順序，是 Fast-Slow Pointers 壓縮陣列的典型場景。
  - Hint: fast 找非零元素放到 slow 的位置；用交換一趟完成，或掃描後再把 slow 之後全部補零。
