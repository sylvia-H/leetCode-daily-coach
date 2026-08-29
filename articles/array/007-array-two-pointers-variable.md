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

Sliding Window Variable Size（可變大小滑動視窗）處理「長度不固定的連續區間最佳化」問題：視窗由 left 與 right 兩個邊界界定，right 負責擴張納入新元素，left 負責收縮吐出舊元素，長度隨條件動態伸縮。它成立的前提是**單調性**：擴張視窗只會讓條件更容易滿足（或維持不變），收縮則相反。以「總和大於等於 target 的最短子陣列」為例，元素皆為正數時，視窗越長總和越大——一旦 `[left, right]` 已達標，任何包含它的更長區間也必達標卻更長，根本不必檢查；反之尚未達標時，縮短它也絕無希望。正是這個論證讓我們能大膽地「每個邊界都只前進、不回頭」，把枚舉所有區間的 O(n^2) 降為 O(n)。

## Thinking

骨架是外層 for 迴圈推進 right，把 `nums[right]` 納入視窗狀態；內層 while 迴圈在狀態滿足特定條件時反覆推進 left，並同步從狀態中扣除 `nums[left]`。依題型有兩種原型：**找最短**（如總和達標的最短子陣列）——內層 while 在「視窗已滿足條件」時啟動，先記錄當前長度為候選答案、再收縮，因為達標的視窗再縮可能更短更好；**找最長**（如不含重複字元的最長子字串）——內層 while 在「視窗違反限制」時啟動，收縮到恢復合法後，才在外層記錄長度。兩種原型的共同保證是：對每一個 right，left 都停在該右端點下最緊的邊界位置，所以所有值得考慮的候選區間一個都不會漏。

## Pattern Recognition

題目要求「符合條件的最短或最長連續子陣列／子字串」而未給定固定長度時，先檢查單調性是否成立：擴張是否單向地朝「滿足」推進、收縮是否單向地朝「不滿足」推進。像正數陣列的總和、視窗內的字元頻率都具備這個性質，即為典型場景。反例是陣列含負數的總和問題——擴張可能讓總和變小，單調性破裂，left 收縮後的區間可能反而達標，此 Pattern 便不適用。與固定視窗的分野也在此：那裡長度恆為 k、兩端同步平移；這裡長度由條件決定、兩端交替獨立推進。

## Common Mistakes

第一，收縮 left 時忘記同步更新狀態——只寫 `left++` 卻沒有先執行 `sum -= nums[left]`（或沒把頻率表對應計數減一），視窗狀態從此與實際內容脫節。第二，把內層 while 誤寫成 if：單次擴張後可能需要連續收縮多步才到達最緊邊界，if 只縮一步，會讓「最短」答案偏長。第三，記錄答案的時機放錯原型：找最短要在收縮迴圈內、視窗仍滿足條件時記錄；找最長則要在收縮結束、視窗恢復合法後記錄——兩者互換都會漏掉正確答案。第四，忘記處理無解情形，例如全陣列總和都達不到 target 時應回傳 0。

## Complexity

時間複雜度為均攤 O(n)：left 與 right 都只前進不後退，每個元素至多被 right 納入一次、被 left 吐出一次，指標移動總量不超過 2n，因此內層 while 雖是巢狀，整體仍是線性。空間複雜度依狀態而定：總和類問題只需常數變數，為 O(1)；需要維護視窗內字元或元素頻率表時為 O(k)，k 是視窗內相異元素的數量。

## Digest

可變視窗用 right 擴張、left 收縮來搜尋最佳連續區間，成立前提是單調性：擴張朝「滿足」推進、收縮朝「不滿足」推進。兩種原型要分清——找最短是「滿足時收縮」、在收縮迴圈內記錄答案；找最長是「違規時收縮」、恢復合法後才記錄。正確性來自「對每個 right，left 都停在最緊邊界」；效率來自兩指標只前進不回頭，每元素至多一進一出，均攤 O(n)。收縮時務必同步更新狀態，內層要用 while 不是 if。

## TypeScript Tip

以「總和 >= target 的最短子陣列長度」示範找最短原型：滿足條件時先記錄再收縮。`noUncheckedIndexedAccess` 下索引存取用 `!` 收斂型別。

```typescript
import assert from "node:assert";
function minSubArrayLen(target: number, nums: number[]): number {
  let left = 0;
  let sum = 0;
  let best = Infinity;
  for (let right = 0; right < nums.length; right++) {
    sum += nums[right]!;
    while (sum >= target) {
      best = Math.min(best, right - left + 1);
      sum -= nums[left]!;
      left++;
    }
  }
  return best === Infinity ? 0 : best;
}
assert.strictEqual(minSubArrayLen(7, [2, 3, 1, 2, 4, 3]), 2);
```

## Python Tip

同一題的 Python 寫法：用 `float("inf")` 當初始最佳解，最後判斷是否從未更新以回傳 0。

```python
def min_sub_array_len(target: int, nums: list[int]) -> int:
    left, total = 0, 0
    best = float("inf")
    for right, value in enumerate(nums):
        total += value
        while total >= target:
            best = min(best, right - left + 1)
            total -= nums[left]
            left += 1
    return 0 if best == float("inf") else int(best)

assert min_sub_array_len(7, [2, 3, 1, 2, 4, 3]) == 2
```

## Takeaway

可變視窗靠單調性成立：right 擴張、left 只進不退，每元素至多一進一出，均攤 O(n) 找出最短或最長合法區間。

## Tomorrow Preview

明天轉入 Fast-Slow Pointers（快慢指標）：同樣是兩個同向指標，但職責改為「快指標掃描、慢指標寫入」，在 O(1) 額外空間內完成陣列元素的原地移除與壓縮。

## Today's Challenge

- **209** · 找總和 >= target 的最短子陣列，正數陣列保證單調性，是「滿足時收縮」原型的標準示範，並附帶無解回傳 0 的邊界處理。
  - Hint: right 擴張累加總和，一旦達標就在 while 內先記錄長度再收縮 left，收縮時記得同步扣掉 nums[left]。
