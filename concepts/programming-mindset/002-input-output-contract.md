---
id: input-output-contract
title: Input-Output Contract
module: programming-mindset
topic: programming-mindset
difficulty: easy
estimated_minutes: 12
pattern_label: Contract Definition
complexity_label: O(1) / O(1)
prerequisite:
  - computational-thinking-basics
next:
  - mental-model-variables
learning_goal:
  - 學會精準界定函式的輸入格式與輸出保證
exit_criteria:
  - 能夠在動筆前寫出函式的型別簽章與邊界條件
leetcode: []
tags:
  - mindset
  - contract
---

## Author Hints

- 核心觀念：明確的合約能消除八成以上的除錯時間
- Pattern 辨識線索：當題目給定參數範圍與回傳型別要求時
- Thinking：確認參數可能為空或極端值的行為
- Common Mistakes：假設輸入永遠符合理想狀態
- TypeScript 重點：善用 TypeScript interface 或 type 明確定義 IO
- Python 重點：善用 type hints 提升程式碼自我文件化能力
