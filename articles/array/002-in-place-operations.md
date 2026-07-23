<!-- F5 stub fixture Article：F7 內容產線上線後由生成物取代（FR-027、research R8） -->
---
id: in-place-operations
title: In-place Operations
module: array
pattern_label: In-place Rewrite
complexity_label: O(n) / O(1)
estimated_minutes: 15
exit_criteria:
  - 能就地移除指定元素並回傳新長度
  - 能說明就地操作省下的空間成本
---

## Concept

就地操作（In-place Operations）是指不額外配置與輸入等大的陣列，而是直接在原陣列上覆寫，用一個
「寫入指標」記錄下一個有效值該放的位置，搭配一個「讀取指標」逐一檢視原始資料。

## Thinking

核心規則：讀取指標永遠往前走；寫入指標只在「目前讀到的元素應該被保留」時才前進並覆寫。兩個指標
的移動速度不同，正是就地操作省下額外空間的關鍵。

## Pattern Recognition

題目要求「移除某些元素並回傳新長度」「原地修改陣列，不能配置新陣列」，且不要求維持相對順序以外的
額外排序，通常就是寫入指標 + 讀取指標的應用場景。

## Common Mistakes

常見錯誤是把「刪除」誤解為呼叫陣列的 splice / delete（那些操作本身可能是 `O(n)`，在迴圈中使用會
變成 `O(n^2)`），而不是用寫入指標覆寫。另一個常見錯誤是忘記回傳新長度，只回傳陣列本身。

## Complexity

讀取指標與寫入指標各自最多走訪 n 次，時間複雜度 `O(n)`；只用兩個整數變數，額外空間 `O(1)`。

## Digest

就地操作：用「讀取指標」逐一檢視元素，「寫入指標」只在該元素該被保留時才前進並覆寫。
不配置新陣列，時間 `O(n)`、空間 `O(1)`。這是銜接 Two Pointer 的重要橋樑。

## TypeScript Tip

```typescript
function removeElement(nums: number[], val: number): number {
  let writeIndex = 0;
  for (const x of nums) {
    if (x !== val) {
      nums[writeIndex] = x;
      writeIndex++;
    }
  }
  return writeIndex;
}
```

## Python Tip

```python
def remove_element(nums: list[int], val: int) -> int:
    write_index = 0
    for x in nums:
        if x != val:
            nums[write_index] = x
            write_index += 1
    return write_index
```

## TypeScript Corner

```typescript
function moveZeroes(nums: number[]): void {
  let writeIndex = 0;
  for (const x of nums) {
    if (x !== 0) {
      nums[writeIndex] = x;
      writeIndex++;
    }
  }
  for (let i = writeIndex; i < nums.length; i++) {
    nums[i] = 0;
  }
}
```

第一段迴圈把所有非零元素依序搬到前面（與 Remove Element 同一套寫入指標邏輯），第二段迴圈再把
剩下的位置補零——兩段合計仍是 `O(n)`。

## Python Corner

```python
def move_zeroes(nums: list[int]) -> None:
    write_index = 0
    for x in nums:
        if x != 0:
            nums[write_index] = x
            write_index += 1
    for i in range(write_index, len(nums)):
        nums[i] = 0
```

## Takeaway

讀取指標負責「看」，寫入指標負責「留」，兩者速度不同，就是就地操作省空間的秘密。

## Tomorrow Preview

明天進入 Prefix Sum：學會用「預先算好的累積和」把多次區間查詢從 `O(n)` 降到 `O(1)`。

## Today's Challenge

- **27** · 就地操作的入門題：讀取指標逐一檢視，寫入指標只在元素不等於目標值時才前進並覆寫。
  - Hint: 想清楚「保留」的條件是什麼，再決定寫入指標要不要移動。
- **283** · 把所有零搬到陣列尾端、非零元素維持相對順序，是就地操作的直接延伸應用。
  - Hint: 先用寫入指標把非零元素搬到前面，剩下的位置最後統一補零。
