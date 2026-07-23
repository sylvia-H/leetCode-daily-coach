<!-- F5 stub fixture Article：F7 內容產線上線後由生成物取代（FR-027、research R8） -->
---
id: prefix-sum
title: Prefix Sum
module: array
pattern_label: Prefix Sum
complexity_label: O(n) / O(n)
estimated_minutes: 15
exit_criteria:
  - 能用前綴和回答多次區間和查詢
  - 能說明前綴和的空間換時間取捨
---

## Concept

前綴和（Prefix Sum）是「預先計算」思維的第一課：花一次 `O(n)` 的時間，把「從頭到第 i 個元素的
累積和」都算好存起來，之後每次查詢「區間 [i, j] 的和」就只需要一次減法，`O(1)` 完成。

## Thinking

關鍵洞察：`sum(i, j) = prefix[j] - prefix[i-1]`。只要預先把 `prefix` 陣列建好，多次查詢就不用
每次重新加總，用「空間」換到了「時間」。

## Pattern Recognition

題目出現「多次查詢某個區間的總和」「子陣列和是否等於某個值」，且陣列本身在查詢過程中不會被修改，
通常就是前綴和適用的場景。

## Common Mistakes

最常見的錯誤是索引偏移算錯：`prefix[i]` 代表「前 i 個元素的和」還是「到索引 i 為止的和」，兩種定義
在做減法時的偏移量不同，混用會讓區間和多算或少算一個元素。

## Complexity

建立前綴和陣列需要一次 `O(n)` 走訪；之後每次查詢是 `O(1)`。額外空間為前綴和陣列本身，`O(n)`——
這正是「空間換時間」的具體展現。

## Digest

前綴和：預先花 `O(n)` 建立「累積和」陣列，之後每次查詢區間和只需一次減法、`O(1)` 完成。
用額外的 `O(n)` 空間，換取多次查詢的時間優勢，是預計算思維的入門範例。

## TypeScript Tip

```typescript
function buildPrefixSum(nums: number[]): number[] {
  const prefix = [0];
  for (const x of nums) {
    prefix.push(prefix[prefix.length - 1]! + x);
  }
  return prefix; // prefix[i] = nums[0..i-1] 的和
}
```

## Python Tip

```python
def build_prefix_sum(nums: list[int]) -> list[int]:
    prefix = [0]
    for x in nums:
        prefix.append(prefix[-1] + x)
    return prefix  # prefix[i] = nums[0..i-1] 的和
```

## TypeScript Corner

```typescript
class RangeSumQuery {
  private prefix: number[];

  constructor(nums: number[]) {
    this.prefix = [0];
    for (const x of nums) {
      this.prefix.push(this.prefix[this.prefix.length - 1]! + x);
    }
  }

  sumRange(left: number, right: number): number {
    // 區間 [left, right]（含兩端）的和 = prefix[right+1] - prefix[left]
    return this.prefix[right + 1]! - this.prefix[left]!;
  }
}
```

建構子花 `O(n)` 把前綴和建好，之後每次 `sumRange` 呼叫都只需要一次減法，`O(1)` 完成。

## Python Corner

```python
class RangeSumQuery:
    def __init__(self, nums: list[int]) -> None:
        self.prefix = [0]
        for x in nums:
            self.prefix.append(self.prefix[-1] + x)

    def sum_range(self, left: int, right: int) -> int:
        # 區間 [left, right]（含兩端）的和 = prefix[right+1] - prefix[left]
        return self.prefix[right + 1] - self.prefix[left]
```

## Takeaway

多次查詢區間和時，先花 `O(n)` 建前綴和，換來每次查詢 `O(1)`——空間換時間的第一課。

## Tomorrow Preview

前綴和是預計算思維的起點，之後 Sliding Window 會處理「區間會變動」時的類似問題。

## Today's Challenge

- **303** · 前綴和最直接的應用：預先建好累積和陣列，之後每次查詢區間和都只需一次減法。
  - Hint: 想清楚 `prefix[i]` 該定義成「前 i 個元素的和」還是「到索引 i 為止的和」，並保持全篇一致。
- **560** · 進階應用：要找「和等於 k 的連續子陣列」個數，可以邊算前綴和邊用雜湊表記錄出現次數。
  - Hint: `sum(i, j) = k` 等價於 `prefix[j] - prefix[i-1] = k`，反過來查表找 `prefix[j] - k` 出現過幾次。
