---
id: two-pointer-trapping-rain-water
title: Trapping Rain Water Optimization
module: two-pointer
pattern_label: Two Pointers - Boundary Tracking
complexity_label: O(n) / O(1)
estimated_minutes: 25
exit_criteria:
  - 能夠推導出為何只要較低側有最大高度保證，即可直接計算當前格子的積水量
  - 理解 O(1) 空間複雜度的雙指標解法相較於 Prefix Max 陣列的優勢
---
## Concept

Trapping Rain Water 要算高低起伏的柱子之間總共能積多少雨水。單看一格，答案早有公式：位置 i 的積水 = min(左側最高, 右側最高) - h[i]——水位由兩側圍牆中較矮的那道決定。直接照公式做，得先為每個位置備妥兩側的最大高度，這就是 Prefix Max 解法：各掃一遍建出 leftMax 與 rightMax 兩個陣列再逐格套公式，時間 O(n) 但空間 O(n)。本課的雙指標解法沿用同一個公式，卻只用兩個變數動態維護左右歷史最大高度，在單一迴圈內把空間壓到 O(1)。它依賴的洞察與昨天相同：資訊還不完整時，較低的那一側往往已經可以安全下結論。

## Thinking

設 left = 0、right = n - 1，並以 leftMax、rightMax 記錄兩個指標各自一路走來見過的最高柱子。每輪三步：先用當前兩端更新 leftMax 與 rightMax；再比較兩者，結算較低的一側——若 leftMax < rightMax，位置 left 的積水就是 leftMax - h[left]，結算後 left 右移；否則結算右端、right 左移。

右半段還沒掃完，憑什麼敢結算左邊？位置 left 的「左側最高」就是 leftMax——左指標把左半段全走過了，這個值是精確的；「右側最高」確實未知，但它至少是 rightMax。當 leftMax < rightMax，min(左側最高, 右側最高) = leftMax 已被鎖定，右邊再冒出多高的柱子都改變不了這個 min，該格答案可以直接寫死。而「先更新 max、再結算」的順序保證結算值非負：當前柱若刷新該側新高，結算值恰為 0。

對照昨天：Container 用短板性質一次丟棄一整批候選組合，本課用同一性質提前鎖定單格答案——兩題的移動規則都源自「min 由較低側決定」。迴圈條件用 left <= right，相遇那一格也被結算，不變式因此很乾淨：每個位置恰被結算一次，加總即為答案（改用 left < right 其實也不會錯——可驗證相遇格必為某側新高、不積水——但論證多繞一段）。另外，比較當前兩端 h[left] < h[right] 來決定結算哪側的常見寫法，同樣可以嚴格證明正確；兩種變體差在比較依據，不在正確性。

## Pattern Recognition

當每個位置的答案由左右兩側的極值共同決定、且較低的一側能提前鎖定結果時，就是 Two Pointers - Boundary Tracking：雙指標由外向內、各自維護該側歷史極值，每輪結算可下結論的那側。辨識線索：題目在算被邊界圍出來的量，而暴力解需要替每個位置準備兩側極值——這種題常有 O(n) 空間的 Prefix Max 解，雙指標就是它的空間優化版。與昨天的 Greedy Shrinking 相比：那題在候選組合中挑最大值，本題是每格都要結算並加總——沒有丟棄，只有「何時能安全結算」。

## Common Mistakes

一、拿當前柱高當水位：把積水寫成 min(h[left], h[right]) - h[i] 之類——水位由「歷史」最大值決定，不是兩個指標當下所指的柱子；當前柱高只負責更新 max 與被結算。二、先結算再更新 max：當前柱比該側歷史最高還高時會算出負值，得靠 max(0, ...) 遮掩；先把當前柱納入該側 max 再結算，數值自然非負。三、以為比較 h[left] 與 h[right] 的寫法是錯的（或反過來，以為必須比較當前高度）：兩種變體皆可證正確，會錯的是第一點那種把當前高度當水位的混淆。四、替空陣列或單調遞增柱面寫特判：同一段程式對這些輸入自然得出 0，不需要額外分支。

## Complexity

時間複雜度 O(n)：每輪恰結算一個位置並把一個指標往內推，n 個位置各被結算一次，更新與比較皆為常數操作。空間複雜度 O(1)：相較 Prefix Max 的兩個 O(n) 陣列，這裡只有 left、right、leftMax、rightMax 與累計值五個變數。

## Digest

Trapping Rain Water：位置 i 的積水 = min(左側最高, 右側最高) - h[i]。Prefix Max 解法用兩個陣列預存兩側極值，花 O(n) 空間；雙指標版只用 leftMax 與 rightMax 兩個變數：每輪先以當前兩端更新兩者，再結算較低的一側——該側的 min 已被鎖定，對面再高也不影響。以 [4,2,0,3,2,5] 為例：leftMax=4 小於 rightMax=5，於是逐格結算左側，位置 1 積 4-2=2、位置 2 積 4-0=4、位置 3 積 4-3=1、位置 4 積 4-2=2，合計 9。迴圈用 left <= right，每格恰結算一次，O(n) 時間、O(1) 空間。

## TypeScript Tip

在條件分支內就地更新該側 max 再結算；`noUncheckedIndexedAccess` 下索引存取以非空斷言收斂型別。

```typescript
function trap(height: number[]): number {
  let left = 0, right = height.length - 1;
  let leftMax = 0, rightMax = 0, water = 0;
  while (left <= right) {
    leftMax = Math.max(leftMax, height[left]!);
    rightMax = Math.max(rightMax, height[right]!);
    if (leftMax < rightMax) { water += leftMax - height[left]!; left++; }
    else { water += rightMax - height[right]!; right--; }
  }
  return water;
}
if (trap([4, 2, 0, 3, 2, 5]) !== 9) throw new Error("assertion failed");
if (trap([0, 1, 0, 2, 1, 0, 1, 3, 2, 1, 2, 1]) !== 6) throw new Error("assertion failed");
```

## Python Tip

鏈式賦值一行初始化多個變數；注意迴圈終止條件是 left <= right，相遇那一格也要結算。

```python
def trap(height: list[int]) -> int:
    left, right = 0, len(height) - 1
    left_max = right_max = water = 0
    while left <= right:
        left_max = max(left_max, height[left])
        right_max = max(right_max, height[right])
        if left_max < right_max:
            water += left_max - height[left]
            left += 1
        else:
            water += right_max - height[right]
            right -= 1
    return water

assert trap([4, 2, 0, 3, 2, 5]) == 9, "assertion failed"
assert trap([0, 1, 0, 2, 1, 0, 1, 3, 2, 1, 2, 1]) == 6, "assertion failed"
```

## Takeaway

先更新兩側歷史最大、再結算較低側：該格的 min 已被鎖定，O(1) 空間逐格算完全部積水。

## Tomorrow Preview

明天進入 Boats to Save People：先排序，再讓相向雙指標做 Greedy Pairing——每輪問「最重的人能不能和最輕的人同船」，用一次比較同時決定配對結果與指標移動。

## Today's Challenge

- **42** · 每格答案由左右極值共同決定、且較低側可提前鎖定並直接結算，是 Boundary Tracking 的原型題。
  - Hint: 維護 leftMax 與 rightMax，每輪先用當前兩端更新兩者，再結算較低那一側並往內推進；迴圈條件用 left <= right。
