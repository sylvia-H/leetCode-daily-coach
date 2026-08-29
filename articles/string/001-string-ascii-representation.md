---
id: string-ascii-representation
title: String ASCII and Character Codes
module: string
pattern_label: Character Mapping
complexity_label: O(1) / O(1)
estimated_minutes: 10
exit_criteria:
  - 能在 Python 與 TypeScript 中將字元轉為整數編碼並反向轉換。
---
## Concept

電腦裡沒有「字元」這種獨立的東西——每個字元在記憶體中都是一個整數，字串則是一串整數的序列。ASCII 標準把常用字元對應到 0 到 127 的整數：'a' 是 97、'A' 是 65、'0' 是 48；Unicode 是它的超集，前 128 個 code point 與 ASCII 完全相同。真正值得記住的不是這幾個數字，而是編碼表的一個設計：**同類字元的編碼連續遞增**。'a' 到 'z' 佔據 97 到 122 這段連續區間，'0' 到 '9' 佔據 48 到 57。正因為連續，字元可以直接做算術——這是整個 Character Mapping 模式的根基。

## Thinking

為什麼 `c - 'a'` 能算出字母的序號？因為小寫字母編碼連續遞增，減去基準 'a' 等於把整段區間平移到從 0 開始：'a' 得 0、'b' 得 1、……、'z' 得 25。這個映射是雙射——不同字母必得不同索引、同字母恆得同索引——所以可以放心把結果當成大小 26 陣列的索引，用 O(1) 的一次加法完成頻率統計。同樣的推理套到數字上：`c - '0'` 把數字字元平移成它實際代表的 0 到 9，逐位以「累積值乘 10 加新位數」組合，就能把字串轉成整數。連範圍判斷也是靠連續性：`'a' <= c && c <= 'z'` 之所以能正確判斷小寫字母，正是因為這段區間中間沒有夾雜其他字元。

## Pattern Recognition

當題目明說「輸入只包含小寫英文字母」這類限定字元集的條件，就是 Character Mapping 的訊號：需要計數、頻率統計或存在性追蹤時，用大小 26（或 128）的固定陣列取代 Hash Map。銜接雜湊表模組的觀念來看，這個陣列就是一張「雜湊函數為 `c - 'a'`、保證零碰撞」的完美雜湊表——省掉了雜湊計算與碰撞處理，常數成本更低。反之，若字元集沒有限定（可能出現 Unicode 任意字元），固定陣列的前提不成立，就該退回 Hash Map。

## Common Mistakes

第一個坑是大小寫：'A' 的編碼是 65，比 'a' 的 97 小，把大寫字母套進 `c - 'a'` 會得到負數索引，存取陣列時越界或拿到錯誤位置——處理前必須先統一大小寫，或依範圍分流。第二是沒驗證字元範圍就當索引用：混入空白、符號時同樣越界。第三是語言差異：JavaScript／TypeScript 沒有字元型別，`s[i]` 取出的仍是長度 1 的字串，直接相減拿不到數值，必須先 `charCodeAt()`；且它回傳的是 UTF-16 code unit，超出基本平面的字元（如 emoji）會拆成兩個 code unit，需要 `codePointAt()` 才拿得到完整值。Python 的 `ord()` 則只接受長度為 1 的字串，傳入多字元會擲出 TypeError。

## Complexity

時間複雜度：單一字元的編碼轉換與偏移計算為 O(1)；空間複雜度：固定大小的頻率陣列（如 26 格）不隨輸入成長，為 O(1)。

## Digest

字元在底層就是整數，且同類字元的編碼連續遞增——'a' 到 'z' 是 97 到 122、'0' 到 '9' 是 48 到 57。連續性讓 `c - 'a'` 成為字母到 0–25 的雙射，可直接當固定陣列的索引，等於一張零碰撞的完美雜湊表；`c - '0'` 同理把數字字元還原成數值。轉換入口：TypeScript 用 `charCodeAt()` 與 `String.fromCharCode()`，Python 用 `ord()` 與 `chr()`。留意大寫字母編碼較小、直接減 'a' 會得負索引，使用固定陣列前務必確認題目已限定字元集。

## TypeScript Tip

`charCodeAt(0)` 把字元轉成 UTF-16 編碼整數，`String.fromCharCode()` 反向轉回。記住 `s[i]` 取出的是字串不是數字，做算術前必須先轉編碼。

```typescript
const BASE = "a".charCodeAt(0);

function letterIndex(ch: string): number {
  const idx = ch.charCodeAt(0) - BASE;
  if (idx < 0 || idx > 25) throw new Error("not a lowercase letter");
  return idx;
}

if (letterIndex("c") !== 2) throw new Error("assertion failed: index");
if (String.fromCharCode(BASE + 25) !== "z") throw new Error("assertion failed: reverse");
```

## Python Tip

Python 沒有字元型別，`ord()` 接受長度為 1 的字串並回傳整數編碼，`chr()` 反向轉回，兩者互為反函數。

```python
def letter_index(ch: str) -> int:
    idx = ord(ch) - ord("a")
    assert 0 <= idx <= 25, "not a lowercase letter"
    return idx

assert letter_index("c") == 2, "assertion failed: index"
assert chr(ord("a") + 25) == "z", "assertion failed: reverse"
assert ord("7") - ord("0") == 7, "assertion failed: digit value"
```

## Takeaway

字元即整數，且同類字元編碼連續——`c - 'a'` 把字母映成 0 到 25 的陣列索引，字串問題就變成陣列運算。

## Tomorrow Preview

明天進入 String Linear Scan：用單一迴圈逐字元走訪字串，一邊累積狀態一邊萃取答案。今天學會的字元對映，正是明天頻率統計時決定「該加在哪一格」的工具。

## Today's Challenge

- **387** · 題目限定小寫字母，正是用大小 26 陣列取代 Hash Map 的典型場景：`c - 'a'` 直接定位頻率格子，統計與查詢都是 O(1)。
  - Hint: 先掃一趟把各字母出現次數累加進 26 格陣列，再掃第二趟找出第一個次數為 1 的位置。
- **8** · 把字串解析成整數的核心正是字元算術：逐位驗證字元落在 '0' 到 '9' 區間，再用減 '0' 取出數值並累積。
  - Hint: 以「累積值乘 10 加上 c - '0'」逐位組合，並先處理前導空白、正負號與溢位邊界。
