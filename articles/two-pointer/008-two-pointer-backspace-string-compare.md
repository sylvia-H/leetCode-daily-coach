---
id: two-pointer-backspace-string-compare
title: Backspace String Compare Backward
module: two-pointer
pattern_label: Two Pointers - Backward Simulation
complexity_label: O(n + m) / O(1)
estimated_minutes: 15
exit_criteria:
  - '能夠正確利用計數器追蹤遇到的退格字元 # 數量'
  - 掌握從右向左掃描字串並同步比對兩個字串有效字元的技巧
---
## Concept

在處理包含退格符號（#）的字串比對問題時，若從字串前端開始模擬，我們需要額外使用 Stack 空間來儲存過濾後的有效字元，空間複雜度為 O(n + m)。然而，透過 Two Pointers - Backward Simulation 策略，我們能夠將空間複雜度優化至 O(1)。核心觀念在於：字串的退格操作只會影響其左側的字元。因此，如果我們從字串的尾端（即最右側）開始倒向掃描，每當遇到一個 #，代表接下來向左移動時需要略過一個有效字元。利用兩個計數器分別追蹤兩個字串當前累積待刪除的字元數量，我們就能夠直接定位並比對出最終真正生效的有效字元，完全不需額外建立字串或 Stack 容器。

## Thinking

設定兩個指標 i 與 j 分別指向字串 s 與 t 的最後一個字元索引，並初始化兩個計數器 skipI 與 skipJ 分別用來記錄 s 與 t 當前因 # 累積而需要略過的字元數量。進入迴圈後，我們需要處理兩種略過邏輯：第一種是當前字元本身就是 #，此時對應的 skip 計數器加一，指標向左移動；第二種是當前字元不是 #，但此時 skip 計數器大於 0，這代表這個字元應該被前面的 # 刪除，因此 skip 減一，指標同樣向左移動。當兩個指標都成功停在一個『既不是 # 且 skip 為 0』的有效字元位置時，我們便可以停止內層移動，並開始比對此時 s[i] 與 t[j] 是否相等。若不相等則直接回傳 false。若其中一方提早走完（指標小於 0），則檢查對方的剩餘字元是否能被全部刪除。當雙方指標皆小於 0 時，代表比對完成且完全相同，回傳 true。

## Pattern Recognition

當題目要求比對包含刪除、退格、倒退等動態修改操作的字串，且明確限制記憶體空間為 O(1) 時，這就是強烈的 Two Pointers - Backward Simulation 訊號。傳統的正向模擬會因為刪除動作發生在左側而必須依賴 Stack。但由於退格的影響是從右向左傳遞的，逆向思維能夠讓我們在不實際修改字串、也不額外配置資料結構的前提下，精確計算出每個位置的字元是否會被保留。

## Common Mistakes

最常見的錯誤在於沒有正確處理連續的退格符號。開發者常誤以為遇到一個 # 只需要略過緊鄰的一個字元，卻忽略了連續出現的多個 # 會累積成更大的刪除需求。另一個常見失誤是忽略了當指標小於 0 時的邊界條件防護，導致存取到負數索引引發陣列越界錯誤。此外，在處理 skip 遞減時，必須確保是在『當前字元不是 #』且『skip > 0』的條件下才扣除計數，若順序顛倒或邏輯混淆，將會導致有效字元被錯誤略過或保留。

## Complexity

時間複雜度為 O(n + m)，其中 n 與 m 分別為兩個字串的長度。在最壞的情況下，兩個指標會從頭到尾完整掃描字串各一次。空間複雜度為 O(1)，因為我們僅使用了常數個指標變數與計數器，未動用任何額外的 Stack 空間或產生新的字串複本。

## Digest

本單元聚焦於 Two Pointers - Backward Simulation 策略。透過從字串尾端反向掃描，並利用計數器追蹤退格符號帶來的刪除次數，我們成功在 O(1) 空間與 O(n + m) 時間內完成含有 # 的字串比對，免去了建立 Stack 的開銷。

## TypeScript Tip

```typescript
function getValidCharIndex(str: string, index: number): [number, number] {
  let skip = 0;
  while (index >= 0) {
    if (str[index] === '#') {
      skip++;
      index--;
    } else if (skip > 0) {
      skip--;
      index--;
    } else {
      break;
    }
  }
  return [index, skip];
}
const [idx] = getValidCharIndex("ab##", 3);
if (idx !== -1) throw new Error("assertion failed");
```

## Python Tip

```python
def get_valid_char_index(s: str, index: int) -> tuple[int, int]:
    skip = 0
    while index >= 0:
        if s[index] == '#':
            skip += 1
            index -= 1
        elif skip > 0:
            skip -= 1
            index -= 1
        else:
            break
    return index, skip

assert get_valid_char_index("ab##", 3)[0] == -1, "assertion failed"
```

## TypeScript Corner

```typescript
function backspaceCompare(s: string, t: string): boolean {
  let i = s.length - 1;
  let j = t.length - 1;
  let skipI = 0;
  let skipJ = 0;

  while (i >= 0 || j >= 0) {
    while (i >= 0) {
      if (s[i] === '#') {
        skipI++;
        i--;
      } else if (skipI > 0) {
        skipI--;
        i--;
      } else {
        break;
      }
    }

    while (j >= 0) {
      if (t[j] === '#') {
        skipJ++;
        j--;
      } else if (skipJ > 0) {
        skipJ--;
        j--;
      } else {
        break;
      }
    }

    if (i >= 0 && j >= 0 && s[i] !== t[j]) {
      return false;
    }

    if ((i >= 0) !== (j >= 0)) {
      return false;
    }

    i--;
    j--;
  }

  return true;
}

const result = backspaceCompare("ab#c", "ad#c");
if (result !== true) throw new Error("assertion failed");
```

## Python Corner

```python
def backspaceCompare(s: str, t: str) -> bool:
    i = len(s) - 1
    j = len(t) - 1
    skip_i = 0
    skip_j = 0

    while i >= 0 or j >= 0:
        while i >= 0:
            if s[i] == '#':
                skip_i += 1
                i -= 1
            elif skip_i > 0:
                skip_i -= 1
                i -= 1
            else:
                break

        while j >= 0:
            if t[j] == '#':
                skip_j += 1
                j -= 1
            elif skip_j > 0:
                skip_j -= 1
                j -= 1
            else:
                break

        if i >= 0 and j >= 0 and s[i] != t[j]:
            return False

        if (i >= 0) != (j >= 0):
            return False

        i -= 1
        j -= 1

    return True

assert backspaceCompare("ab#c", "ad#c") == True, "assertion failed"
```

## Takeaway

逆向雙指標模擬退格操作，巧妙利用計數器追蹤刪除狀態，達成 O(1) 空間極致優化。

## Tomorrow Preview

明天我們將探討 Two Pointers 在字串與陣列區間處理中的進階應用，學習如何在維持高效時間複雜度的同時，處理更複雜的條件判斷與狀態轉移。

## Today's Challenge

- **844** · 此題完美對應退格刪除操作，使用反向雙指標模擬可直接達成 O(1) 空間複雜度，是該 Pattern 的發源與代表經典題。
  - Hint: 設定兩個指標從字串最右端開始往前走，利用獨立的計數器記錄遭遇的 # 數量並略過相對應的有效字元。
