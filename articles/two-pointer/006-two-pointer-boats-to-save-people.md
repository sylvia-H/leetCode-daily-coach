---
id: two-pointer-boats-to-save-people
title: Boats to Save People Matching
module: two-pointer
pattern_label: Two Pointers - Greedy Pairing
complexity_label: O(n log n) / O(1)
estimated_minutes: 15
exit_criteria:
  - 能夠理解為何最重的乘客必須優先考慮與最輕的乘客共乘
  - 正確計算所需的最少載具數量
---
## Concept

在處理資源配置與極值優化問題時，Boats to Save People Matching 是一個經典的 Two Pointers 應用場景。此模式的核心在於將一維陣列排序後，運用相向雙指標配合貪婪策略（Greedy Strategy），在符合條件的限制下尋求最佳的配對方案。當面對「每艘船最多載兩人和重量限制」這類約束條件時，排序能讓資料呈現單調性，而雙指標則能有效率地在線性時間內完成搜尋，避免不必要的暴力枚舉。

## Thinking

思考這類題目時，首先必須理解問題的約束：每艘船至多只能載兩位乘客，且總重量不能超過指定的 limit。若直接使用暴力解法檢查所有可能的組合，時間複雜度將會高達 O(n^2)。為了優化此過程，我們可以先將所有乘客的體重由小到大進行排序。接著設立兩個指標：left 指向體重最輕的乘客，right 指向體重最重的乘客。此時採取貪婪策略：若最重的人與最輕的人的體重總和小於或等於 limit，代表兩人可以共乘一艘船，此時我們將 left 向右移動、right 向左移動；若總和超過 limit，代表最重的人無法與任何人共乘，他必須獨自佔用一艘船，因此我們僅將 right 向左移動。透過這種方式，每一步都能夠確保持續處理最重的乘客，最終得到最少的船隻需求量。

## Pattern Recognition

當題目具備以下特徵時，即可辨識出應使用此 Pattern：1. 問題要求將元素進行分組或配對，且通常有容量或重量的上限限制。2. 容器（如船隻、袋子等）的容量固定，且最多或剛好容納固定數量的元素。3. 經過排序後的陣列，能夠透過頭尾相向的指標來測試極端值的結合可能性。若滿足這些條件，通常可以優先考慮使用排序結合 Two Pointers 的 Greedy 策略。

## Common Mistakes

開發者在實現此邏輯時常見的錯誤包括：1. 誤以為每艘船可以載超過兩個人，導致嘗試用複雜的滑動視窗或多指標來解題。2. 忽略了前置排序的重要性，未排序就直接使用雙指標，導致極端值搭配的假設失效。3. 在體重總和超過 limit 時，錯誤地同時移動 left 與 right 指標，這會遺漏對其他乘客的正確判定。4. 沒有正確處理當 left 等於 right 時（即只剩最後一個人）的邊界條件。

## Complexity

時間複雜度為 O(n log n)，主要來自於初期對體重陣列進行排序的開銷；隨後的雙指標掃描僅需 O(n) 時間。空間複雜度為 O(1) 或 O(n)，取決於所使用的程式語言在排序時所需的額外輔助空間。

## Digest

Boats to Save People Matching 結合了排序與相向雙指標，是解決資源配對與極值優化問題的典範。核心思想是優先讓最重的人與最輕的人配對，若超重則最重的人單獨搭乘。透過 O(n log n) 的排序與 O(n) 的線性掃描，我們能以極高效的方式得出最少載具數量。

## TypeScript Tip

```typescript
import assert from "node:assert";

function numRescueBoatsTip(people: number[], limit: number): number {
  people.sort((a, b) => a - b);
  let l = 0, r = people.length - 1, ans = 0;
  while (l <= r) {
    if (people[l] + people[r] <= limit) l++;
    r--;
    ans++;
  }
  return ans;
}

assert.strictEqual(numRescueBoatsTip([1, 2], 3), 1);
```

## Python Tip

```python
def num_rescue_boats_tip(people: list[int], limit: int) -> int:
    people.sort()
    l, r, ans = 0, len(people) - 1, 0
    while l <= r:
        if people[l] + people[r] <= limit:
            l += 1
        r -= 1
        ans += 1
    return ans

assert num_rescue_boats_tip([1, 2], 3) == 1
```

## Takeaway

排序化解亂序，雙指標收斂極值，Greedy 配對達成最佳解。

## Tomorrow Preview

明天我們將探討 Two Pointers 在字串處理中的另一種進階應用：Container With Most Water Matching，學習如何利用相向雙指標動態調整高度以求取最大面積。

## Today's Challenge

- **881** · 此題為標準的資源分配與雙人限制載具題目，必須利用排序與相向雙指標的 Greedy 策略來求解。
  - Hint: 先將陣列排序，每次讓最重的人試著與最輕的人共乘，若超過限制則最重的人獨自上船。
