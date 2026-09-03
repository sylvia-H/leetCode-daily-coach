---
id: two-pointer-four-sum-extension
title: Four Sum Nested Reduction
module: two-pointer
pattern_label: Two Pointers - Multi-layer Fixed Pointers
complexity_label: O(n^3) / O(1)
estimated_minutes: 20
exit_criteria:
  - 能夠正確處理四個數字的巢狀迴圈與重複值略過邏輯
  - 理解剪枝優化（Pruning）在多重迴圈中的應用時機
---
## Concept

4Sum 把 3Sum 的降維遞推再疊一層：排序後用兩層迴圈固定 `nums[i]` 與 `nums[j]`，剩下的問題又變回「在 j 右側的已排序區間找兩數之和等於 `target - nums[i] - nums[j]`」——同一副對向夾擠。完備性論證與上一課同構：任何一組解按索引遞增排好，最小的兩個數必在某一輪 (i, j) 被同時固定，屆時另外兩數就在 j 右側，夾擠不會漏。層數的意義在於遞推：k 個數的和，固定一個就降成 k - 1 個數的和，固定到只剩兩個，永遠收在同一個兩端夾擠上——這就是 k-sum 的通用骨幹，4Sum 是它第一個需要「多層」的實例。代價是每多固定一層就多乘一個 n：暴力四層是 O(n^4)，這裡是 O(n^3)。

## Thinking

兩層固定＋夾擠照 3Sum 的寫法展開，真正新的功課有兩件。第一件是第二層的去重邊界。i 層照舊：i 大於 0 且 `nums[i] === nums[i - 1]` 就跳過；j 層卻必須寫成「j 大於 i + 1 才比較 `nums[j] === nums[j - 1]`」。因為 j 的第一個位置就是 i + 1，此時 nums[j] 與 nums[i] 同值是完全合法的組合——[2, 2, 2, 2] 找 8，唯一解就是四個 2；若無條件與前一個比，j 在起點就被跳掉，這類解整批消失。去重方向仍是「與前一個比、保留第一次出現」，理由上一課已論證。第二件是剪枝，每層各兩條、方向不同：在 i 層，若 `nums[i]` 加上緊鄰其後三個數（這一輪能湊出的最小和）已大於 target，更大的 i 只會更糟——break 整個外層；若 `nums[i]` 加上結尾三個最大數（這一輪的最大和）仍小於 target，這個 i 沒救、但更大的 i 還有機會——continue。j 層把「三個」換成「兩個」再寫一組。break 與 continue 不可互換：break 憑藉「往後單調變大」的全域結論，continue 只否定當前這一輪。

## Pattern Recognition

線索與 3Sum 一脈相承：同一個陣列取 k 個數、總和條件、要求輸出不重複的數值組合——排序、固定 k - 2 層、夾擠收尾。資料範圍也是訊號：n 只有兩百左右時，O(n^3) 完全負擔得起。反例同樣要認得：若四個數分別來自四個不同的陣列，或題目要求回傳原始索引，「同一陣列內的組合可任意重排」這個排序的前提就垮了——前者改用兩兩分組配雜湊表更合適，後者回到上一課說過的索引保存問題。

## Common Mistakes

第一名就是 j 層去重寫成無條件比較前一個，直接漏掉「前兩個數同值」的解。第二是剪枝方向弄反：把「這一輪最大和仍不足」寫成 break，會把後面還有機會的輪次全砍掉——這是漏解，不是變慢。第三是內層命中後忘了「兩指標都動＋各自跨過重複值」；這段與 3Sum 一字不差，層數變多後反而最容易漏抄。第四是語言特性：JavaScript 的 number 是浮點數，整數只在 2^53 - 1 內精確；本題數值約在正負十億內，四數相加最多約 4 * 10^9，遠低於安全上限，可放心直接加——但同一副骨架搬到 32 位元整數的語言就會溢位，動手前先核對數值範圍。

## Complexity

排序 O(n log n)；i、j 兩層產生 O(n^2) 組固定組合，每組內層夾擠至多 O(n)，整體 O(n^3)，排序項被吸收。剪枝與去重能大幅削減實際走訪量，但都不改變最壞情況的量級。輔助空間 O(1)（輸出與排序堆疊照慣例不計）。推廣：k-sum 固定 k - 2 層，時間 O(n^(k-1))。

## Digest

4Sum＝排序 → i、j 兩層固定 → 夾擠收尾，O(n^3)。三個必背細節：一、j 層去重要寫 `j > i + 1 && nums[j] === nums[j - 1]`——[2, 2, 2, 2] 找 8，無條件去重會把唯一解 [2, 2, 2, 2] 跳掉。二、剪枝每層兩條：這輪最小和已超過 target 就 break（往後只會更大）；這輪最大和仍不足就 continue（換更大的基準還有機會）。三、內層命中後兩指標都動並各自跨過重複值，與 3Sum 相同。完備性：每組解最小的兩個數必在某輪 (i, j) 被固定。k-sum 通用式：固定 k - 2 層、夾擠收尾、O(n^(k-1))。

## TypeScript Tip

j 層去重邊界值得用斷言釘死。下面把「兩層固定＋各自去重」抽出來，驗證 `j > i + 1` 這個條件保住了同值的合法配對：

```typescript
import assert from "node:assert";

function fixedPairs(a: number[]): number[][] {
  const res: number[][] = [];
  for (let i = 0; i < a.length - 1; i++) {
    if (i > 0 && a[i] === a[i - 1]) continue;
    for (let j = i + 1; j < a.length; j++) {
      if (j > i + 1 && a[j] === a[j - 1]) continue;
      res.push([a[i]!, a[j]!]);
    }
  }
  return res;
}

assert.deepStrictEqual(fixedPairs([2, 2, 2]), [[2, 2]]);
assert.deepStrictEqual(fixedPairs([1, 1, 2]), [[1, 1], [1, 2]]);
```

把條件改成無條件比較前一個，[2, 2, 2] 會回傳空陣列，第一條斷言立即失敗——這正是漏解的形狀。

## Python Tip

剪枝的兩條規則可以先脫離主程式獨立驗證：同輪最小和過大該 break、最大和不足該 continue，方向寫反就會漏解或白跑。這正是 early stopping 的精神——用排序保證的極值，提早否定整段搜尋。

```python
def prune(a: list[int], target: int, i: int) -> str:
    n = len(a)
    if a[i] + a[i + 1] + a[i + 2] + a[i + 3] > target:
        return "break"
    if a[i] + a[n - 3] + a[n - 2] + a[n - 1] < target:
        return "continue"
    return "search"

a = [-2, -1, 0, 0, 1, 2]
assert prune(a, -10, 0) == "break"
assert prune(a, 10, 0) == "continue"
assert prune(a, 0, 0) == "search"
```

## Takeaway

多固定一層就多一層責任：j 大於 i + 1 才去重；最小和過大用 break、最大和不足用 continue。

## Tomorrow Preview

明天暫別 k-sum 家族：Container With Most Water 用同一對指標從兩端夾擠「面積」，淘汰的依據從和的單調性換成短板效應。

## Today's Challenge

- **18** · 雙層固定＋夾擠的原型題：第二層去重邊界、兩級剪枝、內層跨重複值，每個環節都得寫對才過得了全部測資。
  - Hint: 排序後 i、j 各自去重（j 層要 j > i + 1 才比較）；命中後兩指標都動並跨過重複值。
