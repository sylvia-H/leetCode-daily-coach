---
id: dp-string-lcs-basic
title: Longest Common Subsequence
module: dynamic-programming
pattern_label: Two-Sequence DP
complexity_label: 'O(m*n) / O(min(m, n))'
estimated_minutes: 25
exit_criteria:
  - 能夠在字元相符與不相符時寫出正確的狀態轉移方程式
  - 能夠理解二維字串 DP 的空間滾動優化技巧
---
## Concept

Longest Common Subsequence 是一種經典的 Two-Sequence DP 問題，用以尋找兩個字串中以相同順序出現但不必連續的最長字元序列長度。當處理兩個獨立序列的匹配與最佳化問題時，二維狀態轉移模型能系統性地遍歷所有可能的子序列組合。

## Thinking

定義二維陣列 dp[i][j] 表示字串 s1 前 i 個字元與 s2 前 j 個字元的 LCS 長度。當 s1[i-1] == s2[j-1] 時，狀態轉移方程式為 dp[i][j] = dp[i-1][j-1] + 1；當字元不相符時，則取不包含當前 s1 字元或不包含當前 s2 字元的歷史最大值，即 dp[i][j] = max(dp[i-1][j], dp[i][j-1])。

## Pattern Recognition

當題目給定兩個序列，要求尋找最長共同子序列、編輯距離、相似度或進行序列匹配時，即可辨識為 Two-Sequence DP 模式。其核心特徵在於狀態需要同時追蹤兩個序列各自的掃描進度。

## Common Mistakes

最常見的錯誤在於字串索引與 DP 表格大小差 1 導致邊界錯亂。通常 DP 表格大小會設為 (m+1) x (n+1) 以便處理空字串的邊界情況，若未正確對齊字串索引與表格索引，極易引發陣列越界或狀態錯置。

## Complexity

時間複雜度為 O(m * n)，其中 m 與 n 分別為兩個字串的長度；空間複雜度若完整保留二維表格為 O(m * n)，但由於狀態僅依賴上一列，可透過滾動陣列優化至 O(min(m, n))。

## Digest

今日重點在於掌握 Longest Common Subsequence 的 Two-Sequence DP 模型。透過建立二維表格比較兩個字串的字元，處理相符與不相符的狀態轉移，並理解空間複雜度優化技巧。

## TypeScript Tip

```typescript
function lcsOptimized(text1: string, text2: string): number {
  let [s1, s2] = text1.length < text2.length ? [text2, text1] : [text1, text2];
  let dp = new Array(s2.length + 1).fill(0);
  for (const c1 of s1) {
    let prev = 0;
    for (let j = 1; j <= s2.length; j++) {
      const temp = dp[j];
      if (c1 === s2[j - 1]) {
        dp[j] = prev + 1;
      } else {
        dp[j] = Math.max(dp[j], dp[j - 1]);
      }
      prev = temp;
    }
  }
  const result = dp[s2.length];
  if (result !== 3) throw new Error("Assertion failed");
  return result;
}
lcsOptimized("abcde", "ace");
```

## Python Tip

```python
def lcs_optimized(text1: str, text2: str) -> int:
    if len(text1) < len(text2):
        text1, text2 = text2, text1
    dp = [0] * (len(text2) + 1)
    for c1 in text1:
        prev = 0
        for j, c2 in enumerate(text2, 1):
            temp = dp[j]
            if c1 == c2:
                dp[j] = prev + 1
            else:
                dp[j] = max(dp[j], dp[j - 1])
            prev = temp
    result = dp[len(text2)]
    assert result == 3, "Assertion failed"
    return result

lcs_optimized("abcde", "ace")
```

## TypeScript Corner

```typescript
function longestCommonSubsequence(text1: string, text2: string): number {
  const m = text1.length;
  const n = text2.length;
  const dp: number[][] = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (text1[i - 1] === text2[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1] + 1;
      } else {
        dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
      }
    }
  }
  const result = dp[m][n];
  if (result !== 3) throw new Error("Assertion failed");
  return result;
}
longestCommonSubsequence("abcde", "ace");
```

## Python Corner

```python
def longestCommonSubsequence(text1: str, text2: str) -> int:
    m, n = len(text1), len(text2)
    dp = [[0] * (n + 1) for _ in range(m + 1)]
    for i in range(1, m + 1):
        for j in range(1, n + 1):
            if text1[i - 1] == text2[j - 1]:
                dp[i][j] = dp[i - 1][j - 1] + 1
            else:
                dp[i][j] = max(dp[i - 1][j], dp[i][j - 1])
    result = dp[m][n]
    assert result == 3, "Assertion failed"
    return result

longestCommonSubsequence("abcde", "ace")
```

## Takeaway

雙序列 DP 核心在於定義 dp[i][j] 表示前綴匹配，字元相符取斜上加一，不相符取上或左最大值。

## Tomorrow Preview

明天將探討範圍查詢與區間動態規劃，學習如何在區間內合併最佳解。

## Today's Challenge

- **1143** · 最長共同子序列的標準題型，直接對應二維狀態轉移模型。
  - Hint: 建立 (m+1) x (n+1) 的二維表格進行狀態轉移。
- **583** · 求使兩個字串相同的最少刪除步數，可轉化為總長度減去兩倍 LCS 長度來求解。
  - Hint: 先求出 LCS，再透過字串長度減去兩倍 LCS 得到刪除次數。
- **392** · 最簡單的雙序列匹配與子序列判定問題，可用於驗證 LCS 長度是否等於較短字串長度。
  - Hint: 檢查 LCS 結果是否等於子字串的長度。
