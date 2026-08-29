---
id: two-pointer-boats-to-save-people
title: Boats to Save People Matching
module: two-pointer
pattern_label: Two Pointers - Greedy Pairing
complexity_label: O(n log n) / O(1)
estimated_minutes: 15
exit_criteria:
  - 能夠理解為何最重的乘客必須優先考慮與最輕的乘客共乘
  - 正確計算所需的最少載具數量
---
## Concept

今天的問題長這樣：一群人各有體重，每艘船有載重上限 limit，且**最多坐兩人**，求最少需要幾艘船。這是排序＋相向雙指標的新用法——前兩課的兩端夾擠靠高度資訊淘汰「不可能更好」的組合，今天則用同一副骨架執行**貪婪配對**：排序後，每一輪只問一個問題——「目前最重的人，能不能跟目前最輕的人同船？」能，兩人一起走；不能，最重的人自己走。之所以敢這樣貪，是因為「最多兩人」把每艘船的組合壓到只有一人或兩人，而排序讓「最輕」成為最重者唯一需要測試的搭檔——連他都湊不進去，換誰都湊不進去。

## Thinking

先把體重由小到大排序，設 left = 0、right = n - 1，在 `while (left <= right)` 中每輪送出一艘船：若 `weight[left] + weight[right] <= limit`，最輕與最重共乘，left++ 且 right--；否則最重者獨自上船，只有 right--。兩個分支都做 boats++，因為**每輪恰好送走一艘船**——共乘送走兩人、獨行送走一人，這個不變式讓計數不會漏。貪婪的安全性靠兩個論證撐住。其一，**獨行不是選擇，是被迫**：排序保證 weight[left] 是還沒上船的人裡最輕的，連最輕的都湊不進去，右端這個人跟任何人都湊不進去。其二，**共乘用交換論證**：假設某個最優解沒讓最重的 r 配最輕的 l——r 與 a 同船（或獨行）、l 與 b 同船（或獨行）。把兩船改組成 (r, l) 與 (a, b)：r + l 不超限是本分支的前提；a + b 也不超限，因為 b 不重於最重的 r，故 a + b <= a + r <= limit。船數不變、限制不破，任何最優解都能改寫成「r 配 l」的版本，貪這一步永遠不虧。最後注意 left == right 的收尾：剩下的最後一人也要一艘船，這正是迴圈條件取 <= 的理由。

## Pattern Recognition

辨識訊號有三個：元素要**兩兩配對**（容器至多裝兩個）、有明確的**容量上限**、目標是**最少容器數**。三個訊號齊備，就想「排序＋兩端夾擠＋貪婪配對」。也要認得界線：整套交換論證建立在「最多兩人」上——若一艘船能坐三人以上，「最重配最輕」不再保證最優，問題趨近裝箱問題（bin packing），得換策略。另一個對照是上一課：同樣的 left / right 骨架，接雨水移動指標是為了追蹤邊界極值，今天移動指標則是在執行配對決策——骨架同、語意異，辨識時看的是問題結構，不是程式碼形狀。

## Common Mistakes

第一，超重時同時移動兩端。正確動作只有 right--：最重者被迫獨行，但最輕者還沒上船，把 left 也推進等於憑空丟掉一個人。第二，忘記排序就夾擠。所有推論都建立在「left 端最輕、right 端最重」上，未排序時這個前提不存在，貪婪論證整個垮掉。第三，迴圈條件寫成 left < right。當 left == right 時還剩最後一人沒上船，他也需要一艘船，用 < 會少算一艘。第四，過度設計搭檔選擇——想替最重者找「能塞進限重的最重搭檔」以免浪費容量。交換論證已經證明配最輕就能達到最少船數，額外搜尋不會讓答案更好，只會把 O(n) 掃描變複雜。

## Complexity

時間複雜度 O(n log n)，由排序主導；後續的雙指標掃描每輪至少讓 right 左移一格（共乘時 left 同時右移），整體 O(n)，漸進上被排序吸收。空間複雜度 O(1)：掃描只用 left、right、boats 三個變數；排序若為原地排序僅需約 O(log n) 的遞迴堆疊，慣例上不另計。

## Digest

Boats to Save People 的公式：排序 → left 指最輕、right 指最重 → 每輪一艘船：`weight[left] + weight[right] <= limit` 就共乘（left++ 且 right--），否則最重者獨行（只 right--），兩分支都 boats++。以 people = [3, 2, 2, 1]、limit = 3 為例：排序成 [1, 2, 2, 3]；1 + 3 超重，3 獨行（第 1 艘）；1 + 2 = 3 剛好共乘（第 2 艘）；剩下的 2 獨佔第 3 艘——答案 3。正確性兩根柱子：獨行是被迫的（連最輕都配不上就誰都配不上）、共乘是安全的（交換論證：任何最優解都能改寫成「最重配最輕」而不多用船）。迴圈條件用 left <= right，最後一人也要一艘船。

## TypeScript Tip

排序記得傳數值比較函式 `(a, b) => a - b`（Three Sum 課的老陷阱）；`w[l]! + w[r]!` 的 `!` 是因為 tsconfig 開了 noUncheckedIndexedAccess。三個斷言依序鎖住：基本共乘、混合情境、全員獨行且 left == right 的最後一人。

```typescript
import assert from "node:assert";

function numRescueBoats(people: number[], limit: number): number {
  const w = [...people].sort((a, b) => a - b);
  let l = 0, r = w.length - 1, boats = 0;
  while (l <= r) {
    if (w[l]! + w[r]! <= limit) l++;
    r--;
    boats++;
  }
  return boats;
}

assert.strictEqual(numRescueBoats([1, 2], 3), 1);
assert.strictEqual(numRescueBoats([3, 2, 2, 1], 3), 3);
assert.strictEqual(numRescueBoats([3, 5, 3, 4], 5), 4);
```

## Python Tip

Python 用 `sorted()` 取得排序後的新串列、不改動輸入；迴圈骨架與 TypeScript 相同，斷言涵蓋同樣三種情境。

```python
def num_rescue_boats(people: list[int], limit: int) -> int:
    w = sorted(people)
    l, r, boats = 0, len(w) - 1, 0
    while l <= r:
        if w[l] + w[r] <= limit:
            l += 1
        r -= 1
        boats += 1
    return boats

assert num_rescue_boats([1, 2], 3) == 1
assert num_rescue_boats([3, 2, 2, 1], 3) == 3
assert num_rescue_boats([3, 5, 3, 4], 5) == 4
```

## Takeaway

排序後每輪一船：最重配得上最輕就共乘，配不上就獨行——交換論證保證船數最少。

## Tomorrow Preview

明天把「先排序、再單趟掃描」帶進區間問題：Merge Intervals——依起點排序後，只要盯著目前合併段的終點，就能一趟決定每個區間該併入還是另起新段。

## Today's Challenge

- **881** · 「最多兩人＋載重上限＋求最少船數」三個訊號齊備，是排序後兩端貪婪配對的標準題。
  - Hint: 排序後最重者先試著跟最輕者同船，塞不下就獨行；每輪迴圈恰好送出一艘船。
