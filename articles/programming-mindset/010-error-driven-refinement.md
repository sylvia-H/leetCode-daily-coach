---
id: error-driven-refinement
title: Error-Driven Refinement
module: programming-mindset
pattern_label: Iterative Debugging
complexity_label: O(1) / O(1)
estimated_minutes: 15
exit_criteria:
  - 能從錯誤訊息或失敗測資中精準定位問題根源並修正
---
## Concept

Error-Driven Refinement 是把編譯錯誤、執行期例外與 Wrong Answer 當成精準訊號的偵錯方法：每一個錯誤都代表「你腦中的模型」與「程式的實際行為」在某處出現落差。它之所以可靠，是因為程式的行為完全確定——同樣的輸入必然產生同樣的結果，錯誤不是隨機的壞運氣，而是可以回溯的證據；每一筆失敗測資都是一個具體反例，指出你的假設在哪個輸入上破功。整套流程可以歸納為五步：分類錯誤、定位根因、縮小重現、提出假設、單一修改後驗證。

## Thinking

第一步先分類，因為不同類別的錯誤指向不同層面的根因：編譯或型別錯誤代表程式還沒開始跑，問題出在結構與型別的矛盾；Runtime Error 代表某個具體輸入觸發了非法操作（索引越界、除以零、存取空值）；Wrong Answer 代表語法與執行都正常，但邏輯與題意不符；Time Limit Exceeded 則多半是複雜度不足——回到上一課的時空取捨去換方法，而不是修小地方。

第二步定位。要記住：報錯的位置是引爆點，不一定是根因。型別矛盾或非法值往往在更早的賦值、更上游的函式就已產生，要沿著資料來源與呼叫鏈往回追。

第三步縮小重現：把失敗測資逐步刪減成「仍然會失敗的最小版本」。刪掉某段輸入後仍失敗，代表根因與那段無關；留到最後的最小輸入，通常直接點名出錯的邏輯。

最後是假設與驗證：改程式之前先寫下「我認為錯在哪、改完後這筆測資會輸出什麼」，然後一次只改一個地方。預測對了，模型修正完成；預測錯了，代表你對程式的理解還有落差——這個落差本身就是下一條線索。

## Pattern Recognition

啟動時機是任何失敗訊號出現的當下：編譯不過、Runtime Error、Wrong Answer、Time Limit Exceeded。另一個重要的辨識線索是內在的：當你發現自己想「隨便改改看會不會過」時，正是該停下來、把假設白紙黑字寫出來的時候——那個念頭本身就是流程即將失控的警訊。

## Common Mistakes

第一，瞎猜亂改：沒有假設就動手，即使僥倖通過現有測資，錯誤的認知仍在，隱藏測資或下一題同類情境會原樣重演。第二，只修引爆點：在報錯行用強制轉型或特判把訊號壓掉，根因原封不動，錯誤只是換個地方再爆。第三，一次改多處：兩個修改互相干擾，通過了不知道是誰修好的，失敗了不知道是誰弄壞的，甚至兩個錯互相抵銷、造成假象通過。第四，把預期改成實際：實務上寫測試時，若把失敗測試的期望值改成程式的實際輸出，等於把缺陷合法化，從此還被測試保護起來。

## Complexity

O(1) / O(1)。Error-Driven Refinement 是解題流程而非演算法，不改變程式本身的時間與空間成本；它改變的是你收斂到正確解的速度。

## Digest

錯誤不是壞運氣，而是可回溯的證據：程式行為完全確定，每筆失敗測資都是指出假設破功處的具體反例。流程五步——分類（編譯錯誤、Runtime Error、Wrong Answer、TLE 各指向不同根因）、定位（報錯行是引爆點，根因常在上游）、縮小重現（把測資刪到仍會失敗的最小版本）、提出假設（先預測改完的輸出）、單一修改後驗證。最忌沒有假設的亂改：僥倖通過修的是分數，不是心智模型。

## TypeScript Tip

把型別錯誤當成設計回饋：開著 strict，編譯器會逼你面對「可能沒有結果」的邊界。與其用 `!` 硬壓，不如把它寫進回傳型別，呼叫端就被迫處理——執行期的錯誤被提前成編譯期的提醒。

```typescript
function firstPositive(nums: number[]): number | null {
  for (const n of nums) {
    if (n > 0) return n;
  }
  return null; // 「找不到」是合法結果，型別逼呼叫端面對它
}
if (firstPositive([-3, 0, 7]) !== 7) throw new Error("assertion failed");
if (firstPositive([-1]) !== null) throw new Error("assertion failed");
```

## Python Tip

Traceback 由上而下是呼叫鏈、最後一行是例外型別與訊息。先讀最後一行知道「爆了什麼」，再從最底層的堆疊框往上追「非法資料是從哪一層傳進來的」——下面用 extract_tb 把這條回溯路徑變成可以斷言的資料。

```python
import traceback

def read_score(scores: list[int], i: int) -> int:
    return scores[i]

def report(scores: list[int]) -> int:
    return read_score(scores, len(scores))  # 非法索引在這一層產生

try:
    report([90, 85])
except IndexError as e:
    frames = traceback.extract_tb(e.__traceback__)

assert frames[-1].name == "read_score", "assertion failed"  # 最底層：引爆點
assert frames[-2].name == "report", "assertion failed"  # 往上一層：根因所在
```

## Takeaway

錯誤是可回溯的證據：分類、定位根因、縮小重現、寫下假設、一次只改一個地方。

## Tomorrow Preview

明天進入 array 模組的 Moving Zeroes to End，用快慢指標把零集中到陣列末端、同時保持非零元素的相對順序。這是一題動手題——正好把今天的流程用上：提交、讀失敗測資、修正假設，而不是亂改。

## Today's Challenge

本篇為觀念課，沒有對應的 LeetCode 練習題。建議翻出你最近一次 Wrong Answer 的紀錄，用今天的五步流程重新走一遍，看看當時的修法是「驗證假設」還是「碰運氣」。
