---
id: two-pointer-container-water
title: Container With Most Water
module: two-pointer
pattern_label: Two Pointers - Greedy Shrinking
complexity_label: O(n) / O(1)
estimated_minutes: 15
exit_criteria:
  - 理解為什麼總是移動高度較小的指標是正確的貪婪選擇
  - 能夠正確計算每次移動時的容量並更新最大值
---
## Concept

給定一排垂直線的高度陣列，選出兩條線，讓它們與 x 軸圍成的容器裝最多的水。容量由兩個因素決定：兩線之間的寬度，以及兩線中較短那條的高度——水位一超過短板就會溢出，所以容量 = `(right - left) * min(h[left], h[right])`。候選組合共有 n(n-1)/2 對，逐對枚舉是 O(n^2)；本課的重點是靠一條可以嚴格論證的貪婪丟棄規則，把需要實際檢查的組合壓到 n-1 對，在 O(n) 內保證找到最大容量。

## Thinking

把兩個指標放在最兩端：left = 0、right = n - 1，從寬度最大的組合出發。每一輪做兩件事：先結算當前組合的容量並更新最大值，再把較短的那一端往內移。迴圈條件用 left < right——問自己：相遇那一格需不需要被處理？不需要：左右指到同一格時寬度為 0，圍不出任何容器，相遇即可停下。

為什麼這樣不會漏掉最佳解？關鍵不是「移短端會更好」，而是「短端剩下的組合已注定不會更好」。設較短端為 s。凡是保留 s、把另一端往內移的組合，寬度都比剛結算的這筆更小，而高度上限仍是 min，不會超過 h[s]——所以以 s 為邊界的所有未檢查組合，容量都不會超過剛剛算過的那筆，可以整批安全丟棄。s 這端功成身退，指標往內移；每輪丟棄一端，恰好把 n(n-1)/2 個組合篩到只需實際檢查 n-1 個。

兩端等高呢？此時兩端的容量上限都已在這一輪兌現：保留任何一端的未檢查組合，高度上限不變、寬度更小，同樣整批被支配。所以先移哪一端、甚至同時把兩端各往內移一格，都不會漏掉最佳解；程式裡把等高併入 else 分支只是寫法簡潔，不是正確性的需要。

## Pattern Recognition

三個訊號指向 Greedy Shrinking：答案由一對端點決定；目標是這對端點所定義函數的最大值；且存在可論證的丟棄規則——每輪都能證明某一端「剩下的組合不可能更好」。與 3Sum 家族不同，本題不需要排序：丟棄的依據是 min 的短板幾何性質，不是數值的單調性。反過來說，若只是左右各一指標對稱地收斂、沒有這種支配關係，那是相向雙指標的基本骨架，還稱不上貪婪收縮。

## Common Mistakes

一、以為移動較高端也可能找到更大面積：寬度必縮、min 上限仍被原短板壓住，面積必不增。二、把兩端等高想成陷阱，以為同時移動兩端會漏解：等高時保留任一端的剩餘組合都已被支配，同移不影響正確性，兩種寫法都對。三、面積公式寫錯：寬度是索引差 right - left（算的是兩線距離，不是元素個數，不加一），高度取 min 而非 max。四、順序顛倒：先移動指標才結算，會漏掉當前這筆組合，最大值可能因此少算。

## Complexity

時間複雜度 O(n)：每輪至少把一個指標往內移一格，left 與 right 的距離嚴格遞減，最多 n - 1 輪，每輪只做常數次比較與乘法。空間複雜度 O(1)：只需兩個指標與一個目前最大值。

## Digest

Container With Most Water：容量 = `(right - left) * min(h[left], h[right])`，短板決定水位。雙指標從最兩端出發，每輪先結算容量、再把較短端往內移——保留短端的所有剩餘組合寬度更小、高度上限不變，注定不會更好，可整批丟棄；等高時移任一端或同時移兩端皆正確。以 [1,8,6,2,5,4,8,3,7] 為例：起點是 (0,8)，容量 8*1=8，左端高度 1 是短板便丟棄；下一步 (1,8) 容量 7*min(8,7)=49，之後再無組合超過它，答案即 49。O(n) 時間、O(1) 空間。

## TypeScript Tip

Math.min 與 Math.max 讓結算與更新各佔一行；`noUncheckedIndexedAccess` 下索引存取要加非空斷言收斂型別。

```typescript
function maxArea(height: number[]): number {
  let left = 0, right = height.length - 1, best = 0;
  while (left < right) {
    best = Math.max(best, (right - left) * Math.min(height[left]!, height[right]!));
    if (height[left]! < height[right]!) left++;
    else right--;
  }
  return best;
}
if (maxArea([1, 8, 6, 2, 5, 4, 8, 3, 7]) !== 49) throw new Error("assertion failed");
if (maxArea([4, 3, 2, 1, 4]) !== 16) throw new Error("assertion failed");
```

## Python Tip

結算與更新用一行 `best = max(best, ...)` 完成；多重賦值一次初始化三個變數。

```python
def max_area(height: list[int]) -> int:
    left, right, best = 0, len(height) - 1, 0
    while left < right:
        best = max(best, (right - left) * min(height[left], height[right]))
        if height[left] < height[right]:
            left += 1
        else:
            right -= 1
    return best

assert max_area([1, 8, 6, 2, 5, 4, 8, 3, 7]) == 49, "assertion failed"
assert max_area([4, 3, 2, 1, 4]) == 16, "assertion failed"
```

## Takeaway

先結算再移動較短端：短端剩下的組合注定不會更好，可整批丟棄，O(n) 保證找到最大容量。

## Tomorrow Preview

明天進入 Trapping Rain Water：同樣是相向雙指標，但目標從「挑一對邊界」變成「逐格結算積水」，改用動態維護的左右歷史最大高度（Boundary Tracking）決定哪一側可以安全結算。

## Today's Challenge

- **11** · 原型題：容量由寬度與短板共同決定，每輪可證明短端的剩餘組合已被支配，是 Greedy Shrinking 的完整展示。
  - Hint: 先結算 (right - left) * min(h[left], h[right]) 更新最大值，再把較短端往內移；等高時移哪一端都對。
- **344** · 這題不是貪婪題——它示範的是相向雙指標最單純的骨架：左右各一指標、交換、向內收斂到相遇；先把骨架練熟，再談移動策略。
  - Hint: 交換 s[left] 與 s[right] 後 left++、right--，以 left < right 為迴圈條件；奇數長度時中央字元不需處理。
