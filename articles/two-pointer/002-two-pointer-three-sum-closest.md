---
id: two-pointer-three-sum-closest
title: Three Sum Closest Search
module: two-pointer
pattern_label: Two Pointers - Closest Tracking
complexity_label: O(n^2) / O(1)
estimated_minutes: 15
exit_criteria:
  - 能夠在每次指標移動時精確計算與目標值的差值絕對值
  - 掌握如何根據當前總和與 target 的大小關係決定該移動 left 還是 right
---
## Concept

3Sum Closest 把上一課的問題換了目標函數：不再找出所有「和恰等於 target」的組合，而是找「和與 target 距離最小」的那一個和。骨架完全沿用——排序、外層固定基準 `nums[i]`、內層對向雙指標夾擠——但回傳值從組合清單變成單一個數字，演算法因此多帶一個全域狀態：目前見過最接近 target 的和 best。真正需要論證的是：夾擠一輪只實際評估 O(n) 個組合，憑什麼保證沒評估到的組合都不會更接近？關鍵在「先記錄、再淘汰」。以和 s 大於 target、要把 right 左移為例：對這個 right 而言，之後任何更大的 left 配上它，和只會比 s 更大、離 target 更遠——這批被放棄的組合，距離全都不小於剛剛記錄下來的 `abs(s - target)`。s 小於 target 而右移 left 時完全對稱。只要每一步都先更新 best 再移動指標，被淘汰的組合就永遠被「已記錄的某一步」支配，全域最佳不會漏。

## Thinking

排序後外層 i 固定基準，left 從 i + 1 起跳、right 在陣列尾端——起點的理由與外層的完備性上一課已論證，這裡照用。內層 `while (left < right)`：先算 s，無條件用 `abs(s - target)` 與歷史最小差距比較並更新 best；接著分流：s 等於 target 直接回傳 s——距離 0 是理論下界，不可能有更好的解；s 小於 target 就 left++；s 大於 target 就 right--。與 3Sum 有兩個好認的差異。其一，去重從必要變成可選：這題輸出的是一個和，重複值頂多讓同一個 s 被重算一次，更新 best 是冪等的，不跳過也不會錯——跳過只是省時間。其二，初始值要給一個「合法候選」：可用排序後前三個數的和，或另外維護一個初始為無窮大的最小差距變數，讓第一次比較必然成立。

## Pattern Recognition

辨識線索是題目從「恰好等於」換成「最接近」「差距最小」這類最佳化字眼，而輸出是和的數值、不是索引——所以排序不破壞題意，這條判準與上一課相同。同一副骨架還能處理「不超過 target 的最大和」這類變形：只在 s 不大於 target 的分支更新 best 即可。概念上可以這樣定位：3Sum 是過濾問題（列出滿足等式的組合），3Sum Closest 是最佳化問題（在所有組合上取距離最小值）；內層每輪的組合有 O(n^2) 個，夾擠只實際評估其中 O(n) 個，其餘全靠支配論證排除。

## Common Mistakes

第一是更新時機：只在某個分支裡更新 best，或先移動指標、下一輪才更新——支配論證的前提是「被淘汰前的那一步已經記錄」，順序反了證明就破了，答案可能與正解擦身而過。第二是等號分支懸空：只寫「小於就 left++、大於就 right--」而漏掉等於——等於時兩個指標都不動，迴圈條件永遠成立，直接無窮迴圈。第三是初始化亂給：把 best 設成 0 又直接拿 `abs(best - target)` 當比較基準，但 0 未必是任何三數的和，若它碰巧比所有真實候選都接近 target，就會回傳一個不存在的答案。第四是把差距寫成帶號的 `s - target` 直接比大小：負得越多數值越小，會被誤判成更接近，距離必須取絕對值。

## Complexity

排序 O(n log n)；主體是外層 O(n) 輪、內層每輪至多把右側區間走一遍 O(n)，相乘 O(n^2)，排序項在漸進上被吸收。每一步的更新只是一次減法、一次絕對值與一次比較，皆為 O(1)。輔助空間 O(1)。提早回傳只改善運氣好的情況，最壞複雜度仍是 O(n^2)。

## Digest

3Sum Closest＝3Sum 的骨架＋一個全域狀態：排序、固定基準、對向夾擠不變，每算出一個和 s 就先用 `abs(s - target)` 更新最接近的 best，再依 s 與 target 的大小移動指標；等於 target 立即回傳。不漏解的理由：每次淘汰掉的整批組合，距離都不小於剛記錄的那一步。實走一遍：nums = [-1, 2, 1, -4]、target = 1，排序得 [-4, -1, 1, 2]。i 指向 -4：和 -3（差 4，best = -3）、和 -1（差 2，best = -1）；i 指向 -1：和 2（差 1，best = 2），2 大於 1 收縮後結束——回傳 2。注意等號分支不能懸空，否則指標原地不動、無窮迴圈。

## TypeScript Tip

差距比較一律走 `Math.abs`：帶正負的 `s - target` 不能直接比大小。下面把「先更新、再移動」濃縮進夾擠主體，並用手算可驗的測資收尾：

```typescript
import assert from "node:assert";

function threeSumClosest(nums: number[], target: number): number {
  const a = [...nums].sort((x, y) => x - y);
  let best = a[0]! + a[1]! + a[2]!;
  for (let i = 0; i < a.length - 2; i++) {
    let l = i + 1, r = a.length - 1;
    while (l < r) {
      const s = a[i]! + a[l]! + a[r]!;
      if (Math.abs(s - target) < Math.abs(best - target)) best = s;
      if (s === target) return s;
      if (s < target) l++;
      else r--;
    }
  }
  return best;
}

assert.strictEqual(threeSumClosest([-1, 2, 1, -4], 1), 2);
```

## Python Tip

用 `float('inf')` 初始化最小差距，第一次比較必然成立，就不必拿前三個數的和當初值；此時 best 的佔位值 0 不會外洩——無窮大的 diff 保證它在第一輪就被真實候選覆蓋。

```python
def three_sum_closest(nums: list[int], target: int) -> int:
    a = sorted(nums)
    best, diff = 0, float('inf')
    for i in range(len(a) - 2):
        l, r = i + 1, len(a) - 1
        while l < r:
            s = a[i] + a[l] + a[r]
            if abs(s - target) < diff:
                best, diff = s, abs(s - target)
            if s == target:
                return s
            if s < target:
                l += 1
            else:
                r -= 1
    return best

assert three_sum_closest([-1, 2, 1, -4], 1) == 2
assert three_sum_closest([0, 0, 0], 1) == 0
```

## Takeaway

骨架同 3Sum：每步先用 `abs(s - target)` 更新全域最佳、再移動指標，被淘汰的組合不會更接近。

## Tomorrow Preview

明天把固定的層數再加一：4Sum 用兩層迴圈固定前兩個數、內層照樣夾擠，新的功課是第二層的去重邊界與兩級剪枝。

## Today's Challenge

- **16** · 沒有精確解可以回傳，逼你把「每一步先更新全域最佳」真正寫進夾擠迴圈，是 Closest Tracking 的原型題。
  - Hint: 排序後固定基準夾擠；先無條件用 `abs` 更新最接近的和、再移動指標；和恰等於 target 可立即回傳。
