---
id: problem-simplification-strategy
title: Problem Simplification Strategy
module: programming-mindset
pattern_label: Reduction
complexity_label: O(1) / O(1)
estimated_minutes: 15
exit_criteria:
  - 能把抽象問題化為長度為 1 或 2 的具體案例進行推導
---
## Concept

Problem Simplification Strategy 是一種化繁為簡的核心思維。當我們面臨結構複雜、狀態繁多或是規模龐大的演算法問題時，人類的大腦往往難以一次掌握所有邊界條件與變數互動。此時，最有效的突破口便是主動縮減問題規模，將其簡化為極小版本的具體案例（例如陣列長度僅為 1 或 2，或是樹的高度僅為 1 層）。透過動手推導這些微型測資，我們得以剝除干擾視線的雜訊，直接觀察問題本質與資料變化的規律，隨後再將此規律推廣至一般化的複雜情境中。

## Thinking

面對抽象繁雜的題目敘述時，切忌一開始就企圖在腦海中建構涵蓋所有特例的巨型演算法。正確的思考路徑是『由小到大』。首先，尋找題目允許的最小有效輸入（Minimal Valid Input），例如陣列長度為 1 或空陣列。接著，手動計算並寫出該極小輸入的預期輸出。隨後，將輸入規模微幅增加至長度為 2 或 3，再次手動推導。在這個過程中，我們應該仔細觀察狀態是如何轉移的、資料是如何被操作的。當我們在這些微型案例中歸納出固定模式或遞移關係後，便能以此為基石，逐步推導出適用於全面規模的迴圈或遞迴邏輯。

## Pattern Recognition

當題目具備以下特徵時，即可啟動 Reduction 策略：第一，題目敘述極度抽象，涉及多維度的狀態變化或複雜的字串／陣列操作，讓人完全沒有頭緒；第二，範例測資（Examples）雖然給出，但規模稍大，包含了過多干擾判斷的分支條件；第三，你發現自己停留在空白編輯器前無法下筆，腦中只有模糊的概念而無具體的資料流向。此時，主動放棄複雜測資，在紙上或筆記本畫出長度為 1 與 2 的極小案例，就是最強而有力的破局訊號。

## Common Mistakes

最常見的錯誤是一開始就嘗試寫出涵蓋所有特殊狀況的通用解。許多開發者在尚未釐清基本案例（Base Case）的行為之前，就急著加入大量的 if-else 條件判斷來處理邊界狀況，導致程式碼迅速陷入高複雜度與邏輯漏洞之中。另一個常見誤區是過度依賴大腦思考，而不願意動手將極小測資的執行步驟逐行寫下來，這往往會錯失觀察規律的最佳時機。

## Complexity

O(1) / O(1)

## Digest

Problem Simplification Strategy 是對抗複雜度的核心策略。當題目抽象難解時，應主動將規模縮減至長度 1 或 2 的極小案例，透過手動推導與觀察來找出規律，再逐步推廣至通用解。這不僅能降低思考負擔，更能有效避免過早優化與邏輯陷阱。

## TypeScript Tip

```typescript
function processMinimalCase(input: number): number {
  const res = input + 10;
  if (res !== 15) throw new Error("assertion failed");
  return res;
}
const val = processMinimalCase(5);
if (val !== 15) throw new Error("assertion failed");
```

## Python Tip

```python
def process_minimal_case(input_val: int) -> int:
    res = input_val + 10
    assert res == 15, "assertion failed"
    return res

val = process_minimal_case(5)
assert val == 15, "assertion failed"
```

## TypeScript Corner

```typescript
function solveSimplified(nums: number[]):
number {
  if (nums.length === 0) return 0;
  const result = nums[0] * 2;
  if (result !== 2) throw new Error("assertion failed");
  return result;
}
const testOutput = solveSimplified([1]);
if (testOutput !== 2) throw new Error("assertion failed");
```

## Python Corner

```python
def solve_simplified(nums: list[int]) -> int:
    if not nums:
        return 0
    result = nums[0] * 2
    assert result == 2, "assertion failed"
    return result

test_output = solve_simplified([1])
assert test_output == 2, "assertion failed"
```

## Takeaway

化繁為簡，從長度為 1 的極小案例開始動手推導，規律自然浮現。

## Tomorrow Preview

明天我們將探討如何將這種化繁為簡的基礎案例，進一步擴展並轉化為遞迴結構（Recursion）與狀態轉移方程式，建立系統化的解題架構。

## Today's Challenge

本篇為觀念課，沒有對應的 LeetCode 練習題。請把時間花在把上面的觀念想透。
