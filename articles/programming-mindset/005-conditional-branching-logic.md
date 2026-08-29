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

Conditional Branching Logic 是程式設計中最基礎且核心的控制流結構。在處理複雜業務需求時，確保條件分支互相排斥（mutually exclusive）且全面涵蓋所有可能性（exhaustive）是維持程式碼正確性的關鍵。若條件判斷不夠嚴謹，往往會引發邏輯漏洞或非預期的副作用。

## Thinking

在設計條件分支時，應遵循由特例到一般、由嚴格到寬鬆的思考順序。優先處理無效輸入、極端邊界與特殊狀態（即 Guard Clauses），提前終止或返回；接著處理主要的業務邏輯分支，最後保留適當的預設分支（Fallback）來捕捉所有未預期的殘餘狀態。

## Pattern Recognition

當題目要求根據不同的狀態、範圍、資料型態或業務規則執行完全不同的行為時，即可辨識出這是 Decision Table 或 Conditional Branching 的應用場景。此時應將所有可能的輸入狀態列舉成矩陣，確保每一個狀態都有對應且唯一的處理邏輯。

## Common Mistakes

最常見的錯誤是條件順序錯誤或條件重疊，導致特定分支被前方較寬鬆的條件提前攔截（Shadowing），使後續的正確邏輯永遠無法被執行。另一個常見問題是忽略了未被覆蓋的邊界狀態，導致在特定輸入下程式碼落入未定義行為。

## Complexity

時間複雜度為 O(1)，因為條件判斷的次數是固定的常數級別；空間複雜度為 O(1)，不需要額外的記憶體開銷。

## Digest

本單元聚焦於 Conditional Branching Logic 與 Decision Table 的設計原則。我們學習了如何確保條件的互斥性與完整性，並透過優先處理邊界情況來避免邏輯漏洞。無論是在 TypeScript 還是 Python 中，保持扁平的條件結構與明確的防禦性檢查，都是編寫高品質維護性程式碼的基石。

## TypeScript Tip

```typescript
function processUser(status: string, age: number): boolean {
  if (status !== "ACTIVE") return false;
  if (age < 18) return false;
  return true;
}
const statusCheck = processUser("ACTIVE", 20);
if (statusCheck !== true) throw new Error("Assertion failed");
```

## Python Tip

```python
def process_user(status: str, age: int) -> bool:
    if status != "ACTIVE":
        return False
    if age < 18:
        return False
    return True

status_check = process_user("ACTIVE", 20)
assert status_check is True, "Assertion failed"
```

## Takeaway

條件分支必須互相排斥並涵蓋所有可能，優先處理邊界與特例以維持邏輯清晰。

## Tomorrow Preview

明天我們將探討如何利用 Hash Map 取代複雜的 Conditional Branching Logic，進一步提升程式碼的可讀性與擴充性。

## Today's Challenge

本篇為觀念課，沒有對應的 LeetCode 練習題。請把時間花在把上面的觀念想透。
