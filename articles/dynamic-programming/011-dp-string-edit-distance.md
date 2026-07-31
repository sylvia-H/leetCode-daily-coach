---
id: dp-string-edit-distance
title: Edit Distance Pattern
module: dynamic-programming
pattern_label: Edit Distance
complexity_label: 'O(m*n) / O(min(m, n))'
estimated_minutes: 25
exit_criteria:
  - 能夠寫出同時包含插入、刪除、替換三種決策的狀態轉移方程式
  - 能夠正確初始化空字串轉換為目標字串所需的基礎編輯步數
---
## Concept

Edit Distance Pattern 是一種處理字串轉換與動態規劃的經典模型。它的核心目標是計算將一個來源字串轉換成另一個目標字串所需的最小編輯操作次數。常見的操作包含三種：插入一個字元、刪除一個字元、以及替換一個字元。透過二維陣列的狀態轉移，我們可以系統化地求解字串之間的差異與相似度。

## Thinking

當我們思考如何將字串 s1 轉換為 s2 時，可以從字串的末端開始檢查。若最後一個字元相符，則不需要額外操作，問題可縮小為子問題 dp[i-1][j-1]。若最後一個字元不相符，我們必須在三種操作中做出選擇：插入字元（對應 dp[i][j-1]）、刪除字元（對應 dp[i-1][j]）、或替換字元（對應 dp[i-1][j-1]）。我們取這三種操作所產生的最小步數，並加上當前的一次操作成本（即 +1），這就是完整的狀態轉移方程式：min(insert, delete, replace) + 1。

## Pattern Recognition

當題目明確要求計算「將一個字串轉換成另一個字串所需的最小操作次數」、「計算兩個字串的相似度與編輯成本」，或者在某些字串比對與自動校正的場景中，這就是典型的 Edit Distance Pattern。此外，若問題允許透過刪除特定字元來使兩個字串達到相等（如 Minimum ASCII Delete Sum for Two Strings），其底層架構與狀態轉移邏輯也高度相似。

## Common Mistakes

初學者在實現 Edit Distance Pattern 時，最常犯的錯誤是搞錯各種操作對應到 DP 表格的方向。例如誤將插入操作對應到上方，或將刪除操作對應到左方。正確的對應關係是：插入操作會消耗目標字串的字元，對應到表格的左方；刪除操作會消耗來源字串的字元，對應到表格的上方；而替換操作則是同時消耗雙方的字元，對應到表格的左上方。另一個常見錯誤是未正確初始化空字串轉換為目標字串所需的基礎編輯步數。

## Complexity

時間複雜度為 O(m * n)，其中 m 與 n 分別為兩個字串的長度，因為需要填滿大小為 (m+1) * (n+1) 的二維表格。空間複雜度若使用完整二維陣列為 O(m * n)，若運用滾動陣列進行優化，空間複雜度可降至 O(min(m, n))。

## Digest

Edit Distance Pattern 透過二維動態規劃解決字串轉換的最小操作成本問題。核心在於判斷字元是否相符，若不相符則取插入、刪除、替換三種決策的最小值加一。正確初始化基礎邊界條件與釐清表格方向是解題的關鍵。

## TypeScript Tip

```typescript
function optimizedMinDistance(word1: string, word2: string): number {
  let prev = Array.from({ length: word2.length + 1 }, (_, i) => i);
  for (let i = 1; i <= word1.length; i++) {
    const curr = [i];
    for (let j = 1; j <= word2.length; j++) {
      if (word1[i - 1] === word2[j - 1]) {
        curr[j] = prev[j - 1];
      } else {
        curr[j] = Math.min(prev[j], curr[j - 1], prev[j - 1]) + 1;
      }
    }
    prev = curr;
  }
  return prev[word2.length];
}
if (optimizedMinDistance("intention", "execution") !== 5) throw new Error("assertion failed");
```

## Python Tip

```python
def optimizedMinDistance(word1: str, word2: str) -> int:
    prev = list(range(len(word2) + 1))
    for i in range(1, len(word1) + 1):
        curr = [i]
        for j in range(1, len(word2) + 1):
            if word1[i - 1] == word2[j - 1]:
                curr.append(prev[j - 1])
            else:
                curr.append(1 + min(prev[j], curr[-1], prev[j - 1]))
        prev = curr
    return prev[-1]

assert optimizedMinDistance("intention", "execution") == 5, "assertion failed"
```

## TypeScript Corner

```typescript
function minDistance(word1: string, word2: string): number {
  const m = word1.length;
  const n = word2.length;
  const dp: number[][] = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));
  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (word1[i - 1] === word2[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1];
      } else {
        dp[i][j] = Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]) + 1;
      }
    }
  }
  return dp[m][n];
}
const result = minDistance("horse", "ros");
if (result !== 3) throw new Error("assertion failed");
```

## Python Corner

```python
def minDistance(word1: str, word2: str) -> int:
    m, n = len(word1), len(word2)
    dp = [[0] * (n + 1) for _ in range(m + 1)]
    for i in range(m + 1):
        dp[i][0] = i
    for j in range(n + 1):
        dp[0][j] = j
    for i in range(1, m + 1):
        for j in range(1, n + 1):
            if word1[i - 1] == word2[j - 1]:
                dp[i][j] = dp[i - 1][j - 1]
            else:
                dp[i][j] = min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]) + 1
    return dp[m][n]

result = minDistance("horse", "ros")
assert result == 3, "assertion failed"
```

## Takeaway

掌握插入、刪除與替換三種操作的狀態轉移與邊界初始化，能有效破解各類字串編輯距離與相似度計算問題。

## Tomorrow Preview

明天我們將探討字串比對的另一個經典模式：Longest Common Subsequence（LCS）及其延伸應用，學習如何處理不連續子序列的狀態轉移。

## Today's Challenge

- **72** · 本題為經典的 Edit Distance 題目，直接對應插入、刪除與替換三種字串轉換操作的狀態轉移模型。
  - Hint: 注意初始化空字串到目標字串所需的基礎邊界步數。
- **712** · 雖然本題計算的是刪除字元的最小 ASCII 總和，但其核心的決策架構與編輯距離模型高度相似。
  - Hint: 將操作成本從固定的 1 改為對應字元的 ASCII 數值即可。
