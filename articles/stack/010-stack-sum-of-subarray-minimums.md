---
id: stack-sum-of-subarray-minimums
title: Stack Sum of Subarray Minimums
module: stack
pattern_label: Monotonic Stack Boundary Extension
complexity_label: O(n) / O(n)
estimated_minutes: 25
exit_criteria:
  - 能判斷每個元素在維持最小值的前提下，向左與向右可延伸多遠。
  - 能利用邊界與 modulo 運算計算總貢獻。
---
## Concept

問題長這樣：對陣列的每一個連續子陣列各取最小值，把這些最小值全部加總（結果對 10^9 + 7 取模）。子陣列有 n(n+1)/2 個，逐一枚舉再各自掃最小值，最壞 O(n^2) 到 O(n^3)，行不通。破題靠貢獻法（contribution technique）：不問「每個子陣列的最小值是多少」，改問「每個元素在多少個子陣列裡擔任最小值」。設 arr[i] 在 cnt(i) 個子陣列中是最小值，答案就是所有 arr[i] * cnt(i) 的總和。為什麼相等？兩種算法枚舉的是同一批「子陣列與其最小值」的配對，只是前者按子陣列分組、後者按元素分組——重排求和順序不改變總和。剩下的工作只有一件：求出每個 cnt(i)，而它由左右邊界決定，正是 Monotonic Stack 的看家本領。

## Thinking

一個子陣列以 arr[i] 為最小值，等價於：它包含 i，且整段落在開區間 (L, R) 內——L 是 i 左側最近一個「嚴格小於 arr[i]」的索引（不存在則 -1），R 是右側最近一個「小於或等於 arr[i]」的索引（不存在則 n）。左端點可取 L+1 到 i 共 i - L 種，右端點可取 i 到 R-1 共 R - i 種，兩個選擇互相獨立，乘法原理給出 cnt(i) = (i - L) * (R - i)。為什麼一側嚴格、一側含等號？看 [2, 2]：若兩側都嚴格，兩個 2 都能跨越對方，子陣列 [2, 2] 被計兩次；若兩側都含等號，兩個 2 都把對方當牆，[2, 2] 沒人認領。一嚴一非嚴是唯一讓每個子陣列恰好被計一次的切法，效果等於規定：同值並列時由最右那次出現代表結算——它向左可跨越相等、向右遇相等即停。左右邊界用單調堆疊一趟求出：堆疊存索引、對應值由底至頂遞增；掃到 i 時，彈出所有對應值 ≥ arr[i] 的頂端 j——此刻 i 就是 j 的 R，彈出後的新頂端就是 j 的 L，「彈出即結算」的時機與 Daily Temperatures 同型。以 [3, 1, 2, 4] 驗證：1 的邊界 L = -1、R = 4，cnt = 2 * 3 = 6，貢獻 6；3、2、4 各貢獻 3、4、4，總和 17，與暴力枚舉一致。

## Pattern Recognition

兩個訊號指向貢獻法加單調堆疊：題目對「所有子陣列」的極值做加總或計數；且每個元素的作用範圍由兩側第一個突破大小關係的元素界定。求最大值總和時整套對稱翻轉，改找 previous / next greater。對照 prerequisite：Daily Temperatures 求單側「第一個更大」的距離，本課把同一副邊界骨架擴成雙側，並從回答距離升級為計數區間；Online Stock Span 的 span 累計是往左的一維吞併，本課則是左右兩側的選擇數相乘。反例：只查詢單一給定區間的最小值（sparse table 或線段樹）、或求子陣列的和而非極值（前綴和），不是這個模式。

## Common Mistakes

一、等號慣例兩側同款（左右兩趟分開求邊界的寫法容易犯）：同嚴格必重複計數、同含等號必漏算；一嚴一非嚴左右對調也正確，但整份程式必須從一而終——單趟版的單一彈出條件天然給出一嚴一非嚴，不會犯這個錯。二、對取模誠實：本題約束 n ≤ 3 萬，子陣列總數約 4.5 * 10^8、總和上界約 1.35 * 10^13，其實仍在 2^53 的安全整數內——逐步取模在這裡不是救命稻草，而是題目要求輸出餘數，順便讓同一副骨架能推廣到更大的 n 與值域。真正的陷阱是取模的位置：把 cnt 與元素值整串乘完才取模，在 32 位元整數或值域更大的變形裡會在取模前就先溢位；先對乘積的一部分取模再乘，中間值才有界。三、邊界預設值寫錯：L 不存在時是 -1、R 不存在時是 n，誤寫成 0 或 n - 1 會把貼邊的子陣列算漏。四、結算對象弄錯：彈出瞬間左右邊界到齊的是「被彈出的 j」，不是正在掃描的 i——i 只是 j 的右牆，i 自己的右界還在未來。

## Complexity

時間 O(n)：迴圈內雖有 while 連續彈出，但每個索引至多壓入一次、彈出一次，彈出總次數受壓入總次數限制，攤銷後整體線性。空間 O(n)：嚴格遞增的輸入讓掃描階段零彈出，堆疊存滿 n 個索引，這是最壞情況。

## Digest

所有子陣列最小值總和用貢獻法：arr[i] 的貢獻是 arr[i] * (i - L) * (R - i)，L 是左側最近嚴格小於者（無則 -1）、R 是右側最近小於或等於者（無則 n）。一側嚴格、一側含等號是去重關鍵：同值並列時固定由最右那次出現認領，每個子陣列恰被計一次。單調遞增堆疊（存索引）一趟求出全部邊界：對應值 ≥ 當前元素就彈出，彈出瞬間 R 是當前索引、L 是新頂端；尾端補哨兵 0 清空堆疊，殘留者的 R 統一是 n。每步累加後取模防溢位。時間 O(n)、空間 O(n)。

## TypeScript Tip

貢獻乘積先取模再乘元素值，中間值壓在 2^53 內，不必動用 BigInt；`noUncheckedIndexedAccess` 下已保證存在的索引用 `!` 收斂。

```typescript
function sumSubarrayMins(arr: number[]): number {
  const MOD = 1_000_000_007;
  let ans = 0;
  const stack: number[] = []; // 存索引，對應值由底至頂遞增
  for (let i = 0; i <= arr.length; i++) {
    const cur = i < arr.length ? arr[i]! : 0; // 尾端哨兵 0
    while (stack.length > 0 && arr[stack[stack.length - 1]!]! >= cur) {
      const j = stack.pop()!;
      const L = stack.length > 0 ? stack[stack.length - 1]! : -1;
      ans = (ans + (((j - L) * (i - j)) % MOD) * arr[j]!) % MOD;
    }
    stack.push(i);
  }
  return ans;
}
if (sumSubarrayMins([3, 1, 2, 4]) !== 17) throw new Error("assertion failed");
if (sumSubarrayMins([2, 2]) !== 6) throw new Error("assertion failed");
```

## Python Tip

Python 整數不會溢位，但每步取模讓數字保持小巧；`while stack and ...` 一行同時處理空堆疊與彈出條件。

```python
def sum_subarray_mins(arr: list[int]) -> int:
    MOD = 10**9 + 7
    ans = 0
    stack: list[int] = []  # 存索引，對應值由底至頂遞增
    for i in range(len(arr) + 1):
        cur = arr[i] if i < len(arr) else 0  # 尾端哨兵 0
        while stack and arr[stack[-1]] >= cur:
            j = stack.pop()
            left = stack[-1] if stack else -1
            ans = (ans + (j - left) * (i - j) * arr[j]) % MOD
        stack.append(i)
    return ans

assert sum_subarray_mins([3, 1, 2, 4]) == 17
assert sum_subarray_mins([2, 2]) == 6  # [2, 2] 只由右邊的 2 認領一次
```

## Takeaway

貢獻法翻轉分組：左嚴格、右含等號界定 (i - L) * (R - i) 個由 arr[i] 認領的子陣列，單調堆疊 O(n) 結清總和。

## Tomorrow Preview

明天進入 Largest Rectangle in Histogram 的核心：同一副 previous / next less 邊界骨架，用途從「數區間個數」換成「量最大寬度」——今天的等號去重慣例會在那裡以另一種身分登場。

## Today's Challenge

- **907** · 貢獻法加單調堆疊的原型題：每個元素的左右 less 邊界直接決定它認領的子陣列數，去重與取模兩個陷阱都在這裡現形。
  - Hint: 左界取嚴格小於、右界取小於或等於；彈出時結算被彈出的 j，貢獻為 arr[j] * (j - L) * (i - j)，逐步取模。
