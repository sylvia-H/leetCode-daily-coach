---
id: binary-search-matrix-search
title: Binary Search 2D Matrix
module: binary-search
pattern_label: Binary Search
complexity_label: O(log(m * n)) / O(1)
estimated_minutes: 20
exit_criteria:
  - 能用 row = mid / cols 與 col = mid % cols 把 1D 索引轉換成 2D 座標。
---
## Concept

binary-search 模組的最後一課，把模板從一維推到二維。給定 m 列（row）、n 欄（column）的矩陣，每一列由左到右遞增，且每一列的第一個元素大於上一列的最後一個元素。這個「接續性」是關鍵：逐列讀過去，整個矩陣就是一條長度 m * n 的有序序列。既然如此，何必真的攤平？讓標準二分搜尋在虛擬索引 0 到 m * n - 1 上運作，只在「取值」那一步用算術把一維索引換回二維座標：row = mid / cols（整數除法）、col = mid % cols。為什麼除數是欄數 n？因為攤平後每 n 個索引恰好填滿一列：mid / n 的商是「前面走完了幾個完整列」，即列號；餘數是「本列內走到第幾格」，即欄號。不搬動任何資料、不佔額外空間，就換得 O(log(m * n)) 的搜尋。

## Thinking

第一課的口訣在這裡一個字都不用改：區間定義仍是閉區間 [left, right] 與不變式「target 若存在必在其中」，迴圈條件仍是 while (left <= right)，更新方式仍是 mid ± 1——整套照搬。真正新增的只有取值函式：value = matrix[mid / cols][mid % cols]。這個映射是雙射：0 到 m * n - 1 的每個索引對應唯一一格、每一格也只被一個索引對應，且索引順序就是逐列閱讀順序，接續性保證這個順序下數值遞增——一維模板的正確性論證因此原封不動成立。邊界上，right 初始化為 m * n - 1 而非 m * n：後者已超出合法索引。另外建議先擋掉空矩陣：在本模板中空輸入會讓 right 成為 -1、迴圈自然跳過，並不會出錯，但顯式防衛讓意圖清楚，換用其他區間慣例時也不怕除以 0 或越界。

## Pattern Recognition

訊號：矩陣存在「單一閱讀順序下的全域有序」——每列遞增之外，還要有列與列的接續（下一列開頭大於上一列結尾）。有了它，才允許把矩陣當一維陣列做一次二分。判斷時只問一句：把矩陣逐列串起來，是不是一條排好序的陣列？反訊號：若矩陣只保證每列遞增、每欄遞增，列與列之間沒有接續，攤平後不再有序——例如 [[1,4],[2,5]] 兩個方向都遞增，攤平卻是 1,4,2,5——此時映射失效，那類題要改用別的走法（如從角落出發逐步排除一列或一欄），不能硬套本課模板。

## Common Mistakes

一、除法與取餘寫反：3 列 4 欄中索引 6 應對應 (6 / 4, 6 % 4) = (1, 2)，寫反成 (6 % 4, 6 / 4) = (2, 1)，讀到完全不同的一格；少數位置兩者碰巧相同，靠肉眼測試容易漏抓。二、JavaScript 的 / 是浮點除法：mid / cols 會得到 1.25 這種「列號」，第一層索引 matrix[1.25] 拿到 undefined，再對它取第二層欄位就當場拋出 TypeError——爆在兩層索引的第二層，不是安靜比錯。必須 Math.floor；Python 用 //，誤寫 / 得到 float，索引時同樣直接拋錯。三、用列數 m 當除數：非方陣立刻錯位——2 列 4 欄中索引 5 除以 m = 2 得列號 2，越界。除數永遠是「一列的長度」，即欄數。四、right 初始成 m * n：搜尋比所有元素都大的 target 時，left 會一路推到 m * n，換算出列號 m，讀取不存在的列而拋錯。

## Complexity

搜尋空間共 m * n 格，每輪砍半，時間 O(log(m * n))，等價於 O(log m + log n)。對照：逐格掃描是 O(m * n)；先對列二分、再對欄二分也是 O(log m + log n)，複雜度相同，但攤平映射只寫一個迴圈，不必處理兩段二分的銜接。空間 O(1)——映射是純算術，從頭到尾沒有真的建出一維陣列。

## Digest

拿 [[1,3,5,7],[10,11,16,20],[23,30,34,60]] 找 16：m = 3、n = 4，虛擬索引 0 到 11。left = 0、right = 11，mid = 5 → (5 / 4, 5 % 4) = (1, 1)，值 11 < 16 → left = 6；mid = 8 → (2, 0)，值 23 > 16 → right = 7；mid = 6 → (1, 2)，值 16，命中。公式：row = Math.floor(mid / cols)、col = mid % cols，除數是欄數（一列的長度）；JavaScript 記得取整、Python 用 //。前提是接續性：每一列開頭大於上一列結尾，逐列串起來才是有序的一維陣列，第一課的閉區間模板才能原樣運作。

## TypeScript Tip

`noUncheckedIndexedAccess` 下兩層索引都要 `!` 收斂；除法務必 Math.floor。

```typescript
import assert from "node:assert";

function searchMatrix(matrix: number[][], target: number): boolean {
  const n = matrix[0]?.length ?? 0;
  if (n === 0) return false;
  let left = 0;
  let right = matrix.length * n - 1;
  while (left <= right) {
    const mid = left + Math.floor((right - left) / 2);
    const value = matrix[Math.floor(mid / n)]![mid % n]!;
    if (value === target) return true;
    if (value < target) left = mid + 1;
    else right = mid - 1;
  }
  return false;
}

const mat = [[1, 3, 5], [7, 9, 11]];
assert.strictEqual(searchMatrix(mat, 9), true);
assert.strictEqual(searchMatrix(mat, 6), false);
assert.strictEqual(searchMatrix([[1], [3], [5]], 3), true); // 單欄
```

## Python Tip

`//` 是整數除法；divmod(mid, n) 一次拿到 (row, col) 兩個值。

```python
def search_matrix(matrix: list[list[int]], target: int) -> bool:
    m = len(matrix)
    n = len(matrix[0]) if m else 0
    if n == 0:
        return False
    left, right = 0, m * n - 1
    while left <= right:
        mid = left + (right - left) // 2
        row, col = divmod(mid, n)
        if matrix[row][col] == target:
            return True
        if matrix[row][col] < target:
            left = mid + 1
        else:
            right = mid - 1
    return False

mat = [[1, 3, 5, 7], [10, 11, 16, 20], [23, 30, 34, 60]]
assert search_matrix(mat, 16) is True
assert search_matrix(mat, 13) is False
assert search_matrix(mat, 99) is False  # 比所有元素都大
assert search_matrix([[1], [3], [5]], 3) is True  # 單欄
```

## Takeaway

接續性讓矩陣等於攤平的有序陣列；row = mid / cols、col = mid % cols（整數除法），一維模板原樣搜到 O(log(m * n))。

## Tomorrow Preview

binary-search 模組到今天收官。回頭看，貫穿整個模組的是同一句口訣：區間定義、迴圈條件、更新方式三者成套——換比較基準、換維度，論證的骨架從沒變過。之後在任何具單調性的場景，先想清楚不變式與比較基準，模板自然就位。明天起進入新的主題。

## Today's Challenge

- **74** · 每一列開頭接續上一列結尾，整個矩陣逐列讀就是一條有序陣列——座標映射加標準閉區間模板的教科書落地。
  - Hint: left = 0、right = m * n - 1；取值用 matrix[Math.floor(mid / n)][mid % n]，除數是欄數 n。
