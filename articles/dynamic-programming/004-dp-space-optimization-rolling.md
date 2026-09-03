---
id: dp-space-optimization-rolling
title: Space Optimization with Rolling Variables
module: dynamic-programming
pattern_label: Space Optimization
complexity_label: O(n) / O(1)
estimated_minutes: 20
exit_criteria:
  - 能夠分析狀態轉移方程式僅需依賴哪幾個過去狀態
  - 能夠以常數個變數取代完整的 DP 表格
---
## Concept

198 House Robber 你已經解過三輪：001 樸素遞迴（指數時間）、002 記憶化（O(n) 時間，快取加遞迴堆疊各一份 O(n)）、003 表格（O(n) 時間，`n + 1` 格陣列）。時間已經壓到底了，今天不動時間，**動空間**：把那 `n + 1` 格壓成兩個變數。

方法是**依賴分析**。回頭看昨天的轉移式 `dp[i] = max(dp[i-1], dp[i-2] + nums[i-1])`，右邊只出現 `i-1` 與 `i-2`。填 `dp[i]` 時只讀這兩格；填完之後，往後任何一格 `dp[j]`（j ≥ i + 1）讀的是 `dp[j-1]`、`dp[j-2]`，索引至少是 `i-1`——`dp[i-2]` 從此再也沒有人讀。既然沒人讀，就不必留著。

把這件事講成命題之前，先把前提說清楚，因為它不是永遠成立的：**（一）轉移式右邊的索引只有 `i-1`、`i-2` 這種固定偏移，沒有更早的格子、也沒有「對所有 j < i 取最大」這種整段區間；（二）最後只需要 `dp[n]` 這一個數值，不需要回頭查表重建「到底搶了哪幾間」**。在這兩個前提下，任何時刻只有最近兩格還會被讀到（前提一），而丟掉的格子也沒有別的用途（前提二），所以**兩個變數就夠**：`prev1` 扮演 `dp[i-1]`、`prev2` 扮演 `dp[i-2]`。前提一不成立時——例如轉移改成也看 `dp[i-3]`——就要三個變數，看整段前綴則壓不掉；前提二不成立時，重建路徑要讀回舊格子，表格必須留著。

翻譯是機械的：昨天的「填 `dp[i]`」變成「算 `cur = max(prev1, prev2 + nums[i-1])`」，然後把視窗右移一格：`prev2 = prev1`、`prev1 = cur`。**順序不能反**——`prev2` 要接的是「舊的 `prev1`」，先寫 `prev1 = cur` 再寫 `prev2 = prev1` 會讓兩個變數同時等於 `cur`，下一輪的 `dp[i-2]` 實際上變成 `dp[i-1]`，相鄰的兩間會被一起搶。Python 的 `prev2, prev1 = prev1, cur` 右邊先整組求值再指派，天生避開這個坑。

正確性靠不變式：**第 i 輪開始之前，`prev2 == dp[i-2]` 且 `prev1 == dp[i-1]`**。i = 2（迴圈第一次執行）：`prev2 = 0 = dp[0]`、`prev1 = nums[0] = dp[1]`，成立。假設第 i 輪開始前成立，這輪的 `cur` 就是 `dp[i]`，滾動後 `prev2 = dp[i-1]`、`prev1 = dp[i]`，正好是第 i + 1 輪開始前要的。迴圈在「第 n + 1 輪開始前」停下，此時 `prev1 == dp[n]`。n = 1 時迴圈不跑，`prev1 = nums[0]` 也對。

## Thinking

用 `[2, 7, 9, 3, 1]` 代一次：第 2 輪開始前 `(prev2, prev1) = (0, 2)`，算出 7；第 3 輪開始前 `(2, 7)`，算出 `max(7, 2 + 9) = 11`，正是昨天表格的 `dp[3]`；第 4 輪 `(7, 11)` → 11；第 5 輪 `(11, 11)` → 12。每一輪的兩個變數，就是昨天表格上緊貼著 `dp[i]` 左邊的兩格。

寫法三步：先寫出昨天那版表格（轉移對了才有資格壓）；圈出轉移式右邊所有索引，數有幾種固定偏移就開幾個變數，初始值抄表格的前幾格；最後把「寫 `dp[i]`」換成「算 `cur`、滾動變數」，回傳最後的 `prev1`。把每個變數想成表格上的一扇窗：`prev1` 永遠指著剛填好的那格，`prev2` 指著它左邊那格，窗子每輪右移，掉出窗外的格子就是被丟掉的。

## Pattern Recognition

轉移式右邊只出現 `i-1`、`i-2`、…、`i-K` 這種固定偏移，就是 K 個變數（K 大一點可以改用長度 K 的環狀陣列）。二維表格若每一列只看上一列，同樣的分析會告訴你只需要留兩列。反之，轉移要看整段前綴（對所有 j < i 取 max）、或題目要輸出路徑而不只是最佳值，就壓不掉——這時該保住的是正確性，不是那點空間。

## Common Mistakes

每一條都由本篇 Tip 的程式碼改一處得到。第一，**滾動順序反了**（TypeScript Tip）：`prev2 = prev1; prev1 = cur;` 對調成先 `prev1 = cur`，`rob([2, 7, 9, 3, 1])` 第 3 輪 `prev2` 已是 7，算出 `max(7, 7 + 9) = 16`，把相鄰的 7 和 9 一起搶了，最後回傳 20。第二，**把 Python 的同時指派拆成兩行**：`prev2, prev1 = prev1, max(prev1, prev2 + num)` 拆成先 `prev2 = prev1`、下一行 `prev1 = max(prev1, prev2 + num)`，第二行讀到的 `prev2` 已是新值，等於每間都搶，回傳 22（全部加總）。第三，**回傳錯的變數**：`return prev1` 寫成 `return prev2`，回傳的是 `dp[n-1]`，得到 11。第四，**初始值跟迴圈範圍不搭**：Python Tip 的 `prev2, prev1 = 0, 0` 改成 `0, nums[0]` 卻仍從第 0 間開始迴圈，第一間被算了兩次，`rob([2, 1, 1, 2])` 得 5（正解 4）——而 `[2, 7, 9, 3, 1]` 這組碰巧仍是 12，測資形狀要挑得出來。

## Complexity

時間仍是 O(n)，迴圈次數沒變。空間從昨天的 `n + 1` 格降到常數：`prev1`、`prev2`、`cur` 三個數，跟 n 無關。量一下差距：n 為十萬時，`number[]` 表格約 800 KB（每個 number 8 bytes），三個變數是 24 bytes。

## Digest

198 第四次登場，時間三課前就已是 O(n)，今天只動空間。依賴分析：轉移 `dp[i] = max(dp[i-1], dp[i-2] + nums[i-1])` 右邊只有 `i-1`、`i-2`，填完 `dp[i]` 後，之後每一格讀的索引都 ≥ `i-1`，`dp[i-2]` 再也沒人讀。前提：（一）右邊只有固定偏移，沒有更早的格子或整段區間；（二）只要 `dp[n]` 一個值，不用回頭重建路徑。兩者成立時兩個變數就夠——`prev1` 當 `dp[i-1]`、`prev2` 當 `dp[i-2]`，每輪 `cur = max(prev1, prev2 + nums[i-1])`，再**先** `prev2 = prev1` **後** `prev1 = cur`；順序反了兩個變數會同時等於 `cur`，相鄰兩間被一起搶。不變式：第 i 輪開始前 `prev2 == dp[i-2]`、`prev1 == dp[i-1]`，從 i = 2 起成立到 i = n + 1，回傳 `prev1`。前提一破（要看 `i-3`）就要三個變數，看整段前綴壓不掉；前提二破（要輸出路徑）表格必須留著。空間 O(n) → O(1)，時間不變。

## TypeScript Tip

跟昨天的表格版逐行對照：`dp[i-2]` → `prev2`、`dp[i-1]` → `prev1`、`dp[i]` → `cur`，迴圈範圍與 base case 一字不改。測資能擋下順序反、回傳 `prev2`、`prev2 + nums` 寫成 `prev1 + nums`。

```typescript
import { strict as assert } from 'node:assert';

function rob(nums: number[]): number {
  const n = nums.length;
  if (n === 0) return 0;
  let prev2 = 0;          // dp[i-2]
  let prev1 = nums[0]!;   // dp[i-1]
  for (let i = 2; i <= n; i++) {
    const cur = Math.max(prev1, prev2 + nums[i - 1]!);  // dp[i]
    prev2 = prev1;        // 先滾 prev2，再寫 prev1
    prev1 = cur;
  }
  return prev1;
}

assert.equal(rob([2, 7, 9, 3, 1]), 12);
assert.equal(rob([2, 1, 1, 2]), 4);
assert.equal(rob([1, 2, 3, 1]), 4);
assert.equal(rob([5]), 5);
assert.equal(rob([]), 0);
```

## Python Tip

這版讓迴圈從第 0 間跑起、兩個變數初始都是 0（沒有房子 = 0 元），處理 `nums[k]` 就是在算昨天的 `dp[k+1]`，不需要 n = 0 的守衛；同時指派右邊先整組求值。`climb` 是同一招套在爬樓梯上。

```python
def rob(nums: list[int]) -> int:
    prev2, prev1 = 0, 0     # 處理第 k 間之前：prev1 = dp[k]，prev2 = dp[k-1]（k = 0 時皆為 0）
    for num in nums:
        prev2, prev1 = prev1, max(prev1, prev2 + num)
    return prev1

def climb(n: int) -> int:
    a, b = 1, 1             # a = 到第 i 階的方法數，b = 到第 i+1 階
    for _ in range(n):
        a, b = b, a + b
    return a

assert rob([2, 7, 9, 3, 1]) == 12
assert rob([2, 1, 1, 2]) == 4
assert rob([5]) == 5
assert rob([]) == 0
assert climb(2) == 2 and climb(3) == 3 and climb(5) == 8
```

## Takeaway

轉移只看 `i-1`、`i-2` 且只要最終值時，兩個變數取代整張表；每輪先滾 `prev2` 再寫 `prev1`。

## Tomorrow Preview

明天是這條 198 路線的最後一站：把四天來對同一題的具體操作抽象成「取／不取、相鄰互斥」的決策型 Pattern，再處理環形變形（首尾相鄰時拆成兩段線性）與長度 1、2 的邊界。

## Today's Challenge

- **70** · 轉移 `dp[i] = dp[i-1] + dp[i-2]` 右邊只有兩個固定偏移，是 `a, b = b, a + b` 這行滾動寫法的原型；重點是初始值與迴圈次數要對上。
  - Hint: `a = b = 1`（到第 0、第 1 階各一種），跑 n 次 `a, b = b, a + b`，回傳 `a`。
- **198** · 第四次解它：時間三課前就已是 O(n)，今天只做依賴分析——右邊只有 `i-1`、`i-2`，且只要最終金額——把昨天的表格換成 `prev1`、`prev2`。
  - Hint: `prev2 = 0`、`prev1 = nums[0]`，i 從 2 到 n：`cur = max(prev1, prev2 + nums[i-1])`，先 `prev2 = prev1` 再 `prev1 = cur`；回傳 `prev1`（n = 0 回傳 0）。
