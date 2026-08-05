---
id: edge-case-enumeration
title: Edge Case Enumeration
module: programming-mindset
pattern_label: Defensive Design
complexity_label: O(1) / O(1)
estimated_minutes: 15
exit_criteria:
  - 能條列出空值、極大值、重複值與單一元素等邊界測資
---
## Concept

Edge Case Enumeration 是一種在編寫完主要演算法邏輯後，主動系統性地列舉並測試極端輸入、異常狀態及邊界條件的防禦性設計思維。軟體工程中的絕大多數臭蟲（Bug）與例外崩潰，往往都藏在正常邏輯之外的邊界角落，例如空集合、零值、負數、極大值、溢位或型別不匹配等情況。透過套用 Defensive Design（防禦性設計），開發者能在程式碼交付生產環境前，預先封鎖這些潛在風險。

## Thinking

當我們完成主邏輯（Happy Path）的編寫後，思維必須立刻從『如何達成功能』轉變為『這段程式碼在什麼情況下會崩潰』。此時必須系統性地思考下列幾種常見的極端輸入情境：第一，空值或無效輸入（如 null、undefined、空陣列、空字串）；第二，數量極端（如單一元素、零個元素、超大陣列）；第三，數值極端（如正負極大值、零、小數）；第四，重複或完全相同的元素。透過這套思考框架，能夠全面檢視程式碼的強健性，避免因漏掉邊界條件而導致執行期例外或邏輯錯誤。

## Pattern Recognition

當你在解題或實作時，若發現程式碼在通過基本的 Happy Path 測試後，面對特殊測資卻產生越界存取（Index Out of Bounds）、型別錯誤（TypeError）或無窮迴圈等異常，這就是缺乏 Edge Case Enumeration 的強烈信號。在寫完主邏輯準備提交前，務必主動啟動 Pattern 辨識，逐一檢查程式碼是否對所有可能的邊界條件進行了防禦性處理。

## Common Mistakes

最常見的錯誤是開發者往往只驗證了 Happy Path（即預期中的正常測資），而完全忽略了空值、極大值或單一元素的邊界測試。另一個常見誤區是過度自信，認為輸入資料總是符合規格，因而省略了型別檢查與防禦性分支，導致在接收到非預期型別或結構的資料時，程式直接崩潰並拋出無法預期的執行期例外。

## Complexity

O(1) / O(1)

## Digest

Edge Case Enumeration 是 Defensive Design 的核心實踐。Bug 總是在邊界角落發生，我們必須主動列舉空值、極大值與極端數量。

## TypeScript Tip

```typescript
function safeGetFirst(items: string[] | null): string {
  return items?.[0] ?? "default";
}
if (safeGetFirst(null) !== "default") throw new Error("assertion failed");
```

## Python Tip

```python
def safe_get_first(items: list[str] | None) -> str:
    if not items:
        return "default"
    return items[0]
assert safe_get_first(None) == "default", "assertion failed"
```

## TypeScript Corner

```typescript
function processInput(nums: number[] | null): number {
  const safeNums = nums ?? [];
  if (safeNums.length === 0) return 0;
  const result = safeNums[0];
  if (result !== 10) throw new Error("assertion failed");
  return result;
}
const testVal = processInput([10]);
if (testVal !== 10) throw new Error("assertion failed");
```

## Python Corner

```python
def process_input(nums: list[int] | None) -> int:
    safe_nums = nums if nums is not None else []
    if not safe_nums:
        return 0
    result = safe_nums[0]
    assert result == 10, "assertion failed"
    return result

test_val = process_input([10])
assert test_val == 10, "assertion failed"
```

## Takeaway

防禦性設計始於主動列舉邊界條件，永遠不要假設輸入資料完美無缺。

## Tomorrow Preview

明天我們將探討如何利用 Two Pointers 技巧來處理陣列與字串的區段掃描問題，學習雙指標在時間與空間複雜度上的優化價值。

## Today's Challenge

本篇為觀念課，沒有對應的 LeetCode 練習題。請把時間花在把上面的觀念想透。
