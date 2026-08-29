---
id: problem-simplification-strategy
title: Problem Simplification Strategy
module: programming-mindset
pattern_label: Reduction
complexity_label: O(1) / O(1)
estimated_minutes: 15
exit_criteria:
  - 能把抽象問題化為長度為 1 或 2 的具體案例進行推導
---
## Concept

Problem Simplification Strategy（問題簡化策略）是化繁為簡的核心思維。面對結構複雜、狀態繁多的題目，人腦的工作記憶一次只能掌握少量變數，直接在腦中建構完整解法幾乎注定過載。突破口是主動縮減規模：把問題換成長度 1 或 2 的具體極小案例，親手推導從輸入到輸出的每一步。規模一小，干擾視線的雜訊被剝除，元素之間的互動與狀態轉移的規律就會浮現；接著再把規律逐步推廣回一般規模。這與上一課的迴圈不變量互為表裡：簡化策略負責「把規律找出來」，不變量負責「證明規律在重複執行中撐得住」——極小案例往往正是初始化步驟的第一筆驗證。

## Thinking

正確路徑是「由小到大」四步。第一，找出題目允許的最小有效輸入（Minimal Valid Input），例如長度 1 的陣列，甚至空陣列。第二，親手算出這個輸入的預期輸出，並把中間每一步寫下來——不要只在腦中模擬，寫下來才觀察得到狀態如何轉移。第三，把規模放大到 2、再到 3，重複推導並比對前後差異：新加入的元素改變了什麼？哪些量從上一步「接手」過來？這裡浮現的就是遞移關係。第四，推廣時逐步檢查：規模每加一，歸納出的規律是否仍成立？若在某個規模斷裂，代表案例太特殊或規律不完整——回到第三步，換一組不同數值的案例交叉驗證，排除數值巧合。

## Pattern Recognition

出現以下訊號就該啟動 Reduction 策略：第一，題目敘述極度抽象，涉及多維狀態或複雜的字串、陣列操作，讀完毫無頭緒；第二，官方範例的規模稍大、分支繁多，直接追蹤反而混亂；第三，你盯著空白編輯器許久無法下筆，腦中只有模糊概念而沒有具體的資料流向。此時最有力的一步不是硬想，而是拿出紙筆畫出長度 1 與 2 的案例——用動手推導取代空想，正是這個策略的精髓。

## Common Mistakes

最常見的錯誤是一開始就想寫出涵蓋所有特殊狀況的通用解：在還沒釐清基本案例（Base Case）行為前就堆疊大量 if-else，分支彼此牽制，程式碼迅速陷入高複雜度與邏輯漏洞。第二個誤區是只在腦中模擬而不動手寫，工作記憶一滿，規律就從指縫溜走。第三個較隱蔽的錯誤是簡化過頭：為了好算而把題目的關鍵約束一併剃掉，例如丟掉「不能重複使用同一元素」的限制，推出的規律就失去代表性，套回原題必然出錯——簡化的是規模，不是規則。

## Complexity

O(1) / O(1)。本課是思維策略而非具體演算法：簡化與推導發生在紙上，不消耗程式的時間或空間；最終解法的複雜度由你推廣出來的演算法自身決定。

## Digest

面對抽象繁雜的題目，主動把規模縮到長度 1 或 2 的具體案例，親手寫下每一步推導，觀察狀態轉移的規律，再逐步放大規模驗證推廣；規律若斷裂就換案例交叉驗證。例如求每個位置的前綴最大值：長度 1 的答案就是元素自己，長度 2 揭示規律——只需拿前一格的答案與目前值比較。切記簡化的是規模、不是規則——關鍵約束必須保留，規律才有代表性。找到規律後，交給迴圈不變量去證明它在重複執行中站得住。

## TypeScript Tip

先把極小案例寫成測試，讓直覺解通過它們，之後重構才有安全網：

```typescript
// 由長度 1、2 的案例歸納：每格只需「前一格的累積最大值」與目前值比較
function prefixMax(nums: number[]): number[] {
  const out: number[] = [];
  let best = -Infinity;
  for (const v of nums) {
    best = Math.max(best, v);
    out.push(best);
  }
  return out;
}
if (prefixMax([2]).join(",") !== "2") throw new Error("assertion failed");
if (prefixMax([2, 1]).join(",") !== "2,2") throw new Error("assertion failed");
if (prefixMax([2, 1, 3]).join(",") !== "2,2,3") throw new Error("assertion failed");
```

長度 1 驗證初始值，長度 2、3 驗證遞移——測試本身就是你的推導紀錄。

## Python Tip

善用互動式環境（REPL）即時驗證小案例，讓推導與驗證零距離：

```python
def max_pair_sum(nums: list[int]) -> int:
    assert len(nums) >= 2, "need at least two elements"
    a, b = sorted(nums)[-2:]
    return a + b

# 先驗長度 2 的最小案例，再放大規模觀察規律是否延續
assert max_pair_sum([1, 2]) == 3
assert max_pair_sum([5, 1, 9, 3]) == 14
```

在 REPL 中逐行輸入、立即看結果，等同於把手動推導自動化，特別適合檢驗你歸納出的遞移關係。

## Takeaway

解不動大問題就先解它的極小版本：用長度 1 或 2 的案例親手推導，規律浮現後再逐步推廣驗證。

## Tomorrow Preview

明天同樣有兩條路線：Edge Case Enumeration 會把今天這批極小輸入換一個用途——不是找規律，而是主動列舉邊界、驗證程式不會出錯；另一條進入 Array 的 In-Place Element Removal，用 Fast-Slow Pointers 在陣列上原地移除元素。

## Today's Challenge

本篇為觀念課，沒有對應的 LeetCode 練習題。請把時間花在把上面的觀念想透，並找一題曾卡住的題目，用長度 2 的案例重新推導一次。
