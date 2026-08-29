---
id: two-pointer-sort-array-by-parity
title: Sort Array by Parity Partition
module: two-pointer
pattern_label: Two Pointers - Partitioning
complexity_label: O(n) / O(1)
estimated_minutes: 10
exit_criteria:
  - 能夠正確使用相向或同向指標將陣列依奇偶或特定條件分為兩群
  - 理解指標交會時迴圈即告結束的原則
---
## Concept

Sort Array by Parity Partition 涉及利用條件式雙指標（Two Pointers）在單一陣列中進行就地分割（Partitioning）。其核心目的在於將陣列中的元素依照特定屬性（例如奇偶性、正負號或特定數值）重新排列，將符合條件的元素歸類至陣列的一側，而不符合條件的元素則移至另一側。這種操作能夠在維持空間複雜度為 O(1) 的前提下，於 O(n) 的線性時間內完成資料重組。

## Thinking

設定左右雙指標，left 初始化為陣列起始位置 0，right 初始化為陣列末端位置 n - 1。在迴圈進行中，當 left 指向符合條件且位於正確區側的元素時，將 left 向右推進；當 right 指向符合條件且位於正確區側的元素時，將 right 向左推進。若雙方皆未滿足各自的條件，代表兩者皆停留在錯誤的區側，此時將兩者指向的元素進行原地交換（Swap），隨後同時推進左右指標，直至 left 與 right 指標交會為止。

## Pattern Recognition

當題目要求將一個一維陣列根據某種邏輯規則（例如奇偶數分離、將特定數值移至陣列兩端、或將陣列劃分為不同特徵的區段）進行原地重排時，即可辨識出此 Pattern 為 Two Pointers - Partitioning。此模式的特徵在於不需要額外配置新的記憶體空間來存放結果陣列。

## Common Mistakes

最常見的錯誤在於交換元素後忘記同時推進左右指標，導致迴圈陷入無限迭代。另一個常見失誤是忽略了指標邊界檢查，當陣列長度為零或邊端條件處理不當時，容易造成指標越界（Index Out of Bounds）的執行時期錯誤。

## Complexity

時間複雜度為 O(n)，因為左右指標在最壞的情況下只會遍歷陣列各一次；空間複雜度為 O(1)，因為所有的重排與交換動作均在原陣列內完成，不需額外配置線性記憶體。

## Digest

本次課程介紹了 Sort Array by Parity Partition 核心觀念，透過左右雙指標相向而行的方式，在 O(n) 時間與 O(1) 空間內完成條件分割。文章詳細說明了演算法思考過程、Pattern 辨識線索、常見實作錯誤及複雜度分析，並提供 TypeScript 與 Python 的實作範例。

## TypeScript Tip

```typescript
function optimizeParity(nums: number[]): number[] {
    let insertPos = 0;
    for (let i = 0; i < nums.length; i++) {
        if (nums[i] % 2 === 0) {
            [nums[insertPos], nums[i]] = [nums[i], nums[insertPos]];
            insertPos++;
        }
    }
    return nums;
}
const res = optimizeParity([3, 1, 2, 4]);
if (res[0] % 2 !== 0) throw new Error("assertion failed");
```

## Python Tip

```python
def optimize_parity(nums: list[int]) -> list[int]:
    insert_pos = 0
    for i in range(len(nums)):
        if nums[i] % 2 == 0:
            nums[insert_pos], nums[i] = nums[i], nums[insert_pos]
            insert_pos += 1
    return nums

res = optimize_parity([3, 1, 2, 4])
assert res[0] % 2 == 0, "assertion failed"
```

## Takeaway

掌握相向雙指標分割技巧，透過左右指標交會與元素交換，在原地達成 O(n) 時間與 O(1) 空間效率。

## Tomorrow Preview

明天將探討更多涉及多指標（Multiple Pointers）與區間重構的進階技巧，學習如何在更複雜的排列限制下維持高效的線性執行時間。

## Today's Challenge

- **905** · 本題要求將陣列中的偶數移至奇數前方，是最經典的雙指標原地分割應用。
  - Hint: 利用左右指標分別尋找左側的奇數與右側的偶數進行交換。
- **75** · 本題要求將包含三種不同元素的陣列進行原地分類，是基礎 Partitioning 概念的進階延伸。
  - Hint: 擴展雙指標為三指標（Dutch National Flag 演算法）來處理三種分類。
