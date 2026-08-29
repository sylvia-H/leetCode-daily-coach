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

String Parsing and State Simulation（字串解析與狀態模擬）處理的是「字串本身是一段待解讀的輸入」的題型：把它轉成數值、清洗成規格化的格式，或依語法規則求值。做法仍是線性掃描的骨架——單一迴圈逐字元前進——但每一步做的不再只是計數，而是**狀態轉移**：用狀態變數（現在在讀空白、符號還是數字？）、累積器（目前讀到的數值或片段）與必要時的 Stack（保管巢狀結構的外層 context）共同記住解析進度。正確性依然由迴圈不變式保證：**走到位置 i 時，狀態完整代表已讀過的前 i 個字元的解析結果**；迴圈結束，狀態就是整個字串的答案。

## Thinking

動手前先把「合法輸入長什麼樣」畫成階段。以字串轉整數為例，階段順序固定：跳過前導空白 → 讀至多一個正負號 → 連續數字 → 遇到第一個非數字字元即停止。狀態機就是把每個階段寫成明確的區段，而不是把所有判斷塞進同一座 if 森林——階段化之後，每個邊界（全空白、只有符號、"+-12" 讀完 + 就該停）都有明確的歸屬。數字累積的通式是 `result = result * 10 + digit`；溢位防守必須發生在乘十**之前**——先檢查 result 是否已超過上限除以十（相等時再看新數位），等溢位發生再補救就太遲了，多數語言不會替你擲錯，只會默默給出錯誤的值。第二類問題（單字反轉、共同前綴）先用 tokenization 降維：把字串切成單字或逐位對齊的欄位，再對 token 序列操作。最後留意**收尾**：最後一段數值或 token 沒有「下一個字元」替它觸發送出，迴圈自然結束後必須補處理一次，這是狀態模擬最常漏的一步。

## Pattern Recognition

輸入是字串、輸出是數值、清洗後字串或合法性判定，而且規則帶有**順序性**——先讀到什麼會改變後面字元的意義（符號只在數字前有效、引號內的空白不是分隔符）——就是 Simulation Pattern。訊號還包括：題目用一長串規則定義合法格式、要求處理前導與多餘空白、或牽涉括號與巢狀層級（此時 Stack 負責保存外層做到一半的半成品）。它與單純線性掃描的分界在於狀態的性質：掃描的狀態通常是一兩個計數器，解析的狀態則是「你現在位於語法的哪個位置」。

## Common Mistakes

第一是漏掉退化輸入：空字串、全空白、只有符號沒有數字——狀態機的每個階段都要能接受「這個階段一個字元都沒有」。第二是溢位檢查時機錯誤：乘十之後才檢查，等於沒檢查。第三是收尾遺漏：迴圈結束時累積器裡的最後一段數值或單字沒被送出，測資稍長就現形。第四是過度依賴 Regular Expression：一條龐大的 pattern 也許能過範例，但邊界行為藏在引擎細節裡難以論證；面試時手寫狀態機，反而能逐條指出每個邊界的處理，展示的正是這一課要練的掌控力。

## Complexity

時間複雜度 O(n)：每個字元被讀取常數次；即使先 trim、再 split、最後 join 走了三趟，成本相加仍是線性。空間複雜度 O(n) 或 O(1)：tokenization 的單字列表與 Stack 都可能保存與輸入同量級的內容；純狀態機解析（如字串轉整數）只需常數個狀態變數，可做到 O(1)。

## Digest

字串解析把線性掃描升級成狀態機：逐字元前進，用狀態變數、累積器與 Stack 記住「前綴讀到這裡的解析結果」。以字串轉整數為例：跳空白 → 讀至多一個符號 → 累積數字（result * 10 + digit，乘十前先防溢位）→ 遇非數字即停，所以 "+-12" 讀完 + 遇到 - 就結束、得 0。三個高頻失誤：退化輸入（空字串、全空白、只有符號）沒接住；溢位檢查放在乘十之後；迴圈結束後累積器裡的最後一段沒收尾。tokenization（split 清洗空白）能把單字反轉、共同前綴這類題降維成序列操作。時間 O(n)；空間看是否保存 token 或 Stack，純狀態機可 O(1)。

## TypeScript Tip

三個階段各自成段：跳前導空白、至多讀一個符號、累積數字直到第一個非數字字元。"+-12" 讀完 + 之後遇到 -，不是數字、立即停止，回傳 0。

```typescript
import assert from "node:assert";

function parseIntSim(s: string): number {
  let i = 0;
  while (s[i] === " ") i++;
  let sign = 1;
  if (s[i] === "+" || s[i] === "-") {
    if (s[i] === "-") sign = -1;
    i++;
  }
  let result = 0;
  while (i < s.length) {
    const c = s[i]!;
    if (c < "0" || c > "9") break;
    result = result * 10 + (c.charCodeAt(0) - 48);
    i++;
  }
  return sign * result;
}

assert.strictEqual(parseIntSim("   -42abc"), -42);
assert.strictEqual(parseIntSim("+-12"), 0);
assert.strictEqual(parseIntSim("  "), 0);
```

## Python Tip

run-length 解碼是「累積＋收尾」的縮影：數字逐位累積成 count（多位數靠 `count * 10 + int(c)`），遇到新字母才把上一組送出——所以迴圈結束後，最後一組仍掛在狀態裡，必須補送一次。

```python
def decode_rle(s: str) -> str:
    out: list[str] = []
    ch = ""
    count = 0
    for c in s:
        if c.isdigit():
            count = count * 10 + int(c)
        else:
            out.append(ch * count)
            ch, count = c, 0
    out.append(ch * count)  # 收尾：最後一組還在狀態裡
    return "".join(out)

assert decode_rle("a3b12") == "aaa" + "b" * 12
assert decode_rle("") == ""
```

## Takeaway

逐字元轉移狀態、乘十前防溢位、迴圈結束後收尾累積器——解析的正確性來自狀態與前綴始終同步。

## Tomorrow Preview

string 模組到此收官——從字元編碼、線性掃描、對向雙指標、滑動視窗、雜湊分組、中心擴展一路走到子字串搜尋與狀態模擬，你已經能把多數字串題拆回熟悉的骨架。明天起展開全新的模組，用同樣的節奏繼續推進。

## Today's Challenge

- **8** · 字串轉整數是狀態機解析的原型：空白、符號、數字三個階段順序固定，溢位要在乘十之前攔截。
  - Hint: 用索引逐階段前進；累積前先檢查是否會超出 32 位元上限，會超出就直接夾在邊界值回傳。
- **14** · 共同前綴是逐位驗證的模擬：第 j 位要進入答案，必須每個字串的第 j 位都存在且相同。
  - Hint: 以第一個字串為基準逐位向外比對，任何字串在第 j 位不符或已到結尾，答案就是前 j 位。
- **151** · 單字反轉的難點全在清洗：多餘空白要在 tokenization 階段消化，而不是留到反轉階段補救。
  - Hint: split 不帶參數（或手寫狀態機）切出單字後反轉再 join；想進一步 O(1) 空間就用字元陣列原地做。
