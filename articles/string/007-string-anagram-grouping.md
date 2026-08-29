---
id: string-anagram-grouping
title: String Anagram Grouping and Hashing
module: string
pattern_label: Hash Map
complexity_label: O(n * k log k) / O(n * k)
estimated_minutes: 15
exit_criteria:
  - 能使用排序後的字串或字元計數作為 hash map 的 key 來分組 anagram。
---
## Concept

變位詞（Anagram）分組要解決的問題是：把字元組成完全相同、只有順序不同的字串歸進同一組。兩個字串互為 anagram 的精確定義是「字元多重集相同」——每個字元在雙方出現的次數完全一致。先修的 hash-table 課已建立核心原則：替每個元素設計一把正規化鍵（Canonical Key），只要滿足「同組必同鍵、異組必異鍵」，雜湊表就會自動把等價元素收進同一個桶。本課把這個原則落到字串上，比較兩種簽章設計——排序簽章與頻率簽章——並論證它們為何都正確：字元多重集相同、排序後字串相同、26 格頻率向量相同，三者是同一件事的三種表述，因此兩種簽章既不會漏分、也不會誤併。

## Thinking

以 eat、tea、tan、ate、nat、bat 為例。排序簽章：eat、tea、ate 排序後都是 aet，天然落進同一桶，單一字串成本 O(k log k)。頻率簽章：掃一次字串統計 26 個字母的出現次數，eat 與 tea 都得到「a、e、t 各一」的向量，成本 O(k)。取捨看 k：字串短時排序寫法簡潔、常數小；字串很長時 log k 的差距開始有感，頻率簽章勝出。但頻率簽章多一道工序——它是一個陣列，多數語言不能直接當鍵，必須先序列化成不可變的形式：Python 轉 tuple，JavaScript 用分隔符 join 成字串。分隔符不是可有可無：計數向量 [1, 11] 與 [11, 1] 不加分隔直接串接都會得到 "111"，兩把不同的鍵就撞在一起，分組從此錯亂。序列化後「鍵相等」必須與「向量相等」一一對應，這是頻率簽章正確性的最後一塊拼圖。

## Pattern Recognition

訊號：題目要求把多個字串「分組、分類」，且等價標準與字元順序無關——group anagrams、categorize by character composition 都是這類字眼。動手前確認兩件事：一、等價關係能被一個確定性的正規化函數刻劃（同組必同鍵、異組必異鍵）；二、鍵是不可變、能以內容比較相等的型別。若只需判斷兩個字串是否互為 anagram，一組頻率統計直接比對即可，不必動用分組結構；若等價標準與順序有關（例如子字串匹配），正規化鍵就派不上用場，那是後續課程的守備範圍。

## Common Mistakes

1. 拿可變結構直接當鍵：Python 的 list 不可雜湊，當 dict 鍵會直接拋 TypeError，必須轉 tuple；JavaScript 的 Map 對陣列鍵比較的是參考位址，兩個內容相同的計數陣列不會命中同一鍵，必須先 join 成字串。
2. join 不加分隔符：某字元計數超過 9 時就會產生歧義（見 Thinking 的 "111" 例）；短字串測資不會爆，遇到長字串才錯，最難抓。
3. 字元集假設沒對齊：`ord(c) - 97` 只對小寫英文字母成立，輸入含大寫或 Unicode 時會映到負數或超出 26 格的索引；此時改用雜湊表計數，或先做大小寫正規化。
4. 複雜度記帳漏掉簽章成本：n 個字串各排序一次是 O(n * k log k)，不是 O(n)；報成線性等於漏掉主要成本。

## Complexity

時間複雜度：排序簽章 O(n * k log k)，n 為字串數、k 為最長字串長度，成本集中在逐字串排序；頻率簽章降為 O(n * k)，每字串線性掃描一次，加上常數 26 格的序列化。空間複雜度 O(n * k)：雜湊表要保存全部原始字串與各組的鍵，最壞情況（沒有任何兩串同組）鍵的數量與字串數同階。

## Digest

Anagram 分組沿用 Canonical Key 原則：設計滿足「同組必同鍵、異組必異鍵」的簽章，讓雜湊表自動分桶。兩種簽章都刻劃「字元多重集相同」：排序簽章把 eat、tea、ate 都映到 aet，單字串成本 O(k log k)；頻率簽章統計 26 格計數向量，成本 O(k)，但必須序列化成不可變鍵——Python 轉 tuple、JavaScript 加分隔符 join，否則 [1, 11] 與 [11, 1] 串接同為 "111"，不同的鍵會相撞。整體 O(n * k log k) 或 O(n * k) 時間、O(n * k) 空間。

## TypeScript Tip

Map 對陣列鍵比的是參考位址，頻率向量必須 join 成字串；分隔符擋掉 [1, 11] 與 [11, 1] 的歧義。`noUncheckedIndexedAccess` 下索引寫入用 `?? 0` 收斂：

```typescript
import assert from "node:assert";
function groupAnagrams(strs: string[]): string[][] {
  const map = new Map<string, string[]>();
  for (const s of strs) {
    const count = new Array<number>(26).fill(0);
    for (const c of s) {
      const i = c.charCodeAt(0) - 97;
      count[i] = (count[i] ?? 0) + 1;
    }
    const key = count.join("#");
    const bucket = map.get(key);
    if (bucket) bucket.push(s);
    else map.set(key, [s]);
  }
  return [...map.values()];
}
assert.strictEqual(groupAnagrams(["eat", "tea", "tan", "ate"]).length, 2);
assert.strictEqual(groupAnagrams(["a" + "b".repeat(11), "a".repeat(11) + "b"]).length, 2);
```

## Python Tip

list 可變、不可雜湊，頻率向量要轉 tuple 才能當 dict 鍵；tuple 不可變且逐元素比內容，互為 anagram 的字串必得同一鍵：

```python
from collections import defaultdict

def group_anagrams(strs: list[str]) -> list[list[str]]:
    groups: defaultdict[tuple[int, ...], list[str]] = defaultdict(list)
    for s in strs:
        count = [0] * 26
        for c in s:
            count[ord(c) - 97] += 1
        groups[tuple(count)].append(s)
    return list(groups.values())

assert len(group_anagrams(["eat", "tea", "tan", "ate"])) == 2
assert group_anagrams([]) == []
```

## Takeaway

排序簽章與頻率簽章都刻劃「字元多重集相同」；把簽章化為不可變鍵，雜湊表就把互為 anagram 的字串自動收進同一桶。

## Tomorrow Preview

明天進入 Center Expansion for Palindromes：每個迴文都有中心，從 2n - 1 個候選中心向外擴展，在 O(n^2) 時間、O(1) 空間內找出最長迴文子字串。

## Today's Challenge

- **49** · 分組標準「互為 anagram」恰等價於「字元多重集相同」，排序或頻率簽章都能精準刻劃，是 Canonical Key 分組的原型題。
  - Hint: 把每個字串排序後的結果（或 26 格計數的序列化）當雜湊表的鍵，原字串附加進對應串列。
