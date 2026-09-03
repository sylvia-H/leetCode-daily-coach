---
id: stack-valid-parentheses
title: Stack Valid Parentheses
module: stack
pattern_label: Bracket Matching
complexity_label: O(n) / O(n)
estimated_minutes: 15
exit_criteria:
  - 能用 stack 針對開啟與閉合符號寫出匹配演算法。
  - 能處理未匹配的閉合符號或殘留的開啟符號等邊界情況。
---
## Concept

括號匹配要驗證的是巢狀結構的完整性：每個開括號都要有對應的閉括號，且閉合順序必須由內而外。關鍵觀察是——合法字串中，最晚開啟的括號必須最先閉合。「後開先閉」正是 LIFO 的定義，所以堆疊是這個問題的天然結構：掃描時把每個開括號推入堆疊，堆疊頂端永遠是「目前最內層、下一個該被閉合」的那一個；遇到閉括號時只需和頂端比對即可判定，因為任何合法的閉合都只能結束最內層。

## Thinking

由左至右線性掃描。遇到開括號（`(`、`[`、`{`）就推入堆疊；遇到閉括號時依序檢查兩件事：堆疊是否為空——空代表這是個沒有前導開括號的孤立閉括號，直接判定非法；否則彈出頂端並比對型態，不相符（如 `([)]` 的交錯閉合）同樣非法。掃描結束後還有最後一關：堆疊必須完全清空，殘留的開括號代表它們始終沒等到閉合（如 `((`）。

為什麼這樣做是對的？迴圈不變式：每處理完一個字元，堆疊由底至頂恰好是「已讀前綴中所有尚未閉合的開括號，依開啟順序排列」。三個失敗出口正好對應三種違規——閉括號多於開括號、型態交錯、開括號多於閉括號；三關都通過，就證明每個開括號都被恰好一個型態正確的閉括號以正確順序結算。

## Pattern Recognition

辨識線索：符號「成對出現」、「可巢狀」、「必須以相反順序閉合」。同型場景包括 HTML/XML 標籤配對、編譯器的語法檢查、編輯器的括號高亮。另一個重要的辨識能力是反向的：若題目只有單一型態的括號，堆疊裡永遠是同一種符號，唯一有用的資訊只剩數量，此時堆疊可以退化成一個計數器——維護未匹配的開括號數、途中不得為負、結尾歸零。判斷「何時需要完整堆疊、何時計數就夠」是這個 Pattern 的進階素養。

## Common Mistakes

第一，空堆疊遇閉括號處理錯誤：`())` 走到第二個 `)` 時堆疊已空，Python 直接 `pop()` 會拋 IndexError；若改寫成「堆疊非空才比對」的防禦式寫法（先檢查長度、空就跳過），`)` 與 `())` 反而會被誤判合法——正確作法是空堆疊遇閉括號立即判非法。第二，掃描結束忘記檢查堆疊清空：`((` 走完全程都不會觸發任何比對，缺了結尾檢查就會被誤判合法。第三，只數數量不看型態：`([)]` 開閉數量相等，計數法會放行，但交錯閉合已破壞巢狀順序——這正是多型態括號必須用堆疊的原因。第四，語言層面的細節：TypeScript 的 `pop()` 回傳 `T | undefined`，Python 對空 list 呼叫 `pop()` 會拋出 IndexError，兩者都要先把空堆疊情境擋掉或善用其回傳值。

## Complexity

時間複雜度 O(n)：單次線性掃描，每個字元至多觸發一次 push 或一次 pop 與比對，皆為常數時間。空間複雜度最壞 O(n)：整串都是開括號時，堆疊深度等於字串長度。

## Digest

括號匹配的本質是「後開先閉」，與 LIFO 完全同構：開括號入堆疊，閉括號與頂端比對，頂端永遠是最內層待閉合的符號。三個失敗出口——遇閉括號時堆疊為空（孤立閉括號）、型態不符（交錯閉合）、掃描結束堆疊未清空（殘留開括號）——分別對應三種違規，缺一不可。不變式「堆疊＝尚未閉合的開括號、依開啟順序排列」是正確性的核心。單一型態括號時堆疊可退化為計數器；多型態時型態與順序資訊缺一不可。時間 O(n)、空間最壞 O(n)。

## TypeScript Tip

用「閉→開」對應表分流；`pop()` 在空堆疊回傳 `undefined`，恰好與 `open` 比對失敗，把「孤立閉括號」與「型態不符」合併成同一個判斷。

```typescript
const pairs: Record<string, string> = { ")": "(", "]": "[", "}": "{" };
function isValid(s: string): boolean {
  const st: string[] = [];
  for (const ch of s) {
    const open = pairs[ch];
    if (open === undefined) st.push(ch);
    else if (st.pop() !== open) return false;
  }
  return st.length === 0;
}
if (!isValid("({[]})") || isValid("([)]")) throw new Error("assertion failed");
if (isValid("((") || isValid(")(")) throw new Error("assertion failed");
```

## Python Tip

dict 記「閉→開」；空 list 的 `pop()` 會拋 IndexError，必須靠 `not st` 先短路擋掉孤立閉括號。

```python
def is_valid(s: str) -> bool:
    pairs = {")": "(", "]": "[", "}": "{"}
    st = []
    for ch in s:
        if ch in pairs:
            if not st or st.pop() != pairs[ch]:
                return False
        else:
            st.append(ch)
    return not st

assert is_valid("({[]})") and not is_valid("([)]")
assert not is_valid("((") and not is_valid(")(")
```

## Takeaway

後開先閉即 LIFO：開括號入堆疊、閉括號與頂端比對；三個失敗出口——空堆疊遇閉、型態不符、結尾未清空。

## Tomorrow Preview

明天同一顆堆疊登場，但互動升級：Asteroid Collision 裡新元素與頂端的較量從「型態比對」變成「方向與大小的對決」，一次進場可能連鎖消滅多個元素——碰撞模擬 Pattern。

## Today's Challenge

- **20** · 括號匹配的原型題：三種括號巢狀混合，唯有 LIFO 能記住「下一個該閉合誰」。
  - Hint: 建「閉→開」對應表；遇閉括號就彈出比對，空堆疊與型態不符都直接判非法，結尾檢查堆疊清空。
- **32** · 進階應用：堆疊改存「索引」而非字元，彈出後用索引差結算最長合法區段。
  - Hint: 先推入 -1 當基底；遇 `(` 推入其索引；遇 `)` 先彈出，若堆疊變空就把當前索引推入當新基底，否則用「當前索引減新頂端」更新答案。
- **921** · 單一型態括號的退化案例：不必記型態，兩個計數器就能取代堆疊。
  - Hint: 遇 `(` 未匹配開數加一；遇 `)` 若開數大於零就抵銷，否則未匹配閉數加一；答案是兩數之和。
