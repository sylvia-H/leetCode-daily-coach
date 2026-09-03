---
id: sliding-window-variable-size-contraction
title: 'Variable-Size Sliding Window: Contraction Phase'
module: sliding-window
pattern_label: Variable Sliding Window
complexity_label: O(n) / O(k)
estimated_minutes: 20
exit_criteria:
  - 能寫出在限制被違反時，從左側收縮視窗的內層 while 迴圈。
  - 能在收縮過程中正確更新全域最佳結果（最大或最小長度）。
---
## Concept

上一課的擴張把新元素帶進視窗，本課補上機制的另一半：收縮（Contraction）。慣例不變——閉區間 `[left, right]`、每輪先納入 `nums[right]` 再判斷、長度 `right - left + 1`。收縮由內層 while 驅動：當納入右端後狀態越線，就讓 left 前進一格、同步把 `nums[left]` 從統計中移出，重複到停下為止。它有兩種面貌：求「最長」時，越線代表違規，收縮到恢復合法；求「最短」時（如總和達標求最短子陣列），越線代表達標，達標期間邊記錄邊收縮，把視窗壓到不能再短。收縮是元素離開視窗的唯一出口。

## Thinking

兩種面貌可用同一條原則統一：「只在視窗合法時記錄答案」。最長型的合法時刻在 while 結束後——違規已清乾淨，此刻記錄；最短型的合法時刻在 while 內部——`sum >= target` 成立的每一刻視窗都達標，記錄放在迴圈體第一行，扣掉元素後條件一旦跌破就自然停下。正確性靠單調性：正數陣列中收縮只會讓總和變小，每個 right 的收縮因此有明確停點，途中記到的每個長度都真實達標，而以 right 為右端的最短達標視窗必然在途中被記到——不會漏解。

攤銷論證在此補完。單輪 while 最壞可能連走很多步，但別盯單輪、盯總帳：while 每走一步，left 就前進一格，而 left 從 0 出發、只增不減、終點不超過 n——所以整趟執行中 while 的總步數不超過 n。把每一步的成本記在「被移出的那個元素」頭上：每個元素至多被 right 納入一次、被 left 移出一次，進出各付一次 O(1)，全程合計不超過 2n 步。這就是攤銷——單輪最壞 O(n) 不代表整體 O(n^2)。

## Pattern Recognition

「總和達到門檻的最短連續子陣列」「涵蓋所有必要字元的最小子字串」是最短型收縮的典型題面。動手前做單調性反向檢查：收縮必須讓狀態單調地往越線的反方向走（正數陣列中總和單調下降），停點才明確；若陣列含負數，移出元素可能讓總和不減反增，這套模板直接失效，得改用 prefix sum 等其他工具。

## Common Mistakes

1. 收縮寫成 if：一次移除不保證夠。最短型實測 `nums = [2, 3, 1, 2, 4, 3]`、`target = 7`：if 版回傳 4，正解是 2，安靜算錯。但這不是通則——上一課「總和不超過上限求最長」的 if 版恰好永遠答對（記到的違規長度不會超過已成立的答案），所以不能憑印象指控，判準是該題是否需要連續多次移除。
2. 最短型把記錄放到 while 之後：此時視窗已跌破門檻。實測 `target = 11`、同一陣列：依記錄式怎麼寫會回傳 1 或 4，都不是正解 5——共同的病根是記到的視窗已不達標。
3. left 前進時忘了把 `nums[left]` 從統計扣掉：總和不再下降、while 條件永真，程式卡死在無窮迴圈——失效形式是掛住，不是算錯。

## Complexity

時間 O(n)：right 走 n 步；left 只增不減，全程累計也至多走 n 步（攤銷論證見 Thinking），每步皆為 O(1) 更新。空間：總和型只需數值變數，O(1)；若狀態是頻率表則為 O(k)，k 為字元集大小或視窗內相異元素數。

## Digest

收縮補完可變視窗：納入 `nums[right]` 後，狀態越線就用 while 讓 left 前進、同步扣掉移出元素的統計。記錄時機依題型：最長型在 while 結束（恢復合法）後記錄；最短型在 while 內（仍達標時）記錄。例如總和達 7 求最短、`nums = [2, 3, 1, 2, 4, 3]`：right=3 時 sum=8 達標，記長度 4 後移出 2；right=5 時連續收縮，最後記到 `[4, 3]` 長度 2。left 只增不減，整趟 while 總步數不超過 n，每個元素最多進出一次，整體攤銷 O(n)。

## TypeScript Tip

最短型的記錄放在 while 體第一行——此刻視窗仍達標：

```typescript
import assert from "node:assert";
function minSubArrayLen(target: number, nums: number[]): number {
  let left = 0, sum = 0, best = Infinity;
  for (let right = 0; right < nums.length; right++) {
    sum += nums[right]!; // 先納入
    while (sum >= target) { // 達標期間：先記錄再收縮
      best = Math.min(best, right - left + 1);
      sum -= nums[left]!;
      left++;
    }
  }
  return best === Infinity ? 0 : best;
}
assert(minSubArrayLen(7, [2, 3, 1, 2, 4, 3]) === 2); // 需連續多次收縮
assert(minSubArrayLen(4, [1, 4, 4]) === 1); // 答案長度 1
assert(minSubArrayLen(3, [1, 1, 1]) === 3); // 全部相同、答案是整個陣列
assert(minSubArrayLen(11, [1, 1, 1]) === 0); // 無解回傳 0
```

## Python Tip

`float("inf")` 當初始最短長度，最後換回 0 表示無解：

```python
def min_sub_array_len(target: int, nums: list[int]) -> int:
    left = current_sum = 0
    best = float("inf")
    for right, value in enumerate(nums):
        current_sum += value  # 先納入
        while current_sum >= target:  # 達標期間：先記錄再收縮
            best = min(best, right - left + 1)
            current_sum -= nums[left]
            left += 1
    return 0 if best == float("inf") else best

assert min_sub_array_len(7, [2, 3, 1, 2, 4, 3]) == 2
assert min_sub_array_len(4, [1, 4, 4]) == 1
assert min_sub_array_len(3, [1, 1, 1]) == 3
assert min_sub_array_len(11, [1, 1, 1]) == 0
```

## Takeaway

越線就用 while 收縮並同步扣統計，只在視窗合法時記錄；left 只增不減，每個元素最多進出一次，攤銷 O(n)。

## Tomorrow Preview

明天用同一套視窗慣例解「無重複字元的最長子字串」：收縮不再逐格走，改用記錄字元最後位置的 Hash Map，讓 left 一步跳到重複字元的下一格。

## Today's Challenge

- **209** · 正數陣列上求總和達到 target 的最短連續子陣列：收縮讓總和單調下降、停點明確，是最短型收縮的原型題。
  - Hint: 納入 `nums[right]` 後，只要總和仍達標就先記錄 `right - left + 1` 再移出 `nums[left]`；全程未達標回傳 0。
