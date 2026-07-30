---
id: two-pointer-valid-palindrome-ii
title: Valid Palindrome with Single Deletion
module: two-pointer
topic: two-pointer
difficulty: easy
estimated_minutes: 15
pattern_label: Two Pointers - Conditional Branching
complexity_label: O(n) / O(1)
prerequisite:
  - string-two-pointers-opposite
  - two-pointer-backspace-string-compare
next:
  - two-pointer-sort-array-by-parity
learning_goal:
  - 學習當雙指標遇到不匹配時，如何分支出子問題檢查允許刪除一個字元的情況
exit_criteria:
  - 能夠在發現字元不相等時正確驗證跳過左邊或跳過右邊的子字串是否為迴文
  - 理解分支邏輯對時間複雜度的影響仍保持在 O(n)
leetcode:
  - 680
tags:
  - two-pointers
  - string
  - greedy
---

## Author Hints

- 核心觀念：正常進行相向雙指標迴文檢查，當 s[left] != s[right] 時，分別嘗試刪除左邊或右邊一個字元再檢查剩餘部分。
- Pattern 辨識線索：判斷字串是否能在刪除至多一個字元的條件下成為迴文。
- Thinking：左右指標向內夾擊，不相等時呼叫輔助函式檢查 s[left+1...right] 或 s[left...right-1] 是否為迴文。
- Common Mistakes：在第一次遇到不相等時沒有涵蓋兩種刪除可能性。
- TypeScript 重點：封裝一個子範圍檢查迴文的 helper function 保持程式碼乾淨。
- Python 重點：利用 Python 的切片語法快速驗證子字串是否為迴文。
- 題號 680 為何適合此 Pattern：雙指標遇到不匹配時的分支延伸應用。
