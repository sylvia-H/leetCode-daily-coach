---
id: dp-knapsack-01-basic
title: 0/1 Knapsack Basic Pattern
module: dynamic-programming
pattern_label: 0/1 Knapsack
complexity_label: O(N*W) / O(W)
estimated_minutes: 25
exit_criteria:
  - 能夠理解每個物品只能選一次的限制下的狀態轉移
  - 能夠解釋為什麼一維空間優化時容量迴圈必須由大到小反向進行
---
## Concept

0/1 背包（0/1 Knapsack）：n 件物品，第 i 件重量 `w[i]`、價值 `v[i]`，背包容量 W，每件至多拿一次，求總重不超過 W 的最大總價值。「每件物品只有取與不取」這副決策骨架你在 House Robber 那一課已經用過，那裡的限制是「相鄰互斥」，今天換成「總重量不超過 W」。限制從「和上一格的關係」變成「一個全域資源」，狀態就多了一個維度：光記「考慮到第幾件」不夠，還得記「剩多少容量」。

定義 `f[i][w]`：只考慮前 i 件物品、容量上限 w 時的最大價值。轉移把兩條分支寫進一個 max：

`f[i][w] = max(f[i-1][w], f[i-1][w - w[i]] + v[i])`（第二項只在 `w >= w[i]` 時存在）

第一項是不取第 i 件，容量原封不動交給前 i-1 件；第二項是取，先騰出 `w[i]` 的空間，剩下的容量交給前 i-1 件去做到最好，再加上 `v[i]`。基底 `f[0][w] = 0`（一件都沒有，價值 0），答案 `f[n][W]`。這張表和 Grid Path Counting、Minimum Path Sum 的網格填表長得一樣：第 i 列只看第 i-1 列，所以滾動壓縮直接適用。本課不重教填表，主戰場只有一件事：壓成一維之後，容量迴圈的方向。

## Thinking

**轉移為什麼對（cut-and-paste）。** 任一組「前 i 件、總重不超過 w」的最佳選法，要嘛不含第 i 件——那它就是前 i-1 件、容量 w 的一種選法，價值不超過 `f[i-1][w]`；要嘛含第 i 件——把它拿掉，剩下的是前 i-1 件、總重不超過 `w - w[i]` 的一種選法，價值不超過 `f[i-1][w - w[i]]`。兩種情況都被 max 的其中一項蓋住，而 max 的兩項本身各對應一種合法選法，所以 max 恰好等於最佳值。這段論證只用到「第 i 件至多一次」——拿掉之後剩下的那組裡不會再有第 i 件，所以第二項才能讀 `f[i-1]`。這也是它跟明天完全背包分道揚鑣的地方。

**壓成一維，方向為什麼非反向不可。** 前提：重量都是非負整數（整數才能拿容量當陣列索引；非負即 `w[i] >= 0`），這樣 `w - w[i] <= w`，讀取只會往左看，不會往右。用一條陣列 `dp` 輪流當第 i-1 列和第 i 列，要維持的不變式是：「開始處理第 i 件之前，`dp[w] = f[i-1][w]` 對所有 w 成立；處理完第 i 件之後，`dp[w] = f[i][w]` 對所有 w 成立。」i = 0 時 dp 全 0，正是 `f[0]`，基底成立。歸納步：更新 `dp[w]` 要讀 `dp[w - w[i]]`，而它必須還是**第 i-1 列的舊值**。容量迴圈由 W 往下走到 `w[i]`，走到 w 時只有 `dp[w+1..W]` 被改過、`dp[0..w]` 全是舊值，`w - w[i] <= w` 落在未動區，讀到的正是 `f[i-1][w - w[i]]`；前提在這一步被用掉——若允許負重量，`w - w[i]` 會落到已改過的右側。反過來正向走，走到 w 時 `dp[w - w[i]]` 已在本輪被改成 `f[i][w - w[i]]`，那個值可能已經含了第 i 件，再加一次 `v[i]` 就是同一件拿了兩次。

**跟 Minimum Path Sum 對照就記得住。** 那一課把網格壓成一維時用正向：`dp[j] = grid[i][j] + min(dp[j], dp[j-1])`，因為左鄰 `dp[j-1]` 要的**就是本列的新值**、上方 `dp[j]` 要的是舊值。0/1 背包的 `dp[w - w[i]]` 要的是舊值，所以方向反過來。方向不是口訣，是「這一格需要的是新值還是舊值」的答案。

**用 TypeScript Tip 的資料驗證。** `weights = [1, 3, 4]`、`values = [15, 20, 30]`、`W = 4`：正解 35（取重量 1 與 3，不取 4）。只把 `for (let w = W; w >= wi; w--)` 改成 `for (let w = wi; w <= W; w++)`，答案變 60——重量 1 的物品被拿了四次（4 × 15）。`W = 3` 時正解 20，正向得 45（重量 1 拿三次）。

## Pattern Recognition

三個訊號同時出現就是 0/1 背包：一組物品各有代價（重量）與效益（價值，或只是「湊不湊得到」）；一個全域資源上限；每件至多用一次。它常偽裝成「能不能剛好湊出某個和」：把價值拿掉、`dp` 改成布林、`dp[0] = true`，轉移變成 `dp[w] = dp[w] || dp[w - num]`；再變成「有幾種湊法」，就把 `||` 換成 `+=`。今天兩題都是這種偽裝：把陣列分成兩個和相等的子集，等於問「能否湊出總和的一半」；給每個數配正負號湊出目標，代換後等於問「有幾個子集的和是 `(sum + target) / 2`」。反之，物品可以無限拿（硬幣、無限供應）就不是今天的模型，那是明天的課。

## Common Mistakes

每一條都由本篇 Tip 的程式碼施加單一改動實測：

- **容量迴圈寫成正向**：上面算過，`[1, 3, 4] / [15, 20, 30] / W = 4` 從 35 變 60。Python Tip 的 `range(target, num - 1, -1)` 改成 `range(num, target + 1)` 後，`[1, 2, 5]`（總和 8、目標 4）從 False 變 True——1 被用了四次湊出 4。
- **漏掉 `w == w[i]` 那一格**：把 `w >= wi` 改成 `w > wi`，重量 1 的物品永遠填不到 `dp[1]`、重量 3 的填不到 `dp[3]`，`W = 4` 從 35 掉成 20、`W = 3` 從 20 掉成 15。
- **布林版忘了 `dp[0] = True`**：「湊出 0」是唯一的種子，刪掉它以後整張表全 False，`[1, 5, 11, 5]` 從 True 變 False。
- **兩條分支只留一條**：把 `Math.max(dp[w]!, dp[w - wi]! + vi)` 改成只剩 `dp[w - wi]! + vi`（每件必取），`W = 4` 得 30——重量 4 的物品把 35 蓋掉。「不取」不是預設值，是和「取」平起平坐的一條分支；Python Tip 用 `[3, 2, 5, 4]`（{3, 4} 與 {2, 5}）同樣守住它——每件必取時，最後一件 4 會用 `dp[3]` 的 False 覆寫已經湊出 7（2 + 5）的 `dp[7]`。

## Complexity

時間 O(N * W)：每件物品掃一次容量軸。空間 O(W)：一條長度 W + 1 的陣列取代整張表，前提是每列只依賴上一列。注意 W 是數值不是輸入長度，這是偽多項式（pseudo-polynomial）時間：W 若大到十億，表就有十億格。

## Digest

0/1 背包：每件物品至多拿一次，容量上限 W，求最大價值。狀態 `f[i][w]` = 只用前 i 件、容量 w 的最佳值，轉移 `f[i][w] = max(f[i-1][w], f[i-1][w - w[i]] + v[i])`：第一項不取、第二項騰出 `w[i]` 再取；正確性靠 cut-and-paste——最佳選法不含第 i 件就落在第一項，含就拿掉它落在第二項，拿掉後剩下的不會再有第 i 件，所以兩項都讀上一列。壓成一維時，**在重量都是非負整數的前提下**，容量迴圈必須由 W 往下走：走到 w 時 `dp[0..w]` 還沒被本輪改過，`dp[w - w[i]]` 讀到的是上一列的舊值，第 i 件才不會被算兩次；正向走會讀到已含第 i 件的新值，`[1, 3, 4] / [15, 20, 30] / W = 4` 從 35 變成 60（重量 1 拿了四次）。對照 Minimum Path Sum：左鄰要的是本列新值所以正向，這裡要的是舊值所以反向。變體：布林「能否湊出」用 `||`、計數「幾種湊法」用 `+=`。O(N * W) / O(W)。

## TypeScript Tip

一維反向掃容量；`weights[i]!` 是 `noUncheckedIndexedAccess` 下的型別收斂。

```typescript
import { strict as assert } from "node:assert";

function knapsack01(weights: number[], values: number[], W: number): number {
  const dp: number[] = new Array<number>(W + 1).fill(0);   // dp[w]：容量 ≤ w 的最大價值
  for (let i = 0; i < weights.length; i++) {
    const wi = weights[i]!, vi = values[i]!;
    for (let w = W; w >= wi; w--) {                        // 反向：dp[w - wi] 仍是上一列
      dp[w] = Math.max(dp[w]!, dp[w - wi]! + vi);          // 不取 vs 取
    }
  }
  return dp[W]!;
}

const ws = [1, 3, 4], vs = [15, 20, 30];
assert.equal(knapsack01(ws, vs, 4), 35);   // 取 1+3、不取 4；正向會得 60（重量 1 拿了四次）
assert.equal(knapsack01(ws, vs, 3), 20);   // 只放得下重量 3 或重量 1，取 20
assert.equal(knapsack01(ws, vs, 0), 0);
```

## Python Tip

同一副骨架換成布林：能否恰好湊出總和的一半。

```python
def can_partition(nums: list[int]) -> bool:
    total = sum(nums)
    if total % 2:
        return False
    target = total // 2
    dp = [False] * (target + 1)   # dp[w]：能否恰好湊出 w
    dp[0] = True
    for num in nums:
        for w in range(target, num - 1, -1):   # 反向：dp[w - num] 仍是上一列
            dp[w] = dp[w] or dp[w - num]
    return dp[target]

assert can_partition([1, 5, 11, 5]) is True    # {1, 5, 5} 與 {11}
assert can_partition([1, 2, 5]) is False       # 目標 4：正向會把 1 用四次而誤判 True
assert can_partition([3, 2, 5, 4]) is True     # {3, 4} 與 {2, 5}：每件必取會漏掉它
assert can_partition([1, 2]) is False          # 總和為奇數
```

## Takeaway

0/1 背包＝「取／不取」多一個容量維度；重量非負時反向掃容量，讓 `dp[w - w[i]]` 讀到的還是上一列。

## Tomorrow Preview

明天是完全背包（Unbounded Knapsack）：同一件物品可以無限次拿。轉移的第二項改讀本列，一維迴圈因此翻成正向——把今天的反例倒過來看就懂了。

## Today's Challenge

- **416** · 沒有價值只有重量：能否選出一個子集，和恰好等於總和的一半。布林版 0/1 背包，`dp[0] = true`、反向掃容量。
  - Hint: 總和為奇數直接回 false；否則 target = sum / 2。外層物品、內層由 target 往下到 num，`dp[w] = dp[w] || dp[w - num]`，答案是 `dp[target]`。
- **494** · 給每個數配正負號湊出 target。設取正號的子集和為 P，則 P - (sum - P) = target，即 P = (sum + target) / 2——變成「有幾個子集的和恰為 P」的計數版 0/1 背包。
  - Hint: `sum + target` 為奇數或 `|target| > sum` 直接回 0。`dp[0] = 1`，外層物品、內層由 P 反向到 num，`dp[w] += dp[w - num]`；nums 含 0 時迴圈要跑到 w = 0，0 會讓計數翻倍，這是對的。
