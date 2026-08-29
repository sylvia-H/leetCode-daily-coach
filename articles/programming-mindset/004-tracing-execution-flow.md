---
id: tracing-execution-flow
title: Tracing Execution Flow
module: programming-mindset
pattern_label: Step-by-Step Simulation
complexity_label: O(n) / O(1)
estimated_minutes: 15
exit_criteria:
  - 能利用表格追蹤含有迴圈與條件判斷的小段程式碼
---
## Concept

Tracing Execution Flow 是一種手動模擬程式碼執行過程的技巧。透過建立變數追蹤表（Variable Tracking Table），開發者能夠在不依賴電腦的情況下，精確掌握每個變數在不同迴圈迭代或條件判斷下的狀態變化。這種腦內編譯器（Mental Compiler）的能力，是提升邏輯嚴謹度與快速定位盲點的核心基石。

## Thinking

當面對複雜的控制流或非預期的輸出結果時，不應依賴直覺去猜測錯誤所在。標準的思考流程為：首先，初始化所有輸入參數與區域變數；接著，進入逐行（Step-by-Step）追蹤模式，針對每一次迴圈（Loop）或條件分支（Conditional Branch），記錄變數的當前快照（Snapshot）；最後，比對終止條件與預期輸出，找出邏輯發散的根源。

## Pattern Recognition

當程式碼結果不如預期，且不知錯在何處時，即為啟動 Tracing Execution Flow 的最佳時機。特別是在處理含有巢狀迴圈（Nested Loops）、多重條件判斷、指標（Pointer）移動或遞迴（Recursion）的場景時，視覺化變數狀態是理清複雜度最直接的手段。

## Common Mistakes

最常見的錯誤包含『跳著讀程式碼』或『憑直覺猜測錯誤原因』。許多開發者在遇到 Bug 時，僅憑肉眼粗略掃過程式碼便逕自修改，忽略了邊界條件（Edge Cases）下變數實際儲存的值，導致耗費大量時間進行白費的嘗試。

## Complexity

時間複雜度 O(n) 代表隨著程式執行步驟線性增加所需的追蹤成本；空間複雜度 O(1) 代表在手動追蹤過程中，僅需常數大小的表格來記錄當前狀態。

## Digest

本單元聚焦於 Tracing Execution Flow。我們探討了如何透過建立變數追蹤表與逐行模擬，取代憑直覺猜測的除錯方式。掌握這項技能不僅能提升程式碼的正確性，更能強化對於複雜控制流的掌控能力。

## TypeScript Tip

```typescript
function debugTrace(a: number, b: number): number {
  const result = a + b;
  if (result !== 5) throw new Error("assertion failed");
  return result;
}
debugTrace(2, 3);
```

## Python Tip

```python
def debug_trace(a: int, b: int) -> int:
    result = a + b
    assert result == 5, "assertion failed"
    return result

debug_trace(2, 3)
```

## Takeaway

腦內編譯器與手動 Trace 是最強大的除錯工具，切勿憑直覺猜測錯誤原因。

## Tomorrow Preview

明天我們將探討如何將手動追蹤的邏輯具象化，延伸至演算法設計中常見的狀態機（State Machine）概念，進一步提升程式碼的可讀性與正確性。

## Today's Challenge

本篇為觀念課，沒有對應的 LeetCode 練習題。請把時間花在把上面的觀念想透。
