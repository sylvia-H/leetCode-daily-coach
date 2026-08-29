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

在處理二維矩陣（2D Matrix）的搜尋問題時，若該矩陣的行與列皆具備嚴格的排序性質（例如每一行的元素皆由左至右遞增，且每一列的第一個元素大於上一列的最後一個元素），我們便可以將此二維矩陣在邏輯上扁平化（Flatten）為一個一維的有序陣列。透過數學座標映射公式，我們不需要額外配置記憶體去複製矩陣元素，就能直接運用 Binary Search 在 O(log(m * n)) 的時間複雜度內找到目標值。

## Thinking

當我們將二維矩陣視為一維陣列時，其邏輯索引範圍為 0 到 (m * n - 1)，其中 m 為行數（Rows）、n 為列數（Cols）。在進行標準的 Binary Search 時，我們維護左右指針 left = 0 與 right = m * n - 1。每次計算出中點索引 mid 後，必須將這個一維索引轉回二維矩陣的座標 (row, col)。其核心轉換公式為：row = mid / cols（整數除法取得行號），col = mid % cols（取餘數取得列號）。接著，我們透過 matrix[row][col] 取得對應數值，並與目標值 target 進行比較，藉此調整 left 或 right 指針。

## Pattern Recognition

當題目給定一個 m * n 的矩陣，且其元素排列具備單調性（Monotonicity），例如行遞增、列遞增，或類似 LeetCode 74 的全矩陣嚴格遞增特性時，即可高度識別此問題適用 Binary Search 搭配座標映射的 Pattern。這類問題的特徵在於矩陣本身隱含著一個已排序的陣列結構，解題關鍵不在於使用複雜的動態規劃，而在於如何利用數學公式在 O(1) 空間內完成一維與二維索引的即時轉換。

## Common Mistakes

開發者在實作此 Pattern 時最常見的錯誤包含：第一，在計算座標時混淆了行列維度，例如將 row 誤用為 mid % cols，或者將 col 誤用為 mid / cols；第二，未妥善處理矩陣為空或欄位數為零的邊界情況，導致分母為零的例外錯誤（Division by Zero）；第三，在計算一維總元素數量時，將行數與列數相乘寫錯，導致 right 指針的初始值超出矩陣實際範圍。

## Complexity

時間複雜度為 O(log(m * n))，因為每次迭代會將搜尋空間減半；空間複雜度為 O(1)，僅使用常數級別的變數來儲存指針與座標，未額外佔用記憶體。

## Digest

本單元探討如何將二維矩陣透過數學映射轉換為一維陣列進行 Binary Search。核心在於利用 row = mid / cols 與 col = mid % cols 將中點索引還原為二維座標，達到 O(log(m * n)) 時間與 O(1) 空間的極致效能。

## TypeScript Tip

```typescript
function getCoordinate(mid: number, cols: number): [number, number] {
  const row = Math.floor(mid / cols);
  const col = mid % cols;
  return [row, col];
}
const [r, c] = getCoordinate(5, 4);
if (r !== 1 || c !== 1) throw new Error("assertion failed");
```

## Python Tip

```python
def get_coordinate(mid: int, cols: int) -> tuple[int, int]:
    row = mid // cols
    col = mid % cols
    return row, col

r, c = get_coordinate(5, 4)
assert r == 1 and c == 1, "assertion failed"
```

## Takeaway

透過算術映射將二維矩陣視為一維有序陣列，掌握 row = mid / cols 與 col = mid % cols 即可解題。

## Tomorrow Preview

明天我們將探討延伸的二維矩陣搜尋問題（如 LeetCode 240 Search a 2D Matrix II），該矩陣僅保證行與列各自遞增，但不具備全矩陣接續遞增的特性。我們將學習如何利用右上角或左下角作為起點，在 O(m + n) 的時間複雜度內完成高效搜尋。

## Today's Challenge

- **74** · 矩陣的每一行皆接續上一行的排序特性，使其整體等價於一個大型的一維有序陣列，完美契合 Binary Search 與座標映射 Pattern。
  - Hint: 注意矩陣為空或欄位數為零的邊界條件，並確實使用整數除法計算 row 與 col。
