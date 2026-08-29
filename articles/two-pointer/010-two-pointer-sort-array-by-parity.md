---
id: two-pointer-sort-array-by-parity
title: Sort Array by Parity Partition
module: two-pointer
pattern_label: Two Pointers - Partitioning
complexity_label: O(n) / O(1)
estimated_minutes: 10
exit_criteria:
  - 能夠正確使用相向或同向指標將陣列依奇偶或特定條件分為兩群
  - 理解指標交會時迴圈即告結束的原則
---
## Concept

Sort Array by Parity Partition 把陣列課學過的對向雙指標從「驗證」升級為「搬動」：依某個條件（最典型是奇偶）把陣列原地分成前後兩群——偶數歸左、奇數歸右，群內順序不限。正確性靠一條三段式不變式：**[0, left) 已確定就位（偶數區）、(right, n-1] 已確定就位（奇數區）、[left, right] 是尚未檢查的未知區**。每輪迴圈只做一件事：縮小未知區。left 指到偶數（已在正確側）就 left++；right 指到奇數就 right--；兩者都停下，代表 left 停在放錯側的奇數、right 停在放錯側的偶數，交換一次同時修好兩個錯位。指標交會時未知區清空，不變式涵蓋整個陣列，分割即告完成。

## Thinking

實作骨架：left = 0、right = n - 1，`while (left < right)`。分支順序：先問 nums[left] 是否已就位，是就 left++ 進下一輪；再問 nums[right] 是否已就位，是就 right--；兩者皆否才交換，並同時 left++、right--。為什麼一定會結束？三個分支每輪都讓未知區至少縮小 1（交換分支縮小 2），未知區長度至多 n，所以至多 n 輪。為什麼交換後可以放心同時推進？因為交換那一刻兩端都已驗過：left 換來的是偶數、right 換來的是奇數，兩格都符合不變式，不推進只是白白重驗。終止沿用相向雙指標的慣例 `left < right`：left == right 那一格不需要處理——它左邊全是偶數、右邊全是奇數，這個元素無論奇偶，「偶前奇後」的分界都成立。

## Pattern Recognition

訊號：要求**原地**把陣列依布林條件分成兩群、群內順序不限——奇偶、正負、零與非零、小於 pivot 與否（快速排序的 partition 正是同一件事）。不需額外陣列是這個 Pattern 的招牌。反訊號：若題目要求保留群內相對順序（穩定分割），相向交換會打亂順序，得改用同向寫入的快慢指標（Move Zeroes 那一課的骨架）或額外空間；要分成三群以上，則升級為 Dutch National Flag 的三指標。

## Common Mistakes

一、條件寫反：讓 left 停在偶數、right 停在奇數再交換，等於把已就位的元素搬走，結果整組顛倒。二、用內層 while 掃描時漏掉 left < right 的守門：全偶陣列會讓 left 一路衝出陣列末端越界；本課的 if / elif 分支結構每輪重新檢查 left < right，不會有這個問題。三、交換後不推進指標：在分支結構裡下一輪會靠條件自我修正，只是多繞兩圈；但若寫成「不匹配就交換」的單一分支迴圈，交換後條件永遠不成立、指標永遠不動，就成了真正的無窮迴圈。四、誤以為分割是穩定的：交換會把右側元素直接甩到左側目前的位置，兩群內部順序都可能被打亂，題目若要求穩定就不能用這招。

## Complexity

時間 O(n)：每輪至少推進一步、至多 n 輪，每輪只做常數次奇偶判斷與至多一次 O(1) 交換。空間 O(1)：只用兩個索引與交換暫存。對照組：另開新陣列、偶數從頭填、奇數從尾填，同樣 O(n) 時間但多付 O(n) 空間——原地版的價值就在省下這筆。

## Digest

拿 [3, 1, 2, 4] 走一遍：left 停在 3（奇、錯位）、right 停在 4（偶、錯位），交換得 [4, 1, 2, 3] 並雙雙推進；left 停在 1、right 退到 2，再換得 [4, 2, 1, 3]，指標交錯——偶數 [4, 2] 全在前、奇數 [1, 3] 全在後。公式：left 找「不屬於左群的元素」、right 找「不屬於右群的元素」，各自停下就交換、同時推進；不變式「[0, left) 與 (right, n-1] 皆已就位」在交會時涵蓋全陣列。O(n) 時間、O(1) 空間，但群內順序不保證——要穩定就換同向寫入骨架。

## TypeScript Tip

解構賦值一行完成交換。開啟 `noUncheckedIndexedAccess` 後 nums[i] 的型別是 `number | undefined`，取模與交換前用 `!` 收斂（迴圈條件已保證索引合法）。

```typescript
import assert from "node:assert";

function sortByParity(nums: number[]): number[] {
  let left = 0;
  let right = nums.length - 1;
  while (left < right) {
    if (nums[left]! % 2 === 0) {
      left++;
    } else if (nums[right]! % 2 === 1) {
      right--;
    } else {
      [nums[left], nums[right]] = [nums[right]!, nums[left]!];
      left++;
      right--;
    }
  }
  return nums;
}

const res = sortByParity([3, 1, 2, 4]);
const firstOdd = res.findIndex((x) => x % 2 === 1);
assert.ok(res.slice(0, firstOdd).every((x) => x % 2 === 0));
assert.ok(res.slice(firstOdd).every((x) => x % 2 === 1));
assert.deepStrictEqual([...res].sort((a, b) => a - b), [1, 2, 3, 4]);
```

## Python Tip

Tuple unpacking 交換不需暫存變數；把「屬於左群」抽成參數，同一副骨架就能依任何條件分割。

```python
def partition(nums: list[int], belongs_left) -> list[int]:
    left, right = 0, len(nums) - 1
    while left < right:
        if belongs_left(nums[left]):
            left += 1
        elif not belongs_left(nums[right]):
            right -= 1
        else:
            nums[left], nums[right] = nums[right], nums[left]
            left += 1
            right -= 1
    return nums

res = partition([3, 1, 2, 4], lambda x: x % 2 == 0)
k = sum(1 for x in res if x % 2 == 0)
assert all(x % 2 == 0 for x in res[:k])
assert all(x % 2 == 1 for x in res[k:])
assert sorted(res) == [1, 2, 3, 4]
```

## Takeaway

left 找錯位、right 找錯位，交換一次修好兩個；未知區每輪縮小，指標交會即分割完成——O(n) 時間、O(1) 空間。

## Tomorrow Preview

Two Pointers 模組到此收官——從排序夾擠、淘汰論證、條件分支到原地分割，相向與同向兩副骨架都已到手。明天起進入新的模組，用同樣的節奏繼續推進。

## Today's Challenge

- **905** · 最純粹的條件分割：偶前奇後、順序不限，本課骨架直接落地。
  - Hint: left 找奇數、right 找偶數，兩者都停下就交換並同時推進；`while (left < right)` 收尾。
- **75** · 三種顏色的原地分類，把兩群分割升級為 Dutch National Flag 三指標。
  - Hint: 維護 low / mid / high 三區：mid 遇 0 與 low 交換後兩者都推進、遇 2 與 high 交換後 mid 不動（換來的元素還沒檢查）、遇 1 直接前進。
