---
id: backtracking-palindrome-partitioning
title: Backtracking Palindrome Partitioning
module: backtracking
pattern_label: String Partitioning Pattern
complexity_label: O(n * 2^n) / O(n)
estimated_minutes: 20
exit_criteria:
  - 能在遞迴過程中於不同切點切出子字串。
  - 能把回文驗證整合為剪枝條件。
---
## Concept

Backtracking Palindrome Partitioning 是一種經典的字串分割演算法設計模式。當問題要求將一個字串進行分割，使得分割出來的每一個子字串都符合特定的條件（例如迴文），我們通常需要遍歷字串中的每一個可能切割點。在此模式中，遞迴函式會在每個起始位置上嘗試所有可能的字首長度。如果當前的字首符合條件，我們便將其加入當前的路徑中，並將剩餘的字串交由遞迴函式繼續處理；當遞迴到達字串結尾時，即代表找到了一組完整的有效分割方案。

## Thinking

思考這類問題時，我們可以採用類似組合與排列的 Backtracking 策略。首先，定義一個遞迴函式，接收目前的起始索引 start 與當前的路徑 path。在函式內部，我們從 start 開始，向右延伸結束索引 end。每次截取出子字串 s.slice(start, end)，接著檢查這個子字串是否為迴文。若該子字串不是迴文，我們可以提前終止（Pruning），避免無謂的遞迴搜尋；若該子字串是迴文，我們將其放入路徑中，並遞迴呼叫 backtrack(end, path)，當遞迴結束後再進行回溯（Backtracking）以移除最後一個元素，藉此窮舉所有的可能組合。

## Pattern Recognition

當題目明確要求「將字串分割（Partition）成多個符合特定條件的子字串，並列出所有可能的分割方式」時，通常就是 String Partitioning Pattern 的應用場景。這類問題的特徵在於：輸出結果為多維陣列（例如字串陣列的陣列），每一個元素代表一種合法的分割配置。我們透過嘗試不同的切點來進行狀態空間搜尋，並利用 Backtracking 來收集所有成功的路徑。

## Common Mistakes

常見的錯誤是在每次檢查子字串是否為迴文時，都重新使用雙指標進行 O(n) 的驗證，雖然在資料規模較小時尚可接受，但未加優化時容易導致重複計算。另一個常見錯誤是忘記在遞迴返回後將剛加入路徑的元素移除（即忘記執行 pop 操作），導致路徑狀態遭到污染，進而產生重複或錯誤的解答結果。

## Complexity

Time Complexity: O(n * 2^n)，其中 n 是字串的長度。在最壞的情況下，一個長度為 n 的字串有 2^(n-1) 種分割方式，而每次分割都需要花費 O(n) 的時間來複製字串或驗證迴文。Space Complexity: O(n)，遞迴呼叫的最大深度為 n，且儲存當前路徑所需的空間與字串長度成正比。

## Digest

今日重點在於掌握 Backtracking Palindrome Partitioning 的核心架構：透過遞迴探索字串的每一個可能切點，並在每一步結合迴文驗證作為剪枝條件。我們學習了如何在 TypeScript 與 Python 中透過索引操作與狀態回溯來窮舉所有合法的分割配置，並理解其時間與空間複雜度的特性。

## TypeScript Tip

```typescript
// 在 TypeScript 中使用 slice 進行子字串提取
function getSubstringDemo(s: string): string {
  const sub = s.slice(0, 1);
  if (sub !== "a") throw new Error("assertion failed");
  return sub;
}
getSubstringDemo("a");
```

## Python Tip

```python
# 在 Python 中使用切片語法取得子字串
def get_substring_demo(s: str) -> str:
    sub = s[0:1]
    assert sub == "a", "assertion failed"
    return sub

get_substring_demo("a")
```

## Takeaway

掌握 Backtracking Palindrome Partitioning 的切點窮舉與迴文剪枝，是解決字串分割問題的關鍵。

## Tomorrow Preview

明天我們將探討另一種經典的字串分割與動態規劃優化策略，學習如何透過預先計算迴文狀態來加速 Backtracking 的執行效率，並延伸應用於求取最小分割次數的相關題型。

## Today's Challenge

- **131** · 此題要求找出字串的所有可能分割方案，且每個子字串皆須為迴文，完全符合 String Partitioning Pattern 與 Backtracking 的核心應用場景。
  - Hint: 從起始位置向右延伸檢查每個前綴，若為迴文則遞迴處理剩餘字串。
