---
id: string-two-pointers-opposite
title: 'String Two Pointers: Opposite Direction'
module: string
pattern_label: Two Pointers
complexity_label: O(n) / O(1)
estimated_minutes: 15
exit_criteria:
  - Can implement palindrome checks efficiently using two pointers.
---
## Concept

String Two Pointers: Opposite Direction（字串對向雙指標）把陣列課學過的對向雙指標搬到字串上：左指標 left 從索引 0 出發、右指標 right 從索引 n - 1 出發，每輪處理兩端字元後同步向內一步，直到相遇或交錯。它能一趟解決迴文檢查與反轉這類對稱問題，靠的是一條迴圈不變式：**區間 [left, right] 之外的字元已全部驗證（或處理）為對稱相符**。每輪只要確認 s[left] 與 s[right] 這一對，不變式就向內推進一層；當指標相遇或交錯時，不變式涵蓋整個字串，結論立即成立。全程不建立暫存字串，額外空間維持常數。

## Thinking

實作骨架：`left = 0`、`right = n - 1`，主迴圈 `while (left < right)`。以迴文檢查為例，每輪比較 s[left] 與 s[right]：不相等立即回傳 false——對稱的定義就是這兩個位置必須成對；相等則 `left++`、`right--`，把「已驗證」的範圍向內擴一層。終止條件為什麼用 `<` 而不是 `<=`？因為 left == right 時兩指標指向同一個中央字元，任何字元與自己必然相符，比了也不改變結果，所以相遇即可停。反轉字串則把「比較」換成「交換」：暫存 s[left]、把 s[right] 搬到左邊、再把暫存值放到右邊，指標同樣向內推進；相遇那格自己換自己沒有意義，同一條 `left < right` 依然成立。進度論證也很直接：每輪兩指標各前進一步，區間長度每輪縮小 2，至多 n / 2 輪必然結束，不會有無窮迴圈。

## Pattern Recognition

看到這些訊號時，優先考慮字串對向雙指標：一、對稱性——迴文檢查、字串或區段反轉，左右位置天然成對；二、要求原地處理或 O(1) 空間，不允許建立反轉副本；三、答案能由兩端向內逐對決定。單字順序反轉這類題同樣適用：先把字串切成單字序列，再對序列做對向交換——「元素」從字元升級為單字，骨架完全不變。反之，若處理方向是單向前進累積狀態（上一課的 Linear Scan），或區間需要同向伸縮，就不屬於這個 Pattern 的守備範圍。

## Common Mistakes

第一個常見錯誤是終止條件寫錯：`left <= right` 通常只是多比一次無害，真正危險的是寫成 `left != right`——偶數長度字串的兩指標會直接交錯而過、永不相等，形成無窮迴圈或索引越界。第二是忘記字串不可變：TypeScript 與 Python 的字串都不能對索引位置賦值，原地反轉前必須先轉成字元陣列（或如單字反轉先 split 成序列），處理完再 join 回字串。第三是初始位置差一：右指標起點是 n - 1 而非 n，寫錯一步，第一輪就會在 TypeScript 讀到 undefined、在 Python 觸發 IndexError。

## Complexity

時間複雜度 O(n)：每輪迭代兩指標各向內一步，合計移動不超過 n 步，每步只做常數量的比較或交換。空間複雜度 O(1)：只需兩個索引與一個交換用的暫存變數。但要誠實記帳：若語言的字串不可變而必須先轉成字元陣列，那次轉換本身佔 O(n) 空間——純比較類的迴文檢查不用轉，能真正做到常數空間。

## Digest

字串對向雙指標讓 left 與 right 從兩端向中間夾擠，每輪驗證或交換一對對稱位置。正確性靠迴圈不變式「區間 [left, right] 之外的字元已全部對稱相符」，每輪向內推進一層，指標相遇即涵蓋全字串。終止條件用 `while (left < right)`：中央字元與自己必然相符，不需要比。每輪區間縮小 2，保證 O(n) 時間；純比較的迴文檢查只用兩個索引，額外空間 O(1)，但反轉類因字串不可變得先轉成字元陣列或單字序列，那筆 O(n) 空間要誠實記帳。迴文檢查、字串反轉、單字順序反轉都是它的主場。

## TypeScript Tip

TypeScript 字串不可變，純比較的迴文檢查直接用索引讀即可。開啟 `noUncheckedIndexedAccess` 後 `s[left]` 的型別是 `string | undefined`：兩端互比不受影響，但若要對字元呼叫方法，記得用 `!` 收斂。

```typescript
import assert from "node:assert";

function isPalindrome(s: string): boolean {
  let left = 0;
  let right = s.length - 1;
  while (left < right) {
    if (s[left] !== s[right]) return false;
    left++;
    right--;
  }
  return true;
}

assert.strictEqual(isPalindrome("racecar"), true);
assert.strictEqual(isPalindrome("level"), true);
assert.strictEqual(isPalindrome("ab"), false);
```

## Python Tip

Python 的多重指派讓初始化一行完成；`s.split()` 不帶參數會自動吞掉連續空白與首尾空白，正好完成單字反轉需要的清洗，之後對序列做對向交換即可。

```python
def reverse_words(s: str) -> str:
    words = s.split()
    left, right = 0, len(words) - 1
    while left < right:
        words[left], words[right] = words[right], words[left]
        left += 1
        right -= 1
    return " ".join(words)

assert reverse_words("  the sky  is blue ") == "blue is sky the"
assert reverse_words("hello") == "hello"
```

## Takeaway

左右指標從兩端向內夾擠，每輪驗證一對對稱位置；`while (left < right)` 相遇即停，O(n) 時間、O(1) 空間。

## Tomorrow Preview

明天進入這個 Pattern 的第一個變形：當字串混入空白與標點時，如何讓雙指標在移動中即時跳過無效字元、不另建過濾後的副本——同一條不變式，多一層邊界防護。

## Today's Challenge

- **125** · 驗證迴文是對向雙指標的原型：左右指標向內逐對比較對稱位置的字元。
  - Hint: 先寫出乾淨字串版的 `while (left < right)` 逐對比較；本題還要忽略非英數字元並統一轉小寫再比。
- **151** · 單字順序反轉把「對向交換」的元素從字元升級為單字，骨架不變。
  - Hint: 先 split 出單字序列，再用左右指標對向交換整個序列，最後 join 回字串。
