---
id: dp-memoization-top-down
title: Top-Down DP with Memoization
module: dynamic-programming
pattern_label: Memoization
complexity_label: O(n) / O(n)
estimated_minutes: 15
exit_criteria:
  - 能夠在遞迴函式中加入快取檢查與更新邏輯
  - 能正確初始化快取陣列的大小與預設值
---
## Concept

昨天你已經用樸素遞迴解過 198，也在課文裡數過爬樓梯的呼叫樹、辨過它與費波那契只差 base case，量出共同的病灶：爬 10 階只有 11 個相異狀態，卻呼叫 177 次；`[1, 9, 3, 8, 2, 0]` 這組 198 只有 8 個狀態，呼叫 41 次。今天是這條線的第二輪，只換一件事：在遞迴函式外面掛一張表，算過的狀態存進去，再被問到就直接回傳。函式定義、轉移式、base case 一個字不改。這個做法叫 Memoization（記憶化），配上原本自頂向下的遞迴，就是 Top-Down DP。

一次呼叫的順序固定四步：先處理 base case；再查快取，命中就回傳；未命中才真的計算；算完先寫入快取、再回傳。順序不是風格問題，Thinking 與 Common Mistakes 會逐一說換序會壞在哪。

為什麼掛一張表就能把指數壓成線性？先寫下兩個前提。前提一：轉移只指向「更靠近 base case」的狀態——`solve(i)` 只呼叫 `solve(i + 1)`、`solve(i + 2)`，`ways(k)` 只呼叫 `ways(k - 1)`、`ways(k - 2)`，依賴關係沒有環。前提二：函式是純的——回傳值只由參數決定，不讀會變動的外部狀態，所以同參數永遠同答案，存起來的值才有資格被重用。在這兩個前提下，命題有兩半：每個狀態的計算本體最多執行一次（次數），且命中時回傳的值與當場重算的結果相同（正確性）。論證：狀態 s 第一次進入計算本體時，它發出的呼叫全都指向更靠近 base case 的狀態，前提一保證這些呼叫不會繞回 s，所以 s 的本體一定會走到寫入快取那一行才結束；此後任何對 s 的呼叫都在查表那一步命中，本體不再執行——次數這一半只用到前提一。正確性那一半靠前提二：命中回傳的是當初算出的值，同參數同答案才使它與此刻重算的結果相同，省下的計算不會改變答案。於是本體執行次數 ≤ 狀態數；每次本體只做常數工作、最多發出兩次呼叫，總呼叫數 ≤ 2 × 狀態數 + 1。198 有 n 個狀態、爬樓梯 n + 1 個，時間 O(n)。前提破了會怎樣：若依賴有環（s 的轉移又問到 s），快取是回傳前才寫入的，環裡永遠查不到，一樣無窮遞迴；若函式偷讀了會變的外部變數，快取回傳的是過期的值，答案錯而且不報錯。

## Thinking

在昨天的遞迴上加快取，照四步走，每一步都有一個要決定的東西。

第一，函式的參數就是快取的 key。`solve(i)` 只有 i 一個參數，快取是一維陣列；參數多一個，維度就多一個。

第二，base case 要不要放在查快取之前，看參數會不會超出快取範圍。198 的 `solve(i + 2)` 會讓 i 到達 n + 1，所以先用 `i >= n` 接住、再查表，快取只需要 n 格（i 從 0 到 n - 1）；爬樓梯的 k 永遠落在 0 到 n，先查表也安全，快取要 n + 1 格。

第三，預設值（哨兵）必須是「不可能成為答案」的值。搶劫金額 ≥ 0，用 -1；走法數 ≥ 1，用 0 也行；若答案可能是負數或 -1（有些題用 -1 表示無解），就改用 `undefined`／`None`，或乾脆用 `Map`／`dict`，以「有沒有這個 key」判斷命中。

第四，先寫入再回傳。所有回傳路徑都要經過寫入——用一個 `res` 變數接住結果、寫入、回傳，就不會漏。

Python 的 `functools.cache` 一個裝飾器就把第二到第四步全包了，平常寫題用它很好；但它把快取大小與哨兵藏起來了，面試被要求手寫陣列版時，上面四個決定仍然要能講出來。

## Pattern Recognition

訊號跟昨天一樣：求第 n 項／最佳值／方法數、能寫成遞迴式、狀態數遠小於呼叫數。今天多一個判斷——什麼時候選 Top-Down，而不是明天的 Bottom-Up：你手上已經有一份對的遞迴，加快取是改動最小的路；狀態空間稀疏，只有一小部分狀態真的會被問到，遞迴只算被問到的；或轉移方向不直觀，先讓遞迴替你決定計算順序。什麼時候它不夠：狀態數本身是指數（參數裡帶集合或排列），快取根本存不下，那是回溯的地盤；遞迴深度會超過語言上限（Python 預設 1000 層），就要等明天的迭代版。

## Common Mistakes

四條，每條可由本篇 Tip 的程式碼改一處重現。

第一，算完沒寫入。刪掉 TypeScript Tip 的 `memo[i] = res;`，答案仍是 17，但 `computed` 從 6 變回 20；Python Tip 刪掉 `memo[k] = res`，`computed` 從 11 變回 177。快取形同虛設，而且答案是對的，只有計數器看得出來。

第二，哨兵撞到合法答案。TypeScript Tip 把 `fill(-1)` 改成 `fill(0)`、`!== -1` 改成 `!== 0`：最後一間房價值 0，`solve(5)` 的正確答案就是 0，每次都被當成「還沒算」重算，`computed` 變 7。這組輸入只多算一次，換一組尾端有很多 0 的輸入就會退回指數。

第三，快取少一格，兩種語言的死法不同。Python Tip 把 `[-1] * (n + 1)` 改成 `[-1] * n`，`memo[10]` 立刻 IndexError；TypeScript Tip 把查表那一行搬到 base case 之前，`memo[6]` 讀到 `undefined`，`undefined !== -1` 成立，函式回傳 `undefined`，答案變成 NaN——不報錯，只是錯。Python 還有一種靜默錯：把 `k <= 1` 改成 `k < 1`，`ways(1)` 會問 `ways(-1)`，`memo[-1]` 回繞到 `memo[n]`，`climb_memo(10)` 的答案從 89 變成 144 且不報錯。

第四，以為加了快取遞迴就沒有代價。Python Tip 的 `climb_memo(990)` 正常，`climb_memo(1000)` 拋 RecursionError：快取砍掉的是重複，砍不掉深度，深度仍等於 n。198 的 n 最多 100 沒問題；上限上千的題目要等明天的迭代版。

## Complexity

時間 O(n)：在「依賴無環、函式純」的前提下，每個狀態的本體最多執行一次（靠無環）、且命中回傳的值與重算相同（靠純），n 個（或 n + 1 個）狀態各做常數工作、各發出最多兩次呼叫。空間 O(n)：快取 n 格，加上遞迴深度最壞 n 層的呼叫堆疊——兩者同階，但堆疊那份是 Top-Down 特有的代價，明天會消失。

## Digest

昨天你用樸素遞迴解過 509、70、198，量出「狀態少、呼叫多」：爬 10 階 11 個狀態、177 次呼叫。今天只換一件事：函式定義、轉移式、base case 不動，在遞迴外面掛一張快取表。每次呼叫四步固定：先 base case、再查快取（命中即回傳）、未命中才計算、算完先寫入再回傳。要決定三件事：快取的 key 就是參數（198 一維）；大小等於會進入計算本體的狀態數（198 用 `i >= n` 先接住跳躍，n 格就夠；爬樓梯 k 在 0..n，要 n + 1 格）；哨兵必須是不可能成為答案的值（金額 ≥ 0 用 -1，答案可能為負就改用 `None`／`undefined`，或以 key 是否存在判斷）。為什麼變線性：在「轉移只指向更靠近 base case 的狀態（依賴無環）」與「函式純、同參數同答案」兩個前提下，每個狀態的本體最多執行一次（靠依賴無環：第一次執行時發出的呼叫都不會繞回自己，結束前已寫入，之後全部命中），且命中回傳的值與重算相同（靠函式純）；本體數 ≤ 狀態數，各做常數工作，總呼叫 ≤ 2 × 狀態數 + 1，O(n)。前提破了：有環則永遠查不到、照樣無窮遞迴；讀了外部可變狀態則回傳過期值。代價是遞迴深度仍等於 n（Python 預設上限 1000 層）。

## TypeScript Tip

昨天的 `robNaive` 只加三行：查表、計數、寫入。`computed` 是本體真正執行的次數：6 個狀態各一次，昨天是 41 次呼叫。

```typescript
function robMemo(nums: number[]): { best: number; computed: number } {
  const n = nums.length;
  const memo = new Array<number>(n).fill(-1); // 金額 ≥ 0，-1 不可能是答案
  let computed = 0;
  const solve = (i: number): number => { // 從第 i 間起能搶到的最大金額
    if (i >= n) return 0; // base case 先於查表：i 可達 n + 1
    if (memo[i]! !== -1) return memo[i]!; // 命中就回傳
    computed++; // 未命中才真的算
    const res = Math.max(nums[i]! + solve(i + 2), solve(i + 1));
    memo[i] = res; // 回傳前寫入
    return res;
  };
  return { best: solve(0), computed };
}
const r = robMemo([1, 9, 3, 8, 2, 0]);
if (r.best !== 17) throw new Error("bad answer");
if (r.computed !== 6) throw new Error("computed twice");
```

## Python Tip

k 永遠落在 0..n，所以查表可以放在 base case 前面，快取要 n + 1 格。n = 30 昨天要 2,692,537 次呼叫，今天本體只跑 31 次。

```python
def climb_memo(n: int) -> tuple[int, int]:
    memo = [-1] * (n + 1)               # 狀態 k 落在 0..n，共 n + 1 格
    computed = 0
    def ways(k: int) -> int:            # 走完剩下 k 階有幾種走法
        nonlocal computed
        if memo[k] != -1:               # k 永遠落在 0..n，可先查快取
            return memo[k]
        computed += 1                   # 只有未命中才真的算
        res = 1 if k <= 1 else ways(k - 1) + ways(k - 2)
        memo[k] = res                   # 回傳前寫入
        return res
    return ways(n), computed

assert climb_memo(10) == (89, 11)       # 昨天 177 次呼叫，今天 11 個狀態各算一次
assert climb_memo(30) == (1346269, 31)  # 昨天要 2,692,537 次
```

## Takeaway

遞迴不改，外掛一張表：base case、查表、計算、寫入四步固定；依賴無環讓每個狀態最多算一次，函式純讓快取的值可重用，指數變線性。

## Tomorrow Preview

明天是第三輪 Bottom-Up DP with Tabulation：同一題 198，把遞迴拿掉，從 base case 開始用迴圈把表格由小到大填滿；重點是表格的維度與初始值怎麼決定、迴圈為什麼只能朝那個方向走，以及遞迴堆疊消失後空間剩下什麼。

## Today's Challenge

- **509** · 昨天的樸素版能過，今天練的是快取大小與哨兵：狀態 0..n 共 n + 1 格；`F(0) = 0` 是合法答案，若查表放在 base case 前面，哨兵就不能用 0。
  - Hint: `memo = [-1] * (n + 1)`，base case `n <= 1` 先於查表，算完寫入再回傳；加計數器確認 F(30) 的本體只執行 29 次（昨天 2,692,537 次呼叫）。
- **70** · 昨天 n = 45 會 TLE 的那份遞迴，今天加三行就過；k 永遠落在 0..n，是「查表可以放在 base case 前面」的例子。
  - Hint: 快取 n + 1 格；走法數 ≥ 1，哨兵用 -1 或 0 都行；先用 n = 10 驗證答案 89 且本體只跑 11 次，再提交。
- **198** · 三題裡唯一的 Medium。`solve(i + 2)` 會跳到 n + 1，是「base case 先於查表、快取只要 n 格」的活教材；答案 ≥ 0，哨兵用 -1。
  - Hint: `memo` 長度 n、填 -1；`if i >= n: return 0` 放最前面；`res = max(nums[i] + solve(i + 2), solve(i + 1))` 存入再回傳；n ≤ 100，遞迴深度沒問題。
