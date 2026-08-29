---
id: hash-table-longest-consecutive-sequence
title: Set-Based Sequence Building and Boundary Check
module: hash-table
pattern_label: Sequence Hash Set
complexity_label: O(n) / O(n)
estimated_minutes: 15
exit_criteria:
  - 能將所有陣列元素插入 hash set
  - 能透過確認 element - 1 不存在，判斷某元素是否為序列的起點
---
## Concept

在無序陣列中找「最長連續整數序列」（例如 [100, 4, 200, 1, 3, 2] 中的 1、2、3、4），直覺是先排序再掃一遍，但排序要 O(n log n)。想做到 O(n)，關鍵是把「連續」從索引世界搬到數值世界：一個數 num 的鄰居不是它在陣列中的左右元素，而是 num - 1 與 num + 1。Hash Set 提供平均 O(1) 的存在性檢查，讓我們能直接問「num + 1 在不在」，完全不必排序。但光有 Set 還不夠——若對每個數都向上數一遍，整段連續區間裡的每個數都會重掃整段，最壞退化為 O(n^2)。解法是加上邊界檢查（Boundary Check）：只有當 num - 1 不在 Set 中，num 才是某段序列的起點，也只有起點才啟動計數。這一步把「每段序列被掃幾次」從段長次壓到恰好一次，整體時間才真正落在線性。

## Thinking

演算法分兩步。第一步，把所有元素放進 Hash Set，同時完成去重。第二步，走訪 Set 中的每個數 num：若 num - 1 存在，代表 num 被夾在某段序列的中間，直接跳過；若不存在，num 是起點，從 num + 1、num + 2 一路查上去，數出這段的長度並更新目前最大值。

為什麼跳過非起點仍然正確？每一段極大連續序列都恰有一個起點（它的最小值），該起點的計數會完整涵蓋段內每一個數——被跳過的數不會漏掉，只是把計算責任交給了自己所屬的起點。為什麼整體是 O(n)？雖然結構上是雙層迴圈，但內層只從起點展開，而每段序列只被自己的起點展開一次，所有內層步數加總恰等於 Set 的元素個數；換句話說，每個數最多被碰兩次（外層檢查一次、被所屬起點展開時一次），總操作數與 n 成正比。

## Pattern Recognition

三個訊號同時出現即對應此 Pattern：第一，題目問的是「數值上的連續」（相差恰為 1），而非索引上的相鄰；第二，輸入未排序，且要求優於 O(n log n)；第三，只需要長度或存在性，不需要維持順序輸出。它與前一課的 Prefix Sum Frequency 同屬「用 Hash 結構換線性時間」，但方向不同：前綴和處理的是索引連續的子陣列「總和」，本課處理的是數值連續的序列「長度」。看到 longest consecutive、「連續整數」這類關鍵詞，先想 Set 加起點過濾。

## Common Mistakes

第一，忘了邊界檢查：對每個數都向上展開，遇到 1 到 n 整段連續的輸入時，每個數都會把後面整段重掃一遍，時間退化為 O(n^2)——答案仍然正確，但過不了大測資。第二，在 Python 中用 list 做 `num - 1 in nums` 檢查：list 的成員檢查是線性掃描，每查一次 O(n)，整體同樣退化；必須先轉成 set 再查。第三，對重複元素的疑慮：Set 已自動去重，序列長度計的是相異數值的個數，直接走訪 Set（而非原陣列）就不會對同一個數重複做起點檢查。第四，TypeScript 以 for...of 走訪 Set 需要 target ES2015 以上，舊環境需開 downlevelIteration，否則編譯器會報錯；本專案設定已滿足，但要知道這個前提。

## Complexity

時間複雜度 O(n)：建 Set 是一次線性掃描；主迴圈中每個數最多被走訪兩次（一次外層起點檢查、一次被所屬起點展開），所有內層計數步數的總和不超過相異元素個數，因此整體與 n 成正比。空間複雜度 O(n)：Hash Set 需要儲存所有相異元素。

## Digest

在無序陣列中找最長連續序列，排序法要 O(n log n)，Sequence Hash Set 只要 O(n)：把所有數放進 Set 取得 O(1) 存在性檢查，再用邊界檢查鎖定起點——只有 num - 1 不存在的數才向上展開計數。正確性來自「每段極大序列恰有一個起點，起點的計數涵蓋整段」；線性時間來自「每段只被自己的起點展開一次，每個數最多被碰兩次」。忘記起點過濾、或誤用 list 做成員檢查，都會讓複雜度退化為 O(n^2)。

## TypeScript Tip

for...of 可直接走訪 Set，不必先轉成陣列；起點過濾用 continue，讓主流程保持扁平。

```typescript
function longestConsecutive(nums: number[]): number {
  const set = new Set(nums);
  let best = 0;
  for (const num of set) {
    if (set.has(num - 1)) continue;
    let len = 1;
    while (set.has(num + len)) len += 1;
    best = Math.max(best, len);
  }
  return best;
}
if (longestConsecutive([100, 4, 200, 1, 3, 2]) !== 4) throw new Error("assertion failed");
if (longestConsecutive([]) !== 0) throw new Error("assertion failed");
```

## Python Tip

先以 set(nums) 建集合，之後所有 in 檢查都是平均 O(1)；直接對 set 迭代即可，起點判斷放在迴圈開頭。

```python
def longest_consecutive(nums: list[int]) -> int:
    s = set(nums)
    best = 0
    for num in s:
        if num - 1 in s:
            continue
        length = 1
        while num + length in s:
            length += 1
        best = max(best, length)
    return best

assert longest_consecutive([100, 4, 200, 1, 3, 2]) == 4, "assertion failed"
assert longest_consecutive([]) == 0, "assertion failed"
```

## Takeaway

把所有數放進 Set，只從 num - 1 不存在的起點向上計數；每個數最多被碰兩次，O(n) 求得最長連續序列。

## Tomorrow Preview

明天進入資料結構設計題：結合 Hash Map 的 O(1) 定位與 Doubly Linked List 的 O(1) 拆接，打造 get 與 put 皆為常數時間的 LRU Cache。

## Today's Challenge

- **128** · 此 Pattern 的原型題：無序陣列求最長連續序列，完整用上 Set 存在性檢查、起點過濾與向上展開三個步驟。
  - Hint: 只有 num - 1 不在 Set 中才開始計數，向上查 num + 1、num + 2 直到中斷。
- **217** · 本課的暖身題：判斷是否有重複元素，是 Hash Set 存在性檢查的最小應用，體會 O(1) 查找如何取代排序。
  - Hint: 走訪時先查 Set 再加入，一查到已存在即可回傳。
