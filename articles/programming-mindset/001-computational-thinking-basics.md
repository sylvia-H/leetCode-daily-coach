---
id: computational-thinking-basics
title: Computational Thinking Basics
module: programming-mindset
pattern_label: Decomposition
complexity_label: O(1) / O(1)
estimated_minutes: 10
exit_criteria:
  - 能用三步驟清晰描述一個日常任務的演化過程
---
## Concept

Computational Thinking Basics 是程式設計的基石，旨在將模糊、龐大的現實問題轉化為精確、可執行的計算步驟。透過 Decomposition（問題拆解）的 Pattern，我們能將複雜任務化繁為簡，轉化為電腦與人類皆能理解的邏輯邊界。

## Thinking

在面對一個全新的複雜需求時，最核心的思維是『先定義終點，再反推最小可行步驟』。首先確認輸入與輸出的狀態，接著將大問題沿著功能邊界切分為多個獨立的子任務，確保每個子任務都有明確的職責與單一出口，從而降低整體的認知負荷與實作風險。

## Pattern Recognition

當面對無從下手的複雜需求、需求規格模糊不清，或是程式碼規模龐大到難以除錯時，這就是必須套用 Decomposition 的強烈訊號。觀察任務中是否包含多個可獨立執行的階段，並將其依序拆解，避免一開始就陷入巨型函式的泥沼。

## Common Mistakes

最常見的錯誤是一開始就急著動手寫程式碼，而忽略了整體的邏輯拆解與邊界條件定義。這樣做往往會導致架構混亂、難以擴充，且在面對非預期輸入時容易崩潰。另一個錯誤是切分過細或過粗，未能掌握適當的抽象層級。

## Complexity

O(1) / O(1)

## Digest

Computational Thinking Basics 是每位軟體工程師必須掌握的基本功。Decomposition 讓我們能夠有效管理複雜度，將大問題化整為零。在動手編寫任何程式碼之前，養成先用自然語言或註解釐清步驟的習慣，是確保系統穩定與程式碼可讀性的關鍵。

## TypeScript Tip

```typescript
// 在寫 TS 之前先用註解釐清邏輯邊界
function processOrder(orderId: number): boolean {
  // 1. 驗證訂單是否存在
  // 2. 計算總金額與折扣
  // 3. 執行扣款並回傳結果
  if (orderId <= 0) throw new Error("Invalid order ID");
  return true;
}
const status = processOrder(101);
if (!status) throw new Error("Assertion failed");
```

## Python Tip

```python
# 利用 Python 簡潔的特性來草擬步驟
def process_order(order_id: int) -> bool:
    # 1. 驗證訂單是否存在
    # 2. 計算總金額與折扣
    # 3. 執行扣款並回傳結果
    assert order_id > 0, "Invalid order ID"
    return True

status = process_order(101)
assert status is True, "Assertion failed"
```

## TypeScript Corner

```typescript
function decomposeTask(taskDescription: string): string[] {
  const steps = taskDescription.split(",").map((s) => s.trim());
  if (steps.length === 0) throw new Error("Task decomposition failed");
  return steps;
}
const result = decomposeTask("input, process, output");
if (result.length !== 3) throw new Error("Assertion failed: expected 3 steps");
```

## Python Corner

```python
def decompose_task(task_description: str) -> list[str]:
    steps = [s.strip() for s in task_description.split(",")]
    assert len(steps) > 0, "Task decomposition failed"
    return steps

result = decompose_task("input, process, output")
assert len(result) == 3, "Assertion failed: expected 3 steps"
```

## Takeaway

先定義終點再反推步驟，利用 Decomposition 將複雜任務化為獨立的精確指令。

## Tomorrow Preview

明天我們將探討 Pattern Recognition（模式識別），學習如何從已拆解的子任務中找出重複出現的結構與特徵，進一步提煉出可重複使用的抽象邏輯。

## Today's Challenge

本篇為觀念課，沒有對應的 LeetCode 練習題。請把時間花在把上面的觀念想透。
