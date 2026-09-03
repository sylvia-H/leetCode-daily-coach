---
id: spacetime-tradeoff-awareness
title: Space-Time Tradeoff Awareness
module: programming-mindset
pattern_label: Tradeoff Analysis
complexity_label: O(n) / O(n)
estimated_minutes: 20
exit_criteria:
  - 能說明何時該用額外記憶體換取運算速度
---
## Concept

同一個資訊，你可以每次需要時重新計算，也可以算一次之後存起來、之後用查的。Space-Time Tradeoff Awareness 談的就是這個選擇：時間與空間往往無法同時最省——想讓程式跑得更快，通常要投資額外記憶體（雜湊表、快取、預先建好的表格）；想壓低記憶體用量，通常得接受重複計算或分批處理。

為什麼「多用記憶體」能換到速度？因為記憶體把「計算」變成「查表」。以雜湊表為例，key 經過雜湊函式直接映射到儲存位置，查一筆平均只要 O(1)，不必像線性掃描那樣逐一比對。凡是被重複執行的工作——同一個「這個值出現過嗎」被問了 n 次、同一段區間和被加了很多遍——都可以先算好存起來，讓後續每一次重複都只付查表的代價。

## Thinking

判斷「值不值得換」有三步。第一步估規模：n 為 10^5 時，O(n^2) 大約是 10^10 步，必然超時；此時把內層的線性查找換成雜湊表查詢，整體降為 O(n)，代價是 O(n) 的額外空間。反之若 n 只有 100，暴力解毫無壓力，任何額外結構都是多餘。規模從哪裡讀？上一課教你把題目的 Constraints 區塊當邊界清單的來源——同一個區塊也寫著 n 的上限，那正是估規模的直接輸入。

第二步找重複：空間換時間的獲利來源是「重複」。建表本身要花 O(n) 的時間與空間，這筆前期投資要靠之後的查詢攤平——查詢次數越多，每次從 O(n) 降到 O(1) 省下的時間累積越可觀；只查一兩次，建表反而是淨損失。

把前兩步套進一個具體例子：「找出陣列中第一個重複出現的數」。暴力解對每個元素往後掃描比對，n 為 10^5 時是 O(n^2)，必然超時；改成邊掃邊把看過的值放進 Set，每一步只問一次「出現過嗎」，一趟 O(n) 就完成——多付 O(n) 空間，換掉一整個數量級的時間，而且重複查詢（n 次）遠多於建表成本，投資穩賺。

第三步看方向：若瓶頸是記憶體而非時間（資料大到裝不下），就反過來用時間換空間——不保存中間結果、需要時重算，或改成分批處理，讓峰值記憶體只跟批次大小有關。兩個方向沒有絕對優劣，答案取決於當下的資源限制與資料規模。

## Pattern Recognition

正向訊號：暴力解會 Time Limit Exceeded；程式反覆回答「這個值存在嗎／出現過幾次」；同樣的子計算被執行很多遍。這些都指向用 Set、Map 或預建表格記錄狀態。反向訊號：資料只掃一遍、每筆只查一次、規模很小——此時額外結構省不到時間，卻多付了空間與程式複雜度。至於 Memory Limit Exceeded，則是相反方向的訊號：該考慮重算或分批了。

## Common Mistakes

第一，以為雜湊表永遠比較快：雜湊查詢要先算雜湊值、再間接存取，常數成本不低；資料只有幾十筆時，連續記憶體的線性掃描因為對快取友善，實測往往更快——漸進複雜度描述的是大規模趨勢，不是小資料的勝負。第二，快取無上限成長：記憶體耗盡（Memory Limit Exceeded），或逼近上限時頻繁頁面置換，換來的不是速度而是崩潰。第三，還沒量測就優化：瓶頸可能根本不在你優化的地方，先 Profiling 或估算複雜度確認熱點再決定投資，否則只是替程式增加維護負擔。第四，把 O(1) 當成免費：平均 O(1) 是攤銷後的結果，雜湊碰撞嚴重時仍可能退化；「常數時間」不等於「零成本」。

## Complexity

O(n) / O(n)。空間換時間的典型形狀：花與輸入同量級的額外空間建表，把原本 O(n^2) 的重複查找壓成一趟線性掃描；建表與掃描各走一遍輸入，時間仍是線性。

## Digest

時間與空間往往無法同時最省：想加速，通常要投資額外記憶體，把「重複計算」變成「一次建表、之後查表」；想省記憶體，則反過來用重算或分批處理換空間。判斷值不值得換有三步——估規模（n 為 10^5 時 O(n^2) 必然超時）、找重複（建表成本要靠大量查詢攤平，只查一兩次就是淨損失）、看方向（TLE 提示空間換時間，MLE 提示時間換空間）。也別忘了常數成本：小資料時線性掃描常勝過雜湊表，平均 O(1) 不等於零成本。先找到瓶頸與重複，再決定投資記憶體。

## TypeScript Tip

陣列的 includes 每次都線性掃描；先放進 Set，之後每次查詢平均 O(1)。查詢 q 次的總成本從 O(n * q) 降為 O(n + q)——資料量與查詢次數越大，這筆建表投資回收越快。

```typescript
function countHits(data: number[], queries: number[]): number {
  const seen = new Set(data); // 建表一次：O(n) 空間
  let hits = 0;
  for (const q of queries) {
    if (seen.has(q)) hits++; // 每次查詢平均 O(1)
  }
  return hits;
}
if (countHits([1, 3, 5], [3, 4, 5, 6]) !== 2) throw new Error("assertion failed");
if (countHits([], [1]) !== 0) throw new Error("assertion failed");
```

## Python Tip

`x in list` 是 O(n) 線性掃描，`x in set` 平均 O(1)。查詢頻繁時先把清單轉成 set，一行就完成建表。

```python
def count_hits(data: list[int], queries: list[int]) -> int:
    seen = set(data)  # 建表一次，換取之後每次平均 O(1) 的查詢
    return sum(1 for q in queries if q in seen)

assert count_hits([1, 3, 5], [3, 4, 5, 6]) == 2, "assertion failed"
assert count_hits([], [1]) == 0, "assertion failed"
```

## Takeaway

重複的計算才值得用空間換：建表成本靠大量查詢攤平；先找到瓶頸與重複，再決定投資記憶體。

## Tomorrow Preview

明天進入 Error-Driven Refinement，學習把編譯錯誤與失敗測資當成定位問題的精準線索，而不是挫折。之後在 array 模組的 Basic Prefix Sum Construction，我們會把今天「空間換時間」的策略落成具體實作：花 O(n) 空間建一張前綴和表，換取每次區間查詢只要 O(1)。

## Today's Challenge

本篇為觀念課，沒有對應的 LeetCode 練習題。建議回顧一題你解過的題目，實際估算暴力解與加上雜湊表後各需要多少操作，感受建表成本在多少次查詢後回本。
