---
id: two-pointer-three-sum-basic
title: Three Sum Basic Logic
module: two-pointer
pattern_label: Two Pointers - Sorting & Opposite
complexity_label: O(n^2) / O(1)
estimated_minutes: 15
exit_criteria:
  - 能夠正確在排序後的陣列中避開重複組合
  - 理解為何外層迴圈配合內層雙指標能達到 O(n^2) 複雜度
---
## Concept

Three Sum 要在陣列中找出所有相加等於目標值（通常為 0）的三元組，且輸出不得重複。三層迴圈的暴力枚舉是 O(n^3)；這一課的降維思路是：**先排序，再固定一個基準數 nums[i]，剩下的問題就變成「在 i 右側的已排序區間裡，找兩數之和等於目標減 nums[i]」**——正是陣列課學過的對向雙指標的主場。排序帶來單調性，單調性支撐淘汰論證：內層每比較一次兩端就能安全丟掉一端，一輪配對搜尋從 O(n^2) 壓到 O(n)；外層 n 個基準各跑一輪，整體 O(n^2)。完備性由外層保證：任何一組解排序後最小的那個數，必然在外層當過基準，屆時另外兩數就在它右側的區間內，內層的夾擠不會漏掉。

## Thinking

先排序，外層 i 從 0 走到 n - 3，內層設 `left = i + 1`、`right = n - 1`，在 `while (left < right)` 中夾擠：三數和小於目標就 left++（left 配最大的 right 都不夠，換更大的左端）；大於目標就 right--；命中就記錄，然後**兩個指標都要動**，並各自跨過所有相同數值——固定一端只換另一端，和必然偏離目標，而只前進一格又可能踩在重複值上再次記錄同一組合。left 從 i + 1 起跳不是偷懶：組合不分順序，規定三個索引遞增，每組解就恰好出現一次；i 左側的元素在更早的外層輪次已配過所有組合。去重有兩層：外層遇到 nums[i] 等於 nums[i - 1] 就跳過——與**前一個**比而不是後一個，才能保留每個值的第一次出現、只略過之後的重複；內層命中後同樣跨過重複值。最後一個剪枝：目標為 0 時，一旦 nums[i] > 0，它右側全是不小於它的數，三數和必為正，可直接結束外層。

## Pattern Recognition

題目要求「k 個數的組合滿足總和條件」且輸出不重複組合時，想到「排序＋固定 k - 2 個數＋相向雙指標收尾」：Three Sum 固定一個，Four Sum 固定兩個，層層降維到最後都是同一個兩端夾擠。辨識線索：輸出的是數值組合而非索引（所以可以放心排序）、要求去重、以及「和的大小」能引導指標單向移動。反例也要認得：若題目要求回傳**原始索引**，排序會打亂索引——要嘛改用雜湊表，要嘛先記下原索引再排序，不能直接套這副骨架。

## Common Mistakes

第一是去重不完整：命中後只移動一個指標且不跳過重複值，或外層忘了跳過重複的基準，輸出就會出現重複組合。第二是外層去重寫成與**後一個**元素比較——這會把「第一次出現」也跳掉而直接漏解：nums 為 [-1, -1, 2] 時，第一個 -1 被跳過，唯一解就丟了。第三是 JavaScript 的 `sort()` 不傳比較函式：預設把元素轉成字串按字典序排，[10, 2, 1] 會排成 [1, 10, 2]，單調性從根基就壞了，必須寫 `(a, b) => a - b`。第四是 left 誤從 0 起跳：同一組合會以不同索引順序被記錄多次，還可能把基準自己重複取用。

## Complexity

排序 O(n log n)；主體是外層 O(n) 輪、每輪內層兩指標合計至多把右側區間走一遍 O(n)，相乘 O(n^2)，排序項在漸進上被吸收。空間方面，雙指標本身只用常數個變數；排序的額外空間依語言實作（多為 O(log n) 的遞迴堆疊），輸出列表照慣例不計入。整體記為 O(n^2) 時間、O(1) 輔助空間。

## Digest

Three Sum 的公式：排序 → 外層固定基準 nums[i] → 內層在閉區間 [i + 1, n - 1] 用對向雙指標找兩數和。單調性讓內層每次比較都能安全淘汰一端（一輪 O(n)），完備性由「每組解中最小的數必當過基準」保證，整體 O(n^2)。去重兩層缺一不可：外層 nums[i] 等於 nums[i - 1] 才跳過——與前一個比，[-1, -1, 2] 的唯一解才不會被跳掉；內層命中後兩指標都移動並各自跨過重複值。JavaScript 排序務必傳 `(a, b) => a - b`。目標為 0 時 nums[i] > 0 即可提前收工。

## TypeScript Tip

JavaScript 的 `sort()` 預設把元素轉成字串按字典序比較，數字陣列必須傳入數值比較函式——這一步錯了，之後的淘汰論證全部失效。用斷言親眼確認這個陷阱：

```typescript
import assert from "node:assert";

const nums = [10, 2, 1, -4];
assert.deepStrictEqual([...nums].sort(), [-4, 1, 10, 2]);
assert.deepStrictEqual(
  [...nums].sort((a, b) => a - b),
  [-4, 1, 2, 10],
);
```

字典序把 "10" 排在 "2" 前面、把 "-4" 排到最前，得到的不是遞增數列；傳入 `(a, b) => a - b` 才是真正的數值排序。

## Python Tip

內層的兩數夾擠與去重是 Three Sum 的心臟：命中後 left 與 right 都要移動，並各自跨過剛用過的重複值——與自己前一步的位置比較即可。

```python
def pair_sum(nums: list[int], target: int) -> list[tuple[int, int]]:
    res = []
    left, right = 0, len(nums) - 1
    while left < right:
        s = nums[left] + nums[right]
        if s == target:
            res.append((nums[left], nums[right]))
            left += 1
            right -= 1
            while left < right and nums[left] == nums[left - 1]:
                left += 1
            while left < right and nums[right] == nums[right + 1]:
                right -= 1
        elif s < target:
            left += 1
        else:
            right -= 1
    return res

assert pair_sum([-2, -2, 0, 2, 2], 0) == [(-2, 2)]
```

## Takeaway

排序給單調性、固定基準降一維、兩層去重防重複——三數之和以 O(n^2) 收下。

## Tomorrow Preview

明天把同一副骨架推向兩個方向：3Sum Closest 練習在沒有精確命中時，如何用夾擠逼近「最接近目標的和」；4Sum 則示範多固定一層基準，把 k 數之和層層降維回兩端夾擠。

## Today's Challenge

- **15** · 排序、固定基準、對向夾擠、兩層去重——這一題把本課每個環節都逼你完整寫對一次。
  - Hint: 外層與前一元素相同就跳過；命中後兩指標都移動並跨過重複值；nums[i] > 0 可提前結束。
- **1** · Two Sum 是內層迴圈的獨立版，但它要求回傳原始索引——排序會打亂索引，正好練習辨識雙指標的適用邊界。
  - Hint: 用雜湊表記錄「還差多少」可一趟 O(n) 解決；堅持用雙指標就得先保存原索引再排序。
