---
id: sliding-window-variable-size-expansion
title: 'Variable-Size Sliding Window: Expansion Phase'
module: sliding-window
pattern_label: Variable Sliding Window
complexity_label: O(n) / O(k)
estimated_minutes: 15
exit_criteria:
  - 能寫出貪婪地擴張右指標的迴圈，直到條件滿足或被違反為止。
  - 能在右指標納入新元素時正確更新視窗狀態。
---
## Concept

Variable-Size Sliding Window（可變視窗）是固定視窗的推廣：固定視窗的長度由題目給死，left 與 right 同步前進；可變視窗的長度則由條件決定，兩端各自移動。邊界慣例沿用前一課：視窗是閉區間 `[left, right]`，兩端元素都在窗內，長度為 `right - left + 1`。整個機制拆成兩個動作——擴張（Expansion，本課）與收縮（Contraction，下一課）。擴張由外層迴圈驅動：每一輪讓 right 前進一格，先把 `nums[right]` 納入視窗狀態（總和累加、頻率計數加一），之後視窗才算包含 right，接下來的任何判斷與記錄都在納入之後才做。擴張是新元素進入視窗的唯一入口。

## Thinking

為什麼堅持「先納入、再判斷」？因為要守住一條不變式：每次判斷發生時，狀態變數描述的恰好是 `[left, right]` 的全部元素。順序反過來，判斷依據的就是還不含 right 的舊狀態，結論卻套在含 right 的視窗上，違規的右端元素會躲過檢查（Common Mistakes 有具體反例）。

擴張的成本可以直接算清楚：right 從 0 走到 `n - 1`，每輪恰好前進一格、從不回頭，整趟只走 n 步；每一步的納入是 O(1) 增量更新。所以「進」這一側的總成本是 O(n)——每個元素恰好被納入一次。這是攤銷分析的前半張帳單，下一課的收縮會補上「出」的一側：left 同樣只前進，每個元素至多被移出一次，兩側合計不超過 2n 步。

前提是狀態變數選得對：它必須能在納入一個元素時以 O(1) 增量維護——總和加一個數、頻率表加一筆——這是視窗法勝過重算每個區間的根基。

## Pattern Recognition

題目要求「滿足某條件的最長或最短連續子陣列／子字串」而長度未知，就是可變視窗的訊號。動手前檢查兩件事：一、視窗狀態能否增量維護（納入、移出各 O(1)）；二、條件是否有單調性——例如正數陣列中「總和不超過上限」，視窗縮小時總和只會變小，合法不會變違規（下一課收縮的正確性靠它）。若長度給死，退回前一課的固定視窗即可。

## Common Mistakes

1. 先判斷再納入：判斷用的是不含 `nums[right]` 的舊狀態。以「總和不超過 `limit` 的最長子陣列」為例，`nums = [1, 9]`、`limit = 2`：正解是 1（只有 `[1]` 合法），這樣寫會回傳 2——9 納入後從未被檢查就被記進答案，安靜地算錯。
2. 長度寫成 `right - left`：閉區間兩端都在窗內，漏掉 `+1`。`nums = [1, 2, 3]`、`limit = 6` 的正解是 3（整個陣列），會回傳 2。
3. 用「重算整段視窗」代替增量更新：答案仍然正確，但每輪要花視窗長度的時間，整體退化成 O(n^2)——失效形式是白做工，不是算錯，資料一大計時就露餡。

## Complexity

時間：擴張側 right 只走 n 步、每步 O(1)，合計 O(n)；補上收縮側後整體仍是 O(n)（完整攤銷論證於下一課補完）。空間：狀態若是單一數值（如總和）為 O(1)；若是頻率表則為 O(k)，k 為字元集大小或視窗內相異元素數。

## Digest

可變視窗把機制拆成擴張與收縮，本課先講擴張：外層迴圈每輪讓 right 前進一格，先把 `nums[right]` 納入狀態（總和累加、頻率加一），之後才判斷與記錄，長度是閉區間的 `right - left + 1`。例如「總和不超過 5 的最長子陣列」、`nums = [2, 3, 1]`：right=0 納入 2（sum=2 合法，長度 1）→ right=1 納入 3（sum=5 合法，長度 2）→ right=2 納入 1（sum=6 違規，交給明天的收縮處理）。right 從不回頭，每個元素恰好被納入一次，擴張側總成本 O(n)。

## TypeScript Tip

「先納入、再判斷、合法後記錄」三步在迴圈裡各有固定位置：

```typescript
import assert from "node:assert";
function longestAtMost(nums: number[], limit: number): number {
  let left = 0, sum = 0, best = 0;
  for (let right = 0; right < nums.length; right++) {
    sum += nums[right]!; // 先納入
    while (sum > limit) { // 違規才收縮（下一課詳述）
      sum -= nums[left]!;
      left++;
    }
    best = Math.max(best, right - left + 1); // 合法後記錄
  }
  return best;
}
assert(longestAtMost([1, 2, 3], 6) === 3); // 答案是整個陣列
assert(longestAtMost([2, 2, 2], 2) === 1); // 全部相同、答案長度 1
assert(longestAtMost([1, 9], 2) === 1); // 違規右端不得入帳
```

## Python Tip

`enumerate` 讓索引與元素同時到手；納入永遠是迴圈體的第一行：

```python
def longest_at_most(nums: list[int], limit: int) -> int:
    left = best = current_sum = 0
    for right, value in enumerate(nums):
        current_sum += value  # 先納入
        while current_sum > limit:  # 違規才收縮
            current_sum -= nums[left]
            left += 1
        best = max(best, right - left + 1)  # 合法後記錄
    return best

assert longest_at_most([1, 2, 3], 6) == 3
assert longest_at_most([2, 2, 2], 2) == 1
assert longest_at_most([1, 9], 2) == 1
```

## Takeaway

先把 `nums[right]` 納入狀態、之後才判斷與記錄；right 只前進不回頭，每個元素恰好被納入一次，擴張側成本 O(n)。

## Tomorrow Preview

明天補上機制的另一半：Contraction Phase——狀態越線時用內層 while 讓 left 前進、把離開的元素移出統計，並完成「每個元素最多進出一次、整體 O(n)」的攤銷論證。

## Today's Challenge

本篇為觀念課，沒有對應的 LeetCode 練習題。建議把 Tip 的模板親手默寫一次，再刻意把「納入」移到判斷之後，觀察斷言如何抓出錯誤。
