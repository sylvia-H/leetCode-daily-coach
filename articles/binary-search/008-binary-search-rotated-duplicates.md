---
id: binary-search-rotated-duplicates
title: Binary Search Rotated Array with Duplicates
module: binary-search
pattern_label: Binary Search
complexity_label: O(n) worst / O(log n) average
estimated_minutes: 20
exit_criteria:
  - '能偵測 nums[left] == nums[mid] == nums[right] 的情況並收縮邊界。'
---
## Concept

昨天的整套推論站在一個前提上：元素互異。判半條件 `nums[left] <= nums[mid]` 之所以能證明左半有序，是因為「旋轉點若在左半，前段值必**嚴格大於**後段值，`nums[left] > nums[mid]` 必成立」。允許重複後，嚴格大於退化成大於等於：旋轉點在左半時也可能 `nums[left] == nums[mid]`。於是等號從「左半有序的鐵證」變成無法區分的模糊訊號——被破壞的正是這一個判斷前提：**`nums[left] <= nums[mid]` 不再保證左半有序**，它可能只是旋轉點藏在同值之間、兩端剛好撞值。實際中招的樣子：`[1,0,1,1,1]` 找 0，mid = 2，`nums[0]` = 1 且 `1 <= 1`，昨天的邏輯宣告左半 `[1,0,1]` 有序（其實沒有），值域檢查發現 0 不在 [1, 1) 裡，於是把藏著答案的左半整個丟掉，安靜回傳找不到——第一課說過，這種不會爆炸的錯最難抓。

## Thinking

補救不是重寫，而是在昨天的三步前面加一道閘門：`nums[left] == nums[mid] == nums[right]` 三者全等時判不出哪半有序，就 `left++`、`right--` 各收一格，其餘情況照昨天的邏輯原樣走。兩件事必須說清楚。其一，閘門為何安全：進閘門前該輪已先確認 `nums[mid]` 不是 target，而被縮掉的兩個端點值都等於 `nums[mid]`，丟掉的都確定不是答案，不變式「target 若存在必在區間內」沒有被破壞——這也解釋了為何命中檢查必須放在閘門之前。其二，為何三者全等是**唯一**需要讓步的情況：若旋轉點真的落在左半，則 left 在前段、mid 與 right 同在後段（旋轉點只有一個），值被夾住成 `nums[mid] <= nums[right] <= nums[left]`；此時若又有 `nums[left] == nums[mid]`，三者必被擠成同值。反過來說，只要三者不全等，「`nums[left] <= nums[mid]` ⟹ 左半有序」照舊成立，昨天的判半與值域檢查原封不動可信。代價是閘門那一輪只縮兩格、不砍半——這正是最壞情況退化的來源。

## Pattern Recognition

題面在「排序陣列經旋轉」之外多說一句「可能包含重複元素」，就是本課的訊號；另一個線索是題目改要求回傳存在與否（bool）而非索引——同值多處時索引不唯一。複雜度標示寫成 O(n) worst / O(log n) average 也是這一族的指紋。

## Common Mistakes

一、照搬昨天的模板：不會無窮迴圈——更新恆為 mid ± 1，區間必縮——真正的後果是判錯有序半、丟掉含 target 的半邊，安靜回報找不到，`[1,0,1,1,1]` 找 0 就中招。二、把閘門寫成「三者全等就直接回傳 false」：全等只說明三個取樣點同值，中段仍可能藏著別的值，`[1,1,1,0,1]` 找 0 會被這種寫法漏掉。三、放寬成「任兩者相等就收縮」：收縮的安全性只由「與已檢查的 mid 同值」保證，`[1,1,2]` 找 2 時僅左端與中點相等就把 right 減一，會丟掉尚未檢查、值為 2 的端點而漏解。四、先縮後比：順序顛倒時閘門的安全前提不成立，最小反例是 `[1]` 找 1——區間被閘門直接縮空，目標明明在卻回報不存在。

## Complexity

閘門很少觸發時行為與昨天相同，平均 O(log n)。最壞情況：幾乎全同值、異值只有一格（如 `[1,1,1,1,0,1,1]`），每輪都撞上三者全等、只縮兩格，退化為 O(n)。這不是實作不夠聰明——n - 1 個同值加一個可能藏在任何位置的異值，靠比較無法排除任何一格，O(n) 是這個問題本身的下限。空間 O(1)。

## Digest

拿 `[1,0,1,1,1]` 找 0：第一輪 left = 0、right = 4、mid = 2，`nums[2]` = 1 非 target，三者全等（1, 1, 1）→ `left = 1`、`right = 3`。第二輪 mid = 2 仍非 target，`nums[1]` = 0 且 `0 <= 1` 判左半有序，0 在 [0, 1) → `right = 1`。第三輪 mid = 1 命中。公式：昨天的三步前面加一道閘門——三者全等時 `left++`、`right--`，安全因為丟的值等於已檢查的 `nums[mid]`；三者不全等時昨天的判半照舊可信。代價：最壞 O(n)，且是問題本身的下限，不是實作瑕疵。

## TypeScript Tip

```typescript
import assert from "node:assert";

function search(nums: number[], target: number): boolean {
  let left = 0, right = nums.length - 1;
  while (left <= right) {
    const mid = left + Math.floor((right - left) / 2);
    if (nums[mid] === target) return true;
    if (nums[left] === nums[mid] && nums[mid] === nums[right]) {
      left++; right--;
    } else if (nums[left]! <= nums[mid]!) {
      if (nums[left]! <= target && target < nums[mid]!) right = mid - 1;
      else left = mid + 1;
    } else if (nums[mid]! < target && target <= nums[right]!) {
      left = mid + 1;
    } else {
      right = mid - 1;
    }
  }
  return false;
}

assert(search([1, 0, 1, 1, 1], 0)); // 三者全等
assert(!search([1, 1, 1], 2));
assert(search([3, 1], 1));
assert(search([1], 1)); // 先比 mid 再進閘門
```

## Python Tip

```python
def search(nums: list[int], target: int) -> bool:
    left, right = 0, len(nums) - 1
    while left <= right:
        mid = left + (right - left) // 2
        if nums[mid] == target:
            return True
        if nums[left] == nums[mid] == nums[right]:
            left, right = left + 1, right - 1
        elif nums[left] <= nums[mid]:
            if nums[left] <= target < nums[mid]:
                right = mid - 1
            else:
                left = mid + 1
        elif nums[mid] < target <= nums[right]:
            left = mid + 1
        else:
            right = mid - 1
    return False

assert search([1, 0, 1, 1, 1], 0)
assert search([1, 1, 1, 0, 1], 0)  # 全等但中段藏著答案
assert search([3, 1], 1)
assert search([2, 5, 6, 0, 0, 1, 2], 0)
assert not search([1, 1, 1], 2)
```

## Takeaway

重複值讓 nums[left] == nums[mid] 判不出有序半：三者全等就各縮一格——丟的都等於已檢查的 mid，最壞退化為 O(n)。

## Tomorrow Preview

明天回到元素互異的旋轉陣列，找最小值（也就是旋轉點本身）：沒有 target 可比，改用 `nums[mid]` 與 `nums[right]` 的關係鎖定含斷點的那一半，並把 `right = mid` 這套不同的成套慣例練熟。

## Today's Challenge

- **81** · 昨天原題加上重複值：判半前提出現破口，必須偵測三者全等並收縮邊界，正是本課閘門的原樣落地。
  - Hint: 先檢查 `nums[mid]` 是否命中；再看 `nums[left] == nums[mid] == nums[right]`，全等就 `left++`、`right--`；其餘照「判有序半＋值域檢查」走，回傳 bool。
