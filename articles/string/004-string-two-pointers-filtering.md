---
id: string-two-pointers-filtering
title: String Two Pointers with Preprocessing
module: string
pattern_label: Two Pointers
complexity_label: O(n) / O(1)
estimated_minutes: 15
exit_criteria:
  - 能即時跳過不需要的字元，而不為過濾後的字串配置額外記憶體。
---
## Concept

String Two Pointers with Preprocessing 處理「字串混入無效字元」的對向雙指標問題：迴文驗證時要忽略空白、標點與大小寫。直覺做法是先清洗出只含有效字元的新字串，再套上一課的解法，但這要 O(n) 額外空間。本課把過濾內建到指標移動裡：每輪比較前，先讓 left 向右、right 向左各自跳過無效字元，停在有效字元上才比對。上一課的不變式「區間 [left, right] 之外的字元已全部驗證為對稱相符」在此升級為：**區間 [left, right] 之外的有效字元已全部驗證為對稱相符**。無效字元本來就不屬於待驗證的序列，跳過它不會漏掉任何該比的配對——這就是「即時跳過」與「先清洗再比」等價的原因。

## Thinking

骨架仍是 `while (left < right)`，但每輪多兩個內層迴圈：`while (left < right && 無效(s[left])) left++`，right 對稱地遞減。內層迴圈必須帶 `left < right` 防護——若字串尾端甚至整個字串都是無效字元，指標會一路跳過而交錯越界。雙方都停在有效字元後，統一轉小寫再比較：不相等回傳 false，相等則各向內一步。進階變形是「允許刪除至多一個字元」（此類題通常給乾淨字串）：兩指標對稱前進，遇到第一個不匹配時 right 恰為 n - 1 - left；若刪的是兩者之間的字元，s[left] 與 s[right] 在新字串裡仍互相對應，不匹配依舊存在。所以候選只有刪 s[left] 或刪 s[right] 兩種——分支成子區間 [left + 1, right] 與 [left, right - 1]，各用上一課的嚴格檢查驗一次，任一成立即可。

## Pattern Recognition

訊號有三：一、迴文驗證但字串夾雜空白、標點或大小寫混合——題目出現「忽略」「只考慮英數字元」的敘述是最強線索；二、明確要求 O(1) 空間、不得建立清洗後的副本；三、允許至多一次跳過或刪除的驗證題——遇到不匹配就分支、各驗其一。共通點是主體仍為對向收斂比對，只是比對前多一層「把指標移動到下一個該比的位置」的前置動作。若過濾後的問題本身不是對稱比對（例如統計或聚合），就不該硬套這個 Pattern。

## Common Mistakes

第一，內層跳過迴圈漏掉 `left < right` 防護：全標點的字串會讓指標交錯越界，這是本 Pattern 最經典的 bug。第二，順序寫反：先比較再跳過，等於拿標點參與比對，必然誤判。第三，大小寫沒統一：'A' 與 'a' 直接比較不相等；同時記得數字是有效字元，只轉小寫、不能過濾掉。第四，刪一字的變形在分支後又允許再刪：刪除預算只有一次，子區間必須用嚴格版檢查，否則會把需要刪兩個字元的字串誤判為合法。

## Complexity

主迴圈裡雖有巢狀 while，時間仍是 O(n)：不論外層或內層，每一步都只做「left 右移」或「right 左移」，兩者合計最多移動 n 步，這是典型的攤銷分析——別被巢狀結構騙成 O(n^2)。空間 O(1)：不建立清洗副本，只用兩個索引。刪一字的變形至多多兩趟子區間檢查，各為 O(n)，整體仍是線性。

## Digest

把過濾內建到對向雙指標：每輪比較前，兩個內層迴圈讓 left 與 right 各自跳過無效字元，停在有效字元上再統一轉小寫比對。內層迴圈必守 `left < right`，防止全標點字串讓指標交錯越界。正確性沿用上一課的不變式，只把範圍換成「有效字元」；時間靠攤銷分析仍是 O(n)，空間不建副本維持 O(1)。允許刪一字的變形，遇到第一個不匹配就分支 [left + 1, right] 與 [left, right - 1]，各用嚴格版驗一次。

## TypeScript Tip

把「是否為英數字元」抽成輔助函式，主流程更清楚。`noUncheckedIndexedAccess` 下 `s[i]` 是 `string | undefined`，內層迴圈已保證索引合法，用 `!` 收斂即可。

```typescript
import assert from "node:assert";

const isAlnum = (c: string): boolean => /[a-z0-9]/i.test(c);

function isPalindrome(s: string): boolean {
  let left = 0;
  let right = s.length - 1;
  while (left < right) {
    while (left < right && !isAlnum(s[left]!)) left++;
    while (left < right && !isAlnum(s[right]!)) right--;
    if (s[left]!.toLowerCase() !== s[right]!.toLowerCase()) return false;
    left++;
    right--;
  }
  return true;
}

assert.strictEqual(isPalindrome("A man, a plan, a canal: Panama"), true);
assert.strictEqual(isPalindrome("0P"), false);
assert.strictEqual(isPalindrome(".,!"), true);
```

## Python Tip

Python 內建 `str.isalnum()` 判斷英數字元、`str.lower()` 統一大小寫，內層跳過迴圈一行就能寫完；記得每個內層 while 都帶上 `left < right` 防護。

```python
def is_palindrome(s: str) -> bool:
    left, right = 0, len(s) - 1
    while left < right:
        while left < right and not s[left].isalnum():
            left += 1
        while left < right and not s[right].isalnum():
            right -= 1
        if s[left].lower() != s[right].lower():
            return False
        left += 1
        right -= 1
    return True

assert is_palindrome("No 'x' in Nixon") is True
assert is_palindrome("race a car") is False
assert is_palindrome("!!") is True
```

## Takeaway

比對前先讓指標跳過無效字元，內層迴圈必守 `left < right`；不變式只換成「有效字元」，空間維持 O(1)。

## Tomorrow Preview

明天離開對向收斂，進入固定長度的 Sliding Window：讓一段等寬的視窗沿字串同向滑動，用「進一位、出一位」的增量更新取代整段重算。

## Today's Challenge

- **125** · 字串夾雜標點與大小寫，正是「比對前先跳過無效字元」的原型題。
  - Hint: 兩個內層 while 分別推進 left 與 right 到英數字元，每步都檢查 `left < right`，再轉小寫比較。
- **680** · 允許刪除至多一個字元，示範「遇到不匹配就分支成兩個子區間各自嚴格驗證」。
  - Hint: 首次不匹配時，分別檢查 [left + 1, right] 與 [left, right - 1] 是否為迴文；子檢查不得再刪字。
