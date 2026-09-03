---
id: dp-core-concept-introduction
title: Dynamic Programming Core Concept Introduction
module: dynamic-programming
pattern_label: Overlapping Subproblems
complexity_label: O(n) / O(n)
estimated_minutes: 15
exit_criteria:
  - 能夠辨識何時遞迴呼叫存在重複計算
  - 能夠手動畫出呼叫樹並找出重疊
---
## Concept

動態規劃（DP）處理的是這樣一類問題：答案可以用「同一個問題的較小版本」的答案算出來。先修課教你把大問題拆成小步驟；DP 的拆法更特別——拆出來的小問題長得跟原問題一模一樣，只是規模小一點。以爬樓梯為例，定義 `ways(k)` 為「走完剩下 k 階的走法數」：第一步不是跨 1 階就是跨 2 階，所以 `ways(k) = ways(k - 1) + ways(k - 2)`，而 `ways(0) = ways(1) = 1`。這一行遞迴式叫「狀態轉移」，兩個出口叫「base case」。

把 `ways(5)` 的呼叫樹畫出來（在紙上畫一次，這是今天的作業）：

```
ways(5)
├─ ways(4)
│  ├─ ways(3)
│  │  ├─ ways(2) ─ ways(1), ways(0)
│  │  └─ ways(1)
│  └─ ways(2) ─ ways(1), ways(0)
└─ ways(3)
   ├─ ways(2) ─ ways(1), ways(0)
   └─ ways(1)
```

數一數：15 個節點，但參數只有 0 到 5 這 6 種。`ways(3)` 整棵子樹被完整展開了 2 次、`ways(2)` 3 次、`ways(1)` 5 次。這就是重疊子問題（Overlapping Subproblems）：相異狀態很少，呼叫卻很多，差距全部來自同一個狀態被反覆重算。n 變大時差距是指數級的——n = 10 時 11 個狀態、177 次呼叫；n = 30 時 31 個狀態、2,692,537 次；n = 45 要 3,672,623,805 次。

換句話說，慢不是因為「狀態太多」，而是因為「同一個狀態算了太多次」。這個診斷是整個 DP 模組的起點：只要每個狀態只算一次，工作量就從呼叫數掉回狀態數。怎麼做到，明天講。

這條線的路線圖：接下來幾課會用同一題 198（與 70）把同一個問題重解好幾輪，每一輪只換一件事——今天寫樸素遞迴並找出重疊；明天在它外面掛一張快取表；後天改成由底向上填表；再來把表壓成兩個變數；最後把這幾課的操作抽象成「取／不取」的決策 Pattern。題目不變，變的是解法，別把它當成原地踏步。

## Thinking

拿到一題，今天只做三步。

第一步，定義函式。用一句話寫出「參數代表什麼子問題、回傳值是什麼」——198 的定義是 `solve(i)` ＝「只考慮第 i 間之後的房子，能搶到的最大金額」，答案就是 `solve(0)`。定義寫不清楚，後面全部會歪。

第二步，寫轉移與 base case，兩者分開想。轉移問的是「第一個決策有哪幾種、每一種之後剩下什麼子問題」：站在第 i 間，搶它就拿 `nums[i]` 然後跳到 `solve(i + 2)`（相鄰不能搶），不搶就走 `solve(i + 1)`，取兩者較大：`solve(i) = max(nums[i] + solve(i + 2), solve(i + 1))`。base case 問的是「哪些參數小到不用再拆」：`i >= n` 時沒有房子可搶，回傳 0。注意是 `>=` 不是 `==`——`i + 2` 會越過 n 直接落在 n + 1。

第三步，先寫樸素遞迴，再量它。畫樹的規則很機械：每個節點寫參數，往下畫它發出的每一次呼叫，碰到 base case 就停；畫完把參數相同的節點圈起來數。n 稍大紙就不夠用，改讓程式數：在函式開頭放一個計數器，記下每個參數被呼叫幾次。`[1, 9, 3, 8, 2, 0]` 這組輸入，`solve(0)` 到 `solve(7)` 只有 8 個狀態，總共卻呼叫 41 次，`solve(5)` 一個狀態就被算了 8 次；n = 100（題目上限）的呼叫數約為 10 的 21 次方。直接提交會 TLE，這是今天預期的結果——你要交的是這棵樹和這組數字，AC 留給明天多加幾行的版本。

## Pattern Recognition

三個訊號同時出現，就是 DP 的地盤。一、題目問「第 n 項」「最大／最小」或「共幾種方法」。二、答案能用同一問題較小規模的答案寫成一行遞迴式。三、相異狀態數是多項式（爬樓梯是 n + 1 個），樸素遞迴的呼叫數卻是指數——這個落差就是重疊。兩個反例幫你劃界：Merge Sort 也是遞迴拆解，但每個子陣列各不相同、從不重複出現，存起來也沒有人會再問，那是分治，不是 DP；子集列舉的狀態本身就有 2 的 n 次方個，呼叫多是因為狀態真的多、不是重疊，那是回溯。

## Common Mistakes

四條，前三條各能用本篇 Tip 的程式碼改一處重現，第四條由 Tip 印出的計數直接證實。

第一，base case 邊界寫太窄。把 TypeScript Tip 的 `i >= nums.length` 改成 `i === nums.length`，`solve(5)` 會呼叫 `solve(7)`，它進不了出口、一路往上遞迴到拋出 RangeError；Python Tip 把 `k <= 1` 改成 `k == 1`，`ways(0)` 進不了出口，一路遞迴到 RecursionError。轉移會「跳」的時候，出口要用不等式接住所有越過的參數。

第二，轉移式對、base case 的值抄錯。Python Tip 的 `return 1` 改成 `return k`，`ways(10)` 從 89 變成 55——這正是 509 的 F(10)。費波那契和爬樓梯的轉移式一模一樣，差的只有起點；base case 是問題定義的一部分，不是隨手填的常數。

第三，轉移漏掉題目的約束。TypeScript Tip 的 `solve(i + 2)` 改成 `solve(i + 1)`，等於允許搶相鄰的房子，答案從 17 變成 23（六間全搶）。

第四，把慢歸咎於「n 太大」，於是去換更快的語言。`ways(10)` 的 177 次呼叫裡只有 11 個相異狀態，換語言只能把常數壓小，指數還在。看到「狀態少、呼叫多」，該想的是讓每個狀態只算一次。

## Complexity

今天的樸素遞迴：時間等於呼叫數，爬樓梯是 `2 * ways(n) - 1` 次、198 是 `F(n + 3) + F(n) - 1` 次（n = 6 時 41），都是指數級（約 1.618 的 n 次方）；空間是遞迴深度 O(n)。frontmatter 標的 `O(n) / O(n)` 是這條線的終點——當每個狀態只被計算一次，時間就等於狀態數 n + 1，空間是 O(n) 的快取加上呼叫堆疊。今天先確認差距在哪，明天兌現。

## Digest

DP 處理的問題，答案能由「同一問題較小規模」的答案算出：爬樓梯 `ways(k) = ways(k - 1) + ways(k - 2)`，`ways(0) = ways(1) = 1`；198 定義 `solve(i)` 為第 i 間起能搶到的最大金額，`solve(i) = max(nums[i] + solve(i + 2), solve(i + 1))`，`i >= n` 回傳 0。今天的作業是把樸素遞迴寫出來、畫呼叫樹、數兩個數字：相異狀態數與呼叫數。`ways(5)` 的樹有 15 個節點但只有 6 種參數，`ways(2)` 被整棵重算 3 次、`ways(1)` 5 次；n = 10 是 11 個狀態對 177 次呼叫，n = 30 是 31 對 2,692,537。這個落差就是重疊子問題：慢不是狀態多，是同一狀態被反覆重算，換語言壓不掉指數。轉移與 base case 分開想：轉移問「第一個決策有哪幾種」，base case 問「哪些參數小到不用拆」；轉移會跳的時候，出口要用 `>=` 接住越過的參數。路線圖：接下來幾課用同一題 198／70 重解好幾輪，每輪只換一件事——明天掛快取、後天改由底向上填表、再來壓成兩個變數、最後抽象成取／不取的決策 Pattern。今天用樸素版提交 198 會 TLE，是預期結果。

## TypeScript Tip

樸素遞迴加 `Map` 計數器：8 個狀態、41 次呼叫，`solve(5)` 被算 8 次；斷言鎖答案與計數。

```typescript
function robNaive(nums: number[]): { best: number; calls: Map<number, number> } {
  const calls = new Map<number, number>();
  const solve = (i: number): number => {          // 從第 i 間起能搶到的最大金額
    calls.set(i, (calls.get(i) ?? 0) + 1);
    if (i >= nums.length) return 0;                // 沒有房子可搶
    return Math.max(nums[i]! + solve(i + 2), solve(i + 1)); // 搶 vs 不搶
  };
  return { best: solve(0), calls };
}
const { best, calls } = robNaive([1, 9, 3, 8, 2, 0]);
if (best !== 17) throw new Error("bad answer");
let total = 0;
for (const c of calls.values()) total += c;
if (calls.size !== 8 || total !== 41) throw new Error("8 states / 41 calls");
if (calls.get(3) !== 3 || calls.get(5) !== 8) throw new Error("recount");
```

## Python Tip

同一招量爬樓梯：`dict` 記每個 k 被呼叫幾次。n = 10 只有 11 個狀態，卻呼叫 177 次；`ways(2)` 被重算 34 次。

```python
def climb_naive(n: int) -> tuple[int, dict[int, int]]:
    calls: dict[int, int] = {}
    def ways(k: int) -> int:              # 走完剩下 k 階有幾種走法
        calls[k] = calls.get(k, 0) + 1
        if k <= 1:                        # 剩 0 階或 1 階都只有一種走法
            return 1
        return ways(k - 1) + ways(k - 2)  # 這一步跨 1 階，或跨 2 階
    return ways(n), calls

total, calls = climb_naive(10)
assert total == 89
assert len(calls) == 11 and sum(calls.values()) == 177  # 11 個狀態，卻呼叫了 177 次
assert calls[2] == 34 and calls[1] == 55                # ways(2) 被重算 34 次
```

## Takeaway

樸素遞迴慢不是狀態多，是同一狀態被反覆重算；畫呼叫樹、數出「狀態數 vs 呼叫數」的落差，就找到了重疊子問題。

## Tomorrow Preview

明天是 Top-Down DP with Memoization：函式定義、轉移式、base case 一個字不改，只在遞迴外面掛一張快取表，並證明每個狀態只會真正被計算一次——呼叫次數從指數掉回線性。

## Today's Challenge

- **509** · 遞迴式 `F(n) = F(n - 1) + F(n - 2)` 只有 n + 1 個狀態，卻是最容易畫出重疊的呼叫樹：`F(n - 2)` 同時掛在 `F(n)` 與 `F(n - 1)` 底下。n 上限 30，樸素遞迴約 270 萬次呼叫，提交能過。
  - Hint: base case 是 `F(0) = 0`、`F(1) = 1`（跟爬樓梯不同）；先寫樸素遞迴提交，再在本機加計數器印出每個 n 被呼叫的次數。
- **70** · 與 509 同一條轉移式、不同 base case（`ways(0) = ways(1) = 1`），拿來練「轉移與 base case 分開想」；n 上限 45，樸素遞迴要 36 億次呼叫，提交會 TLE。
  - Hint: 先在紙上畫 `ways(5)` 的呼叫樹，數出 `ways(2)` 出現 3 次、`ways(1)` 5 次；本機用 n = 10 驗證 89 種與 177 次呼叫，能提交的版本明天再補快取。
- **198** · 比前兩題多一個「搶或不搶」的決策，`max(nums[i] + solve(i + 2), solve(i + 1))` 是往後幾課反覆重解的主角；今天的目標是寫對樸素遞迴並量出重疊，不是 AC。
  - Hint: 定義 `solve(i)` 為第 i 間起能搶到的最大金額，base case 用 `i >= n` 接住 `i + 2` 的跳躍；本機拿 `[1, 9, 3, 8, 2, 0]` 驗證答案 17、8 個狀態 41 次呼叫。
