---
id: array-range-sum-query
title: Range Sum Query Using Prefix Sum
module: array
topic: array
difficulty: medium
estimated_minutes: 15
pattern_label: Prefix Sum Query
complexity_label: O(1) per query / O(n)
prerequisite:
  - array-prefix-sum-basic
next:
  - array-two-pointers-opposite
learning_goal:
  - 利用前綴和陣列在 O(1) 時間內回答任意區間和查詢
exit_criteria:
  - '能正確寫出區間 [L, R] 總和公式 P[R] - P[L-1]'
  - 能處理 L = 0 時的邊界情況
leetcode:
  - 303
  - 560
  - 304
tags:
  - array
  - prefix-sum
  - range-query
---

## Author Hints

- 核心觀念：利用前綴和的差分性質，將任意子陣列和轉換成兩項相減。
- Pattern 辨識線索：靜態陣列且有多個區間查詢請求（Range Sum Query）。
- Thinking：將查詢區間 [i, j] 轉換為 prefix[j] - prefix[i - 1]，注意當 i 為 0 時的特殊處理。
- Common Mistakes：忘記處理 L=0 導致存取負數索引。
- TypeScript 重點：封裝成類別時在建構子中預先計算前綴和陣列。
- Python 重點：利用快取機制或類別屬性儲存前綴和以供多次查詢使用。
- 題號 303 為何適合此 Pattern：多次查詢靜態陣列的區間和，非常適合前綴和技巧。
- 題號 560 為何適合此 Pattern：雖然是求特定和的子陣列，但其核心依然是透過前綴和的概念來進行區間查詢。
- 題號 304 為何適合此 Pattern：將一維前綴和的概念延伸至二維矩陣，進行高效的子矩陣區間和查詢。
