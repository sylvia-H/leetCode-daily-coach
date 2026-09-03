---
id: stack-maximal-rectangle-foundation
title: Stack Maximal Rectangle Foundation
module: stack
pattern_label: Largest Rectangle in Histogram Core
complexity_label: O(n) / O(n)
estimated_minutes: 25
exit_criteria:
  - 能為直方圖中每個柱高找出左右邊界限制。
  - 能在線性時間內有效率地計算最大矩形面積。
---
## Concept

Largest Rectangle in Histogram：給定等寬直方柱的高度序列，求能完整放進直方圖的最大矩形面積。第一步是把無窮多種候選矩形收斂成 n 種：任何矩形的高度都受限於它覆蓋區間內最矮的柱子，而高度沒貼到這個上限的矩形，直接拉高就能變大——所以最大矩形必然可以寫成「以某根柱 j 的高度為高、向兩側撐到第一根嚴格更矮的柱子為止」。設 L 是 j 左側最近的嚴格更矮者（不存在則 -1）、R 是右側最近的嚴格更矮者（不存在則 n），開區間 (L, R) 內共 R - L - 1 根柱都不比 j 矮，候選面積為 heights[j] * (R - L - 1)。逐柱枚舉這 n 個候選、取最大即為答案。這與昨天是同一副 previous / next less 邊界骨架：昨天用邊界數區間個數，今天用邊界量最大寬度。

## Thinking

邊界仍由單調堆疊一趟求出：堆疊存索引、對應高度由底至頂遞增。掃到 i 時，只要頂端 j 的高度 ≥ heights[i] 就彈出結算：R = i、L = 彈出後的新頂端（堆疊空則 -1），面積 heights[j] * (i - L - 1)。彈出條件沿用昨天的「≥ 就彈」，去重效果也一致：同高並列的柱子中，只有最右那根結算時左界能跨越所有同高同伴、量到完整寬度；先被彈出的同伴右界停在同高鄰居上，量到的寬度偏小。這在昨天是正確性要件（每個子陣列恰計一次），在今天卻只是無害的慣例——我們要的是最大值，完整矩形已被最右那根算進候選，偏小的候選不影響取 max。收尾用哨兵：掃描結束時堆疊仍殘留一段高度遞增的柱子（右側始終沒有更矮者），在尾端補一根高度 0 的虛擬柱，把它們全部彈出、R 統一取 n。以 [2, 1, 5, 6, 2, 3] 走一遍：索引 1 的高度 1 先彈出索引 0（高 2、寬 1、面積 2）；掃到索引 4 的高度 2 時連彈 6（寬 1、面積 6）與 5（寬 2、面積 10）；哨兵階段再依序結算 3、2、1，答案 10。

## Pattern Recognition

訊號：在直方圖或可壓成直方圖的結構中求最大矩形；更一般地，凡是「以每個元素為高度瓶頸向兩側擴張，範圍受第一個更小元素阻擋」的最值問題都適用。二維網格的最大矩形常見化法正是逐列把上方連續的格子累積成柱高，再對每列的直方圖重複套用本課。反例：求最大正方形（DP 遞推更直接）、或矩形高度不受最矮柱限制的問題，不要硬套。

## Common Mistakes

一、堆疊存高度而非索引：比較夠用，寬度算不出來——答案與位置或寬度相關就存索引，這個判準與先前的距離結算課一脈相承。二、忘記哨兵或收尾：嚴格遞增的輸入整趟零彈出，不清堆疊會回傳 0。三、寬度公式寫成 i - j：被彈出者的左牆不是它自己，而是彈出後的新頂端 L，正確寬度是 i - L - 1；寫成 i - j 會把左側較高或同高、本可納入矩形的柱子切掉。四、在等號上過度糾結：彈出條件改成嚴格小於也能得到正確最大值（換成最左那根同高柱量到完整寬度），但堆疊會殘留同高柱，且與昨天的慣例分裂——統一「≥ 就彈」讓兩課共用同一副骨架與同一套心智模型。

## Complexity

時間 O(n)：每根柱至多壓入一次、彈出一次，含哨兵共 n + 1 輪，while 的彈出總量受壓入總量限制，攤銷後線性。空間 O(n)：高度遞增的輸入讓掃描階段零彈出，堆疊存滿全部索引。

## Digest

直方圖最大矩形：最大解必以某柱 j 為高度瓶頸，寬度撐到左右第一根嚴格更矮者之間，面積 heights[j] * (R - L - 1)。單調遞增堆疊（存索引）一趟求邊界：高度 ≥ 當前者即彈出結算，R 是當前索引、L 是新頂端（空則 -1）；尾端補高度 0 的哨兵，把殘留的遞增柱全部以 R = n 結清。同高柱由最右那根量到完整寬度，與昨天的去重慣例一致；因為只取最大值，其餘偏小候選無害。時間 O(n)、空間 O(n)。

## TypeScript Tip

哨兵用「迴圈多走一輪、當前高度視為 0」實作，不必真的複製陣列；`noUncheckedIndexedAccess` 下已驗證的索引用 `!` 收斂。

```typescript
function largestRectangleArea(heights: number[]): number {
  let best = 0;
  const stack: number[] = []; // 存索引，對應高度由底至頂遞增
  for (let i = 0; i <= heights.length; i++) {
    const cur = i < heights.length ? heights[i]! : 0; // 尾端哨兵 0
    while (stack.length > 0 && heights[stack[stack.length - 1]!]! >= cur) {
      const h = heights[stack.pop()!]!;
      const left = stack.length > 0 ? stack[stack.length - 1]! : -1;
      best = Math.max(best, h * (i - left - 1));
    }
    stack.push(i);
  }
  return best;
}
if (largestRectangleArea([2, 1, 5, 6, 2, 3]) !== 10) throw new Error("assertion failed");
if (largestRectangleArea([5, 5]) !== 10) throw new Error("assertion failed");
```

## Python Tip

`range(len(heights) + 1)` 多走的最後一輪就是哨兵；條件運算式把越界的那一輪高度視為 0。

```python
def largest_rectangle_area(heights: list[int]) -> int:
    best = 0
    stack: list[int] = []  # 存索引，對應高度由底至頂遞增
    for i in range(len(heights) + 1):
        cur = heights[i] if i < len(heights) else 0  # 尾端哨兵 0
        while stack and heights[stack[-1]] >= cur:
            h = heights[stack.pop()]
            left = stack[-1] if stack else -1
            best = max(best, h * (i - left - 1))
        stack.append(i)
    return best

assert largest_rectangle_area([2, 1, 5, 6, 2, 3]) == 10
assert largest_rectangle_area([5, 5]) == 10  # 同高：最右那根量到完整寬度 2
```

## Takeaway

每根柱當高度瓶頸：左右第一根更矮者界定寬度 R - L - 1，單調堆疊加哨兵一趟 O(n) 取得最大矩形面積。

## Tomorrow Preview

stack 模組到此收官——從 LIFO 與陣列實作、括號配對、碰撞與求值模擬，一路走到單調堆疊的距離結算、環狀走訪、span 累計與左右邊界貢獻法，「彈出即結算」的骨架已經完整。明天起進入新的模組，用同樣的節奏繼續推進。

## Today's Challenge

- **84** · 直方圖最大矩形的正典：把「每柱當高度瓶頸」的收斂論證與單調堆疊的邊界結算合成一題，哨兵與寬度公式的坑全在這裡。
  - Hint: 堆疊存索引，高度 ≥ 當前者就彈出；面積為 heights[j] * (i - L - 1)，L 是彈出後的新頂端；尾端補 0 清空堆疊。
