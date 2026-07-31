---
id: string-parsing-simulation
title: String Parsing and State Simulation
module: string
pattern_label: Simulation
complexity_label: O(n) / O(n)
estimated_minutes: 20
exit_criteria:
  - >-
    Can parse structured string formats like run-length encodings or basic
    calculators.
---
## Concept

String Parsing and State Simulation 指的是依序走訪字串中的每個字元或 Token，並透過狀態旗標、指針或是 Stack 來追蹤目前的解析狀態，進而完成字串的轉換、計算或格式化。這類問題的核心在於將非結構化或半結構化的字串轉換為具備邏輯意義的結構，例如數值運算、標記語言或是語法樹的解析。

## Thinking

在處理字串解析與狀態模擬時，首要任務是定義明確的狀態機（State Machine）或轉換規則。面對複雜的字串輸入，不宜直接撰寫巢狀的條件判斷，而應先梳理可能出現的邊界條件，例如前導空白、正負號、溢位（Overflow）以及非預期的特殊字元。接著，決定是否需要輔助資料結構（如 Stack 來處理括號或巢狀結構），或者僅需常數級別的指針與變數來記錄當前狀態。在走訪過程中，嚴格檢查每一個字元對狀態轉移的影響，並在迴圈結束後處理最後一個狀態的收尾工作。

## Pattern Recognition

當題目要求將字串轉換為特定格式、解析算術運算式、尋找特定前綴、反轉單字順序，或是驗證字串是否符合某種語法規則時，通常適用 Simulation Pattern。辨識線索包括：輸入為 String、需要逐字元處理（Character-by-character processing）、維護多個狀態變數（如 sign, base, index），或是牽涉到括號匹配與巢狀層級的處理。

## Common Mistakes

常見錯誤包括未妥善處理空字串或僅包含空白的字串、忽略數值運算時的整數溢位邊界、在迴圈終止條件或指針遞增時發生 Index Out of Bounds 異常，以及未考慮連續符號（如 "+-12"）帶來的狀態混亂。此外，過度依賴昂貴的正則表達式而非手動狀態模擬，有時會導致效能低落或在極端測資下逾時。

## Complexity

Time Complexity: O(n)，其中 n 為字串長度，因為通常需要線性掃描字串一次或常數次。
Space Complexity: O(n) 或 O(1)，取決於是否需要使用 Stack 或額外的集合來儲存中間結果或 Token。

## Digest

String Parsing and State Simulation 核心在於有條理地追蹤字串處理過程中的各種狀態。我們學習了如何透過指針、狀態變數與 Stack 來安全地轉換、計算及解析字串，並特別注意邊界條件如溢位、空白與符號。掌握此 Pattern 能有效應對各類字串處理與格式化考題。

## TypeScript Tip

```typescript
function processTokens(s: string): string[] {
  const tokens = s.trim().split(/\s+/);
  if (tokens.length !== 2) throw new Error("assertion failed");
  return tokens;
}
processTokens("hello world");
```

## Python Tip

```python
def process_tokens(s: str) -> list[str]:
    tokens = s.strip().split()
    assert len(tokens) == 2, "assertion failed"
    return tokens

process_tokens("hello world")
```

## TypeScript Corner

```typescript
function parseStringState(s: string): number {
  const trimmed = s.trim();
  if (trimmed.length === 0) return 0;
  
  let sign = 1;
  let i = 0;
  let result = 0;
  
  if (trimmed[0] === '-' || trimmed[0] === '+') {
    sign = trimmed[0] === '-' ? -1 : 1;
    i++;
  }
  
  while (i < trimmed.length && trimmed[i] >= '0' && trimmed[i] <= '9') {
    const digit = Number(trimmed[i]);
    result = result * 10 + digit;
    i++;
  }
  
  const finalResult = result * sign;
  if (finalResult !== 42) throw new Error("assertion failed");
  return finalResult;
}

parseStringState("  42");
```

## Python Corner

```python
def parse_string_state(s: str) -> int:
    trimmed = s.strip()
    if not trimmed:
        return 0
    
    sign = 1
    i = 0
    result = 0
    
    if trimmed[0] in ('-', '+'):
        sign = -1 if trimmed[0] == '-' else 1
        i += 1
        
    while i < len(trimmed) and '0' <= trimmed[i] <= '9':
        digit = int(trimmed[i])
        result = result * 10 + digit
        i += 1
        
    final_result = result * sign
    assert final_result == 42, "assertion failed"
    return final_result

parse_string_state("  42")
```

## Takeaway

字串解析的關鍵在於狀態定義與邊界防守。透過嚴謹的指針控制與狀態轉移，能將複雜的文字轉換化為清晰的邏輯執行。

## Tomorrow Preview

明天我們將深入探討 Sliding Window 與 Two Pointers 的進階結合，學習如何在動態區間內維護複雜的子字串條件，敬請期待！

## Today's Challenge

- **8** · 需要依序處理前導空白、正負號以及數值字元的累積，並隨時檢查數值溢位，是經典的 State Simulation 題型。
  - Hint: 使用變數記錄目前的 sign、result 與狀態階段（如尋找空白、尋找符號、讀取數字）。
- **14** · 透過水平掃描或垂直掃描比對多個字串的前綴，模擬字串匹配的過程。
  - Hint: 可以將第一個字串作為基準，逐個字元與其餘字串進行比對。
- **151** · 需要清理多餘空白、分割單字並將順序反轉，考驗對字串 Tokenization 與狀態調整的掌控能力。
  - Hint: 善用內建的 split 方法去除多餘空白後再進行陣列反轉與組合。
