---
id: array-range-sum-query
title: Range Sum Query Using Prefix Sum
module: array
pattern_label: Prefix Sum Query
complexity_label: O(1) per query / O(n)
estimated_minutes: 15
exit_criteria:
  - '能正確寫出區間 [L, R] 總和公式 P[R] - P[L-1]'
  - 能處理 L = 0 時的邊界情況
---
## Concept

Range Sum Query 透過 Prefix Sum 技術，能夠在 O(1) 的常數時間內回答任意靜態陣列的區間總和查詢。在處理大量查詢請求時，若每次都重新走訪區間計算總和，時間複雜度會累積至 O(M * N)，其中 M 為查詢次數、N 為陣列長度。透過預先計算並儲存從起始點到當前索引的累積總和（即 Prefix Sum 陣列），任意區間 [L, R] 的總和即可透過數學公式 P[R] - P[L-1] 在 O(1) 時間內精準求出。

## Thinking

當面臨需要對靜態陣列進行多次區間總和查詢的場景時，直覺的暴力解法會導致效能低落。此時的思考邏輯應轉向「空間換取時間」的策略。我們可以在初始化階段建立一個 Prefix Sum 陣列，其中每個元素代表原陣列從索引 0 到當前索引的元素總和。當收到查詢請求區間 [L, R] 時，目標區間的總和即等於包含到 R 的總和減去包含到 L-1 的總和。特別需要注意的是邊界條件：當 L 等於 0 時，減法會變成 P[R] - P[-1]，此時不需要扣除任何前綴和，直接回傳 P[R] 即可，這避免了陣列存取越界與負數索引的錯誤。

## Pattern Recognition

當題目具備以下特徵時，即可辨識並套用 Prefix Sum 模式：首先，底層資料結構為靜態陣列（Static Array），在查詢期間資料不會頻繁變動（若有頻繁更新則需改用 Segment Tree 或 Fenwick Tree）；其次，題目包含大量的區間查詢請求（Range Queries），要求計算特定區間內的數值總和、乘積或其他可逆運算；最後，關注效能瓶頸，當每次查詢都必須重複疊代相同區間時，即可引入前綴和進行優化。

## Common Mistakes

最常見的錯誤在於處理邊界條件 L = 0 時的處理失當。若開發者未對 L 是否為 0 進行條件判斷，直接代入公式 P[R] - P[L-1]，當 L 為 0 時將會存取 P[-1]，在多數程式語言中會導致索引越界或取得不正確的預設值。另一個常見錯誤是 Prefix Sum 陣列的長度與索引對齊錯誤：為了讓公式 P[R] - P[L-1] 能夠平順運作而不需過多繁瑣的位移調整，Prefix Sum 陣列的長度通常會設計為原陣列長度加一，並在最前端補上 0 作為基準點。

## Complexity

前處理（Preprocessing）的時間複雜度為 O(N)，其中 N 為原陣列長度，因為需要完整走訪一次陣列來計算累積總和。空間複雜度同樣為 O(N)，用以儲存 Prefix Sum 陣列。在查詢階段（Query），每次查詢的時間複雜度為 O(1)，空間複雜度為 O(1)。

## Digest

今日重點學習 Prefix Sum 技巧。透過 O(N) 的預先計算，我們能將原本每次需要 O(N) 甚至暴力疊代的區間查詢，壓縮至 O(1) 的常數時間。核心公式為 query(L, R) = P[R+1] - P[L]，其中關鍵在於處理好陣列索引的對齊與邊界條件。

## TypeScript Tip

```typescript
// 在 TypeScript 中利用建構子初始化並明確定義型別
class PrefixSumHelper {
  private sums: number[];
  constructor(nums: number[]) {
    this.sums = [0, ...nums];
    for (let i = 1; i < this.sums.length; i++) {
      this.sums[i] += this.sums[i - 1];
    }
  }
  public query(l: number, r: number): number {
    return this.sums[r + 1] - this.sums[l];
  }
}
const helper = new PrefixSumHelper([1, 2, 3, 4]);
if (helper.query(1, 3) !== 9) throw new Error("assertion failed");
```

## Python Tip

```python
# 在 Python 中利用 itertools.accumulate 簡化前綴和的建構過程
import itertools

class PrefixSumHelper:
    def __init__(self, nums: list[int]):
        self.sums = [0] + list(itertools.accumulate(nums))

    def query(self, l: int, r: int) -> int:
        return self.sums[r + 1] - self.sums[l]

helper = PrefixSumHelper([1, 2, 3, 4])
assert helper.query(1, 3) == 9, "assertion failed"
```

## TypeScript Corner

```typescript
class NumArray {
  private prefixSum: number[];

  constructor(nums: number[]) {
    this.prefixSum = new Array(nums.length + 1).fill(0);
    for (let i = 0; i < nums.length; i++) {
      this.prefixSum[i + 1] = this.prefixSum[i] + nums[i];
    }
  }

  sumRange(left: number, right: number): number {
    return this.prefixSum[right + 1] - this.prefixSum[left];
  }
}

const numArray = new NumArray([-2, 0, 3, -5, 2, -1]);
if (numArray.sumRange(0, 2) !== 1) throw new Error("assertion failed");
if (numArray.sumRange(2, 5) !== -1) throw new Error("assertion failed");
if (numArray.sumRange(0, 5) !== -3) throw new Error("assertion failed");
```

## Python Corner

```python
class NumArray:
    def __init__(self, nums: list[int]):
        self.prefix_sum = [0] * (len(nums) + 1)
        for i in range(len(nums)):
            self.prefix_sum[i + 1] = self.prefix_sum[i] + nums[i]

    def sumRange(self, left: int, right: int) -> int:
        return self.prefix_sum[right + 1] - self.prefix_sum[left]

num_array = NumArray([-2, 0, 3, -5, 2, -1])
assert num_array.sumRange(0, 2) == 1, "assertion failed"
assert num_array.sumRange(2, 5) == -1, "assertion failed"
assert num_array.sumRange(0, 5) == -3, "assertion failed"
```

## Takeaway

掌握 Prefix Sum 的 P[R+1] - P[L] 公式與 O(1) 查詢精髓，切記防範邊界條件與索引對齊失誤。

## Tomorrow Preview

明天我們將探討 Prefix Sum 的進階應用，延伸至二維矩陣（2D Matrix）的子矩陣總和查詢，學習如何在多維空間中建構與套用前綴和公式。

## Today's Challenge

- **303** · 典型的靜態陣列多重區間求和問題，完全符合 Prefix Sum 的核心應用場景。
  - Hint: 建構一個長度為 n+1 的前綴和陣列，以妥善處理起始索引為 0 的邊界狀況。
- **560** · 結合 Hash Map 與前綴和概念，用以尋找特定加總目標的子陣列數量。
  - Hint: 利用累加的前綴和與雜湊表紀錄先前出現過的前綴和頻次。
- **304** · 將一維前綴和的概念延伸至二維矩陣，處理子矩陣的範圍查詢。
  - Hint: 計算二維前綴和時需利用排容原理，扣除重複計算的區域。
