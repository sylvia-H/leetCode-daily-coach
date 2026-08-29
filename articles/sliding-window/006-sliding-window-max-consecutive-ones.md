---
id: sliding-window-max-consecutive-ones
title: Max Consecutive Ones with Replacements
module: sliding-window
pattern_label: Variable Sliding Window
complexity_label: O(n) / O(1)
estimated_minutes: 20
exit_criteria:
  - 能追蹤視窗內最高頻元素或無效元素的數量。
  - 能依據 (window_length - max_freq <= k) 維持視窗合法性。
---
## Concept

把陣列裡至多 k 個 0 翻成 1，最長能得到多長的連續 1？關鍵的一步是換個讀法：答案視窗本身不必全是 1——它是「內含至多 k 個 0 的最長視窗」，翻轉只是事後把窗內的 0 補成 1。這一轉換讓題目落回你熟悉的可變視窗模板：閉區間 `[left, right]`，每輪先納入 `nums[right]`，違規（0 的個數超過 k）就收縮 left 到合法，合法後記錄 `right - left + 1`。與上一課的差別在狀態：無重複問題記「位置」，這裡只需要一個整數 zeros 記視窗內 0 的個數。

## Thinking

先做單調性檢查：把視窗縮小，0 的個數只會變少，「至多 k 個 0」的合法視窗不會因縮小而違規——約束單調，模板成立。流程三步：納入 `nums[right]`，是 0 就把 zeros 加一；`while zeros > k` 收縮——移出的 `nums[left]` 是 0 時 zeros 必須減一，這是本課最容易漏的一步；收縮完成、視窗合法，才記錄長度。對每個 right，left 停在「剛好合法」處，得到的就是以 right 結尾的最長合法視窗，逐輪取最大值即不漏解。

再談判準的一般形。你在 string 課的挑戰題（允許替換 k 個字元求最長同字元子字串）見過 `(right - left + 1) - maxFreq > k` 就收縮：視窗長度減去最高頻元素的次數，等於需要替換的元素個數。本課是它的特化，但特化方向要小心——這題只允許 0 翻成 1、不允許 1 翻成 0，被保留的元素只能是 1，所以判準是視窗長度減去窗內 1 的個數（即 zeros）≤ k，而不是減去「最高頻元素」。兩式在 0 比 1 多的視窗會給出不同結果，見 Common Mistakes 第 3 條。

## Pattern Recognition

訊號：「最長子陣列／子字串」加上「允許至多 k 次修改、翻轉、替換」。這類配額約束都單調（視窗縮小，所需修改次數不增），可變視窗直接套用。狀態怎麼選，看配額在數什麼：無效元素只有一種（本課的 0）就用單一計數器；替換對象不限定，就要頻率表加 maxFreq。另外 k = 0 時題目退化成「最長的全 1 連續段」，演算法不需任何特判、自然成立——這是檢驗實作的好用邊界。

## Common Mistakes

以下每一條都實際執行驗證過，注意失效形式各不相同：

1. 收縮時忘了還原計數：症狀取決於你追蹤哪個量，兩種都實際跑過。zeros 版（TS Tip 的寫法）的 while 條件只看 zeros，漏掉扣除後條件永遠為真，程式卡死在迴圈裡不會終止；ones 版（Python Tip 的寫法）的條件含視窗長度，left 前進會讓條件變假，程式正常結束，但 ones 把已移出窗外的 1 也算在內、低估窗內 0 的個數，輸入 `[1,0,1,1,0,1]`、k = 0 會安靜算出 4（正確為 2）。同一個疏漏，一種寫法掛住、另一種安靜算錯。
2. 在收縮完成前就記錄長度：把違規視窗的長度算進答案。輸入 `[1,0,1,1,0,1]`、k = 0，會得到 3（正確為 2）。記錄必須放在 while 之後。
3. 把一般形判準「長度 - maxFreq ≤ k」原樣搬來：0 比 1 多的視窗裡 maxFreq 是 0 的個數，等於允許把 1 翻成 0。輸入 `[0,0,0,1]`、k = 0 會得到 3（正確為 1）。判準必須綁定「只能翻 0」：zeros ≤ k。

## Complexity

時間複雜度 O(n)：right 每輪前進一步共 n 步；left 單調不回退，整個執行過程累計至多前進 n 步，內層 while 攤銷後為常數。空間複雜度 O(1)：狀態只有 left、zeros、best 三個整數，不需要任何隨輸入成長的結構。

## Digest

把「翻至多 k 個 0」讀成「找內含至多 k 個 0 的最長視窗」：納入 `nums[right]`（是 0 則 zeros 加一）→ `while zeros > k` 收縮（移出 0 時 zeros 減一）→ 合法後記錄 `right - left + 1`。例：`[1,1,1,0,0,0,1,1,1,1,0]`、k = 2 答案是 6。判準必須綁定「只能翻 0」：zeros ≤ k——搬一般形的「長度 - maxFreq ≤ k」會在 0 佔多數時偷翻 1，`[0,0,0,1]`、k = 0 會錯算成 3（正確 1）。收縮時忘了還原 zeros 則 while 永不結束、程式掛死。全程 O(n) 時間、O(1) 空間。

## TypeScript Tip

zeros 版：一個計數器就是全部狀態。`noUncheckedIndexedAccess` 下用 `!` 收斂索引存取：

```typescript
import assert from "node:assert";
function longestOnes(nums: number[], k: number): number {
  let left = 0, zeros = 0, best = 0;
  for (let right = 0; right < nums.length; right++) {
    if (nums[right]! === 0) zeros++;
    while (zeros > k) {
      if (nums[left]! === 0) zeros--;
      left++;
    }
    best = Math.max(best, right - left + 1);
  }
  return best;
}
assert.strictEqual(longestOnes([1, 1, 1, 0, 0, 0, 1, 1, 1, 1, 0], 2), 6);
assert.strictEqual(longestOnes([1, 1, 1], 0), 3);
assert.strictEqual(longestOnes([1, 0, 1, 1, 0, 1], 0), 2);
```

## Python Tip

同一模板的另一種寫法：追蹤窗內 1 的個數，判準寫成「長度 - ones > k」——與 zeros > k 等價，形式上對應一般形，但保留對象固定是 1：

```python
def longest_ones(nums: list[int], k: int) -> int:
    left = ones = best = 0
    for right, v in enumerate(nums):
        ones += v
        while (right - left + 1) - ones > k:
            ones -= nums[left]
            left += 1
        best = max(best, right - left + 1)
    return best

assert longest_ones([0, 0, 0, 1], 0) == 1
assert longest_ones([0, 1, 1, 0, 1], 1) == 4
assert longest_ones([1, 1, 1, 1], 0) == 4
```

## Takeaway

視窗合法＝內含至多 k 個 0；超額就收縮並同步還原計數，合法後才記錄長度，一遍掃完 O(n)。

## Tomorrow Preview

明天是 Fruit Into Baskets：配額從「至多 k 個 0」換成「至多兩種相異元素」，計數器升級成頻率表，收縮時要維護「某種元素次數減到 0 就少一種」的邊界。

## Today's Challenge

- **1004** · 「翻至多 k 個 0」等價於「找內含至多 k 個 0 的最長視窗」，是配額式可變視窗的原型題。
  - Hint: 納入 `nums[right]` 時累計 0 的個數，zeros > k 就收縮並在移出 0 時還原計數，合法後記錄長度。
