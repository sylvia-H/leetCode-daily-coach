---
id: sliding-window-minimum-window-substring
title: Minimum Window Substring
module: sliding-window
pattern_label: Variable Sliding Window + Requirement Counter
complexity_label: O(n + m) / O(1)
estimated_minutes: 25
exit_criteria:
  - 能追蹤有多少個必要的相異字元已達到其目標頻率。
  - 能在維持完整涵蓋所有必要字元的同時，貪婪地收縮左指標。
---
## Concept

Minimum Window Substring 是一種進階的 Variable Sliding Window 問題。核心在於動態維護一個左右指標，透過擴展右指標（Right Pointer）來尋找包含所有目標字元（t）的有效視窗，隨後收縮左指標（Left Pointer）來尋找包含相同所有目標字元的最小長度視窗。為了在常數時間內確認視窗是否滿足條件，我們需要引入一個狀態計數器（Requirement Counter），用來追蹤當前視窗內已滿足目標頻率的獨立字元數量。

## Thinking

解題思考分為四個步驟：第一，建立字元頻率表（Frequency Map）記錄字串 t 中每個字元的所需數量。第二，使用 formed 變數記錄已經達到目標頻率的獨立字元數，當 formed 等於所需總數時，代表當前視窗是合法的（Valid Window）。第三，右指標不斷右移，將新字元納入視窗並更新當前統計。第四，一旦視窗合法，立刻嘗試收縮左指標，記錄此時的最小視窗長度與邊界，直到視窗不再合法為止，重複此過程直到右指標遍歷完整個字串。

## Pattern Recognition

當題目要求『尋找包含另一個字串所有字元的最小子字串』（Finding the smallest substring containing all characters of another string），且字串長度可能很長、需要有效率的線性時間解法時，這就是經典的 Variable Sliding Window + Requirement Counter 模式。與一般固定長度的視窗不同，這裡的視窗大小會根據合法性條件動態伸縮。

## Common Mistakes

最常見的錯誤在於收縮左指標時，未能正確維護 formed 計數。當左指標指向的字元頻率剛好達到目標閾值、且即將被移出視窗時，若沒有將 formed 數量減一，會導致演算法誤判視窗的合法性狀態，進而錯過真正的最小視窗解。另一個錯誤是忽略了字串中可能包含重複字元，直接使用字元總長度而非獨立字元種類數作為完成條件。

## Complexity

時間複雜度：O(n + m)，其中 n 是字串 s 的長度，m 是字串 t 的長度。左右指標各自最多走過 s 的每個字元一次。空間複雜度：O(k)，其中 k 是字元集的大小（若為英文大小寫字母，k 最大為 52，可視為常數 O(1)）。

## Digest

Minimum Window Substring 是滑動視窗（Sliding Window）的殿堂級考題。我們透過擴展右指標收集候選字元，並利用 Requirement Counter 在 O(1) 時間內判斷視窗是否合法。一旦合法，便積極收縮左指標以逼近最小長度。此模式不僅適用於字串覆蓋問題，也是處理陣列區間包含特定集合條件的通用骨架。

## TypeScript Tip

```typescript
// TypeScript 效能與型別實踐建議
function checkCoverage(windowMap: Map<string, number>, targetMap: Map<string, number>): boolean {
  for (const [key, val] of targetMap) {
    if ((windowMap.get(key) || 0) < val) return false;
  }
  return true;
}
const wMap = new Map([["a", 1]]);
const tMap = new Map([["a", 1]]);
if (!checkCoverage(wMap, tMap)) throw new Error("assertion failed");
```

## Python Tip

```python
# Python 效能與字典操作建議
from collections import defaultdict

def fast_counter_check() -> bool:
    d = defaultdict(int)
    d["a"] += 1
    return d["a"] == 1

assert fast_counter_check() == True, "assertion failed"
```

## Takeaway

掌握 Variable Sliding Window 搭配 Requirement Counter，能以 O(n + m) 時間精準解開字串覆蓋與極小化視窗問題。

## Tomorrow Preview

明天我們將探討字串處理中的雙指標與字元頻率結合的另一種變化題型：Longest Substring Without Repeating Characters，學習如何使用固定或變動大小的視窗來處理無重複字元的連續區間。

## Today's Challenge

- **76** · 本題為 Minimum Window Substring 的原題，完美對應 Variable Sliding Window 與 Requirement Counter 的所有特徵。
  - Hint: 使用兩個雜湊表或陣列分別紀錄目標字元頻率與當前視窗頻率，配合 formed 變數進行動態收縮。
