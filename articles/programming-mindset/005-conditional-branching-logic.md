---
id: conditional-branching-logic
title: Conditional Branching Logic
module: programming-mindset
pattern_label: Decision Table
complexity_label: O(1) / O(1)
estimated_minutes: 15
exit_criteria:
  - 能寫出沒有遺漏邊界條件的 if-else 邏輯
---
## Concept

Conditional Branching Logic（條件分支邏輯）的正確性由兩個判準決定：互斥（mutually exclusive）——任一輸入只會命中一個分支；窮盡（exhaustive）——所有可能的輸入都有分支承接。Decision Table（決策表）是同時檢驗兩者的工具：把輸入空間切成不重疊的區間或狀態，每一格對應恰好一條處理路徑；格子有重疊就是互斥破功，有空格就是窮盡破功。要注意的是，`if / else if / else` 鏈在語法上天然互斥——先命中者先攔截，後面的分支只在前面全部不成立時才被考慮——但這份互斥是用「順序」換來的：每個條件的完整語意其實是「自身成立，且前面全部不成立」。因此分支順序不是排版風格，而是邏輯本身的一部分；順序一換，程式的意義就變了。

## Thinking

設計分支時遵循「由特殊到一般」的順序。第一步，先寫 Guard Clauses：把無效輸入、空值、極端邊界在函式開頭攔截並提前返回，讓後續程式碼在「輸入保證合法」的前提下運作。第二步，處理特例——涵蓋範圍越窄的條件越要往前放。以閏年判斷為例：正確順序是先判 `year % 400 == 0`（閏年）、再判 `year % 100 == 0`（平年）、最後判 `year % 4 == 0`（閏年）；若把最寬鬆的 `% 4` 放到最前面，逢百的平年因為也能被 4 整除，就會被提前攔截、誤判成閏年。第三步，一般情況殿後，並用明確的 `else` 或預設返回值承接所有殘餘狀態。最後做兩個檢查：所有分支條件的聯集是否覆蓋整個輸入空間？任兩個分支的交集是否為空？答不出來時，用昨天學的追蹤表代入可疑輸入逐行驗證。

## Pattern Recognition

當題目要求「根據不同狀態、範圍或型態執行不同行為」時，就是 Decision Table 的場景：分段計費、成績分級、狀態轉移規則都是典型例子。更明確的訊號是規則描述裡出現「若…則…，否則…」「除了…以外」「優先…」這類字眼——「除了」代表有特例要先攔截，「優先」代表順序承載語意。此時先別急著寫程式，把所有輸入狀態列成表格、逐格填上對應行為，重疊與遺漏會在表上直接現形。

## Common Mistakes

第一，寬鬆條件放前面造成遮蔽（Shadowing）：後方更特殊的分支永遠不會執行，而且這種錯不會報錯、只會默默給出錯的答案，比語法錯誤難抓得多。第二，區間銜接處的邊界不一致：這一格用 `score >= 60`、下一格用 `score > 60`，60 這個值就可能兩邊都進或兩邊都不進——相鄰區間的邊界符號必須成對檢查。第三，省略 fallback：沒有 `else` 承接的殘餘狀態會默默落空，在 TypeScript 中常以函式回傳 `undefined` 的形式在遠處爆炸；即使你確信某狀態不會發生，也應該在該路徑丟出錯誤，讓假設被違反時立刻現形。第四，語言陷阱：TypeScript 的 `switch` 忘寫 `break` 會 fall-through 到下一個 `case`；Python 靠 `elif` 鏈維持互斥，若誤寫成多個獨立的 `if`，每個條件都會被獨立評估，互斥就消失了。

## Complexity

O(1) / O(1)。條件判斷的次數是固定常數，與輸入規模無關，也不需要額外記憶體。但要分清楚：決策表的價值不在效能而在正確性——重排分支順序不會改變複雜度，卻可能徹底改變答案；本課所有功夫都花在「對」，而不是「快」。

## Digest

條件分支的兩個判準：互斥——任一輸入只命中一個分支；窮盡——所有輸入都有分支承接。`if / else if` 鏈的互斥是用順序換來的，每個條件的完整語意是「自身成立且前面全不成立」，因此特例必須放在寬鬆條件之前：閏年判斷先判 `% 400`、再 `% 100`、最後 `% 4`，若 `% 4` 在前，逢百的平年就會被誤判成閏年。設計流程：Guard Clauses 先擋無效輸入，特例先行、一般殿後，最後用 `else` 承接殘餘狀態，並自問「條件聯集是否覆蓋全部輸入、兩兩交集是否為空」。邊界符號要成對檢查：`>= 60` 與 `> 60` 混用，60 就會落空或重複命中。

## TypeScript Tip

Guard clauses 讓每個 `return` 的前提一目了然：特例先攔截、提前返回，就不需要巢狀 if：

```typescript
function isLeap(year: number): boolean {
  if (year % 400 === 0) return true; // 最特殊的例外先行
  if (year % 100 === 0) return false;
  return year % 4 === 0; // 一般情況殿後
}
if (!isLeap(2000)) throw new Error("assertion failed");
if (isLeap(1900)) throw new Error("assertion failed");
if (!isLeap(2024)) throw new Error("assertion failed");
if (isLeap(2023)) throw new Error("assertion failed");
```

四個斷言各踩一條路徑：試著把 `% 4` 那行移到最前面，`isLeap(1900)` 立刻變成 `true`、斷言即失敗——順序就是語意。

## Python Tip

`elif` 鏈由嚴到寬，每個分支的隱含前提是「前面全部不成立」，區間自然互斥；早期返回先擋無效輸入：

```python
def grade(score: int) -> str:
    if not 0 <= score <= 100:  # guard：先擋無效輸入
        return "invalid"
    if score >= 90:
        return "A"
    elif score >= 60:
        return "B"
    else:
        return "C"

assert grade(90) == "A" and grade(89) == "B"
assert grade(60) == "B" and grade(59) == "C"
assert grade(101) == "invalid"
```

斷言全押在邊界的兩側（90/89、60/59）：任何一個 `>=` 被誤寫成 `>`，對應邊界的斷言都會立刻失敗。

## Takeaway

分支順序就是語意：特例與邊界先攔截、一般情況殿後，確保互斥且涵蓋所有輸入。

## Tomorrow Preview

明天課程沿兩條路線前進：一條是 Loop Invariant Thinking，學習用「每一輪前後都保持為真的性質」論證迴圈正確性，讓初始值與邊界符號由定義推導而非試錯；另一條進入 Array 的 Two Pointers from Opposite Ends，以左右指標從兩端向中間收斂——每一步該移動哪個指標，正是今天分支邏輯的實戰。

## Today's Challenge

本篇為觀念課，沒有對應的 LeetCode 練習題。請把時間花在把上面的觀念想透，並替你最近寫過的一段 if-else 畫一張決策表，檢查互斥與窮盡。
