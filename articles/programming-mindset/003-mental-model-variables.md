---
id: mental-model-variables
title: Mental Model of Variables
module: programming-mindset
pattern_label: State Tracking
complexity_label: O(1) / O(1)
estimated_minutes: 15
exit_criteria:
  - 能正確畫出變數賦值前後的記憶體指向變化
---
## Concept

建立變數是記憶體容器的正確心智模型。在編程的世界中，變數並非數學代數中的未知數，而是一個個具備時序性的狀態記錄器（State Recorder）。理解變數的本質在於掌握記憶體配置與參考指向的動態變化。

## Thinking

在追蹤狀態時，必須在腦海中模擬記憶體的配置狀態。每當執行賦值運算子（Assignment Operator）時，就是將一個運算結果的記憶體參考（Reference）綁定到變數名稱上。開發者必須隨時釐清當前變數所代表的數值或狀態在演算法的哪個階段。

## Pattern Recognition

當需要在迴圈或遞迴中累積數值、追蹤最大或最小值、或是記錄狀態轉換（State Transition）時，就會使用到 State Tracking Pattern。此時變數扮演著跨越時間軸保存狀態的核心角色。

## Common Mistakes

最常見的錯誤是賦予單一變數過多重疊且含糊不清的含義，隨著程式碼的擴展，導致變數在不同階段被賦予完全不同的資料型別或語意，進而引發難以除錯的邏輯錯誤與執行階段異常。

## Complexity

Time Complexity: O(1) / Space Complexity: O(1)，因為單純宣告變數與基本賦值操作僅佔用固定的常數時間與常數記憶體空間。

## Digest

變數是程式設計中最基礎卻也最核心的概念。本單元協助開發者建立正確的記憶體容器心智模型，捨棄將變數視為數學方程式未知數的迷思。透過理解 State Tracking Pattern，我們學會在時序軸上精確追蹤狀態的變化，並避免變數語意過載（Semantic Overloading）所帶來的維護隱患。掌握此一基礎，能有效提升程式碼的可讀性與穩定度。

## TypeScript Tip

善用 const 宣告常數，能有效降低心智負擔並防止非預期的變數重新賦值。

```typescript
function computeArea(width: number, height: number): number {
  const area = width * height;
  if (area !== 50) throw new Error("assertion failed");
  return area;
}
computeArea(5, 10);
```

## Python Tip

利用 Python 的型別提示（Type Hints）與明確的變數命名來強化程式碼的語意表達。

```python
def compute_area(width: int, height: int) -> int:
    area = width * height
    assert area == 50, "assertion failed"
    return area

compute_area(5, 10)
```

## Takeaway

變數是記憶體的具名參照而非數學未知數，精準追蹤狀態是編寫正確演算法的基石。

## Tomorrow Preview

明天我們將探討迴圈與條件判斷中的狀態轉移機制，進一步延伸 State Tracking Pattern 在更複雜控制流程中的應用。

## Today's Challenge

本篇為觀念課，沒有對應的 LeetCode 練習題。請把時間花在把上面的觀念想透。
