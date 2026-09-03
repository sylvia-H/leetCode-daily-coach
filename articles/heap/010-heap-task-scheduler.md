---
id: heap-task-scheduler
title: Task Scheduler with Cooldown
module: heap
pattern_label: Greedy Frequency Heap
complexity_label: O(n log k) time / O(k) space
estimated_minutes: 30
exit_criteria:
  - 能以 Greedy 方式處理當前可用且頻率最高的任務，同時遵守 cooldown 計時。
---
## Concept

題目設定是：一串任務（每個以大寫字母表示），CPU 每個時間單位執行一個任務或閒置（idle）；同一種任務的兩次執行之間至少要隔 n 個單位。問完成全部任務最少需要幾個時間單位——答案**包含 idle**。第一個關鍵觀察：任何連續 n+1 個時間單位裡，同一種任務最多只能出現一次。所以可以把時間切成一格一格長度 n+1 的視窗（round），每個視窗最多裝 n+1 種**不同**的任務，裝不滿的位置就是 idle。第二個觀察：瓶頸是剩餘次數最多的任務。次數 f 的任務要佔 f 個位置且兩兩相隔至少 n+1，光它自己就把時間撐到 (f-1)*(n+1)+1，其他任務只是填縫。兩個觀察合起來就是 Greedy Frequency Heap：用 max-heap 依剩餘次數排序，每個視窗從堆頂取出最多 n+1 種任務、各執行一次、次數減一後放進等待佇列（本視窗內不得再取），視窗結束再把仍有剩餘的整批放回 heap。前一課的 Two Heaps 是用兩個 heap 切割資料流；今天回到單一 max-heap，重點轉為「為什麼貪婪是安全的」。

## Thinking

用 tasks = `AAABBB`、n = 2 走一遍。計數得 {A: 3, B: 3}。第一個視窗長 3：取 A、B 各執行一次（各剩 2），第三格沒有第三種任務可取，只能 idle；視窗算滿 3 個單位。第二個視窗同樣是 A、B、idle。第三個視窗取 A、B 後兩者歸零、heap 為空——這是最後一輪，只算實際執行的 2 格，不補 idle。總計 3+3+2 = 8，排程為 `A B _ A B _ A B`。

為什麼「先取剩餘最多者」不會吃虧？交換論證：假設某個最優排程在時刻 t 執行了 Y，而當時可用的 X 剩餘次數不少於 Y。把兩者從 t 起的出現位置逐對配對（X 的第 i 次對 Y 的第 i 次），每一對把較早的位置給 X、較晚的給 Y；X 多出來的次數留在原位。X 新的相鄰間距不小於原來 X 或 Y 的某個同任務間距，Y 亦然，所以 cooldown 仍然滿足；所有位置只是重新分配，總長度一個單位都沒變。若最優排程在 t 選擇 idle 而 X 可用，把 X 的下一次出現提前到 t 同樣合法且不更長。反覆套用，任何最優排程都能改寫成每一步先排最多者，貪婪因此不劣於最優。

再對照公式解 `max(len(tasks), (maxFreq-1)*(n+1)+countOfMax)`。設最高次數為 f、有 c 種任務達到 f。任一種的最後一次出現至少落在第 (f-1)*(n+1)+1 格；c 種任務的最後一次出現彼此不同格，所以總長至少 (f-1)*(n+1)+c。這是下界，貪婪模擬恰好達到它：前 f-1 個視窗各滿 n+1 格，最後一輪只放那 c 個任務。但下界的另一半是任務總數本身：tasks = `AAABBBCCCDDD`、n = 2 時 (3-1)*3+4 = 10，可是有 12 個任務、一格只能做一件，答案是 12。這就是公式要取 max 的理由；種類多到每個視窗都填滿時完全不需要 idle，模擬版本此時每一輪都取滿、最後一輪也不補格，兩者自然一致。

## Pattern Recognition

觸發訊號是三件事同時出現：任務有次數、同種任務之間有固定的間隔限制、目標是最小化總時間或總步數。這類題的骨架都一樣——按剩餘次數排序、每個視窗取前 n+1 種、執行後重新入列。例如「重排字串使相同字元至少相距 k」就是同一套；把「相距 k」換成「每種資源同時最多用一份」也一樣。若題目只給次數而沒有間隔限制，不需要 heap，總數就是答案；若間隔限制不是對「同種」而是對「任意兩個」任務，那是另一種題。

## Common Mistakes

第一，最後一輪也算滿 n+1 格。`AAABBB`、n = 2 會算成 9 而非 8；`AAAB`、n = 2 正確是 7（`A B _ A _ _ A`），算滿會變成 9，多算了 2 個本來不存在的 idle。第二，沒有優先取剩餘最多者，例如照字母序或先取次數少的：`CCAB`、n = 1 先排 A、B，再排 C 時得插一格 idle 成 `A B C _ C`，總長 5；正確是 `C A C B`，4。`AAABBBCCCDDD`、n = 2 若每輪固定取字母序前三種，會得到 16 而非 12。第三，執行後立刻放回 heap 而不經過等待佇列：`AAAB`、n = 2 時第一個視窗會連取三次 A，回傳 4，但那個排程違反 cooldown。第四，把「幾個 idle」當答案，或把公式的第二項單獨當答案：`AAABBBCCCDDD`、n = 2 的第二項是 10，比任務總數還少，這種排程不可能存在。

## Complexity

設任務總數為 N、任務種類為 k（本題 k ≤ 26）。每次從 heap 取出的都對應一次實際執行，取出總次數恰為 N，每次 O(log k)，加上視窗結束時的放回，總時間 O(N log k)；heap 與等待佇列最多各存 k 個項目，空間 O(k)。注意 `complexity_label` 裡的 n 指任務數，與題目的 cooldown 參數 n 不是同一個。公式解只需計數與一次掃描，O(N + k) 時間、O(k) 空間。

## Digest

Task Scheduler 的答案是「含 idle 的總時間單位數」。任何連續 n+1 格內同一種任務最多出現一次，所以把時間切成長度 n+1 的視窗，每個視窗從 max-heap 取出最多 n+1 種剩餘次數最高的任務、各執行一次、次數減一後放進等待佇列，視窗結束再放回；除最後一輪外每輪都算 n+1 格，最後一輪只算實際執行數。先取最多者是安全的：對任何最優排程，把它與貪婪分歧點之後兩個任務的出現位置逐對交換，早的給次數多者、晚的給少者，cooldown 仍滿足且長度不變。公式 `max(N, (f-1)*(n+1)+c)` 是同一件事的封閉形式：後一項是最高次數 f 的 c 種任務撐出的下界，前一項是任務總數；種類多到不需 idle 時後一項會小於 N，所以要取 max。時間 O(N log k)，空間 O(k)。

## TypeScript Tip

TS 無內建 heap；本題種類至多 26 種、每輪只要前 n+1 大，用計數加每輪排序就能示範貪婪本身：每輪 O(k log k)，heap 是 O((n+1) log k)——這是替代品，不是 heap。兩個斷言分別殺「最後一輪算滿」與「未優先取最多者」。

```typescript
function leastInterval(tasks: string[], n: number): number {
  const cnt = new Map<string, number>();
  for (const t of tasks) cnt.set(t, (cnt.get(t) ?? 0) + 1);
  let rem = [...cnt.values()];
  let time = 0;
  while (rem.length) {
    rem.sort((a, b) => b - a);
    const take = Math.min(n + 1, rem.length);
    const next = rem.slice(take);
    for (let i = 0; i < take; i++) if (rem[i]! > 1) next.push(rem[i]! - 1);
    rem = next;
    time += next.length ? n + 1 : take;
  }
  return time;
}
if (leastInterval("AAAB".split(""), 2) !== 7) throw new Error("overcount");
if (leastInterval("ABCC".split(""), 1) !== 4) throw new Error("order");
```

## Python Tip

`heapq` 是 min-heap，把次數取負放入即成 max-heap；每一輪彈出的項目先收在 `hold`（本輪的等待佇列），輪末再整批推回。`AAAB` 的斷言殺「最後一輪算滿」與「立刻放回」，後者殺「沒取負、先取少者」。

```python
import heapq
from collections import Counter


def least_interval(tasks: list[str], n: int) -> int:
    heap = [-c for c in Counter(tasks).values()]
    heapq.heapify(heap)
    time = 0
    while heap:
        hold, done = [], 0
        while heap and done <= n:
            c = heapq.heappop(heap) + 1
            done += 1
            if c < 0:
                hold.append(c)
        for c in hold:
            heapq.heappush(heap, c)
        time += n + 1 if heap else done
    return time


assert least_interval(list("AAAB"), 2) == 7, "last round or cooldown wrong"
assert least_interval(list("AAABBBCCCDDD"), 2) == 12, "max-first violated"
```

## Takeaway

長度 n+1 的視窗內同種任務最多一次；每輪先取剩餘最多者不會吃虧，最後一輪只算實際執行數。

## Tomorrow Preview

Heap 模組到此收官：從 heap property 與陣列表示、單一路徑的修復、線性時間建堆，到 Top-K、多路合併、雙 heap 平衡，再到今天的貪婪排程，heap 的用法都圍繞同一句話——隨時知道最值在哪，其餘只維持夠用的順序。之後將另起新的主題。

## Today's Challenge

- **621** · 這題就是本課的原型：同種任務間隔至少 n、求含 idle 的最少總時間，剩餘次數最多的任務撐出時間下界，適合以 max-heap 逐輪取前 n+1 種的貪婪模擬。
  - Hint: 先計數。每輪從剩餘最多者開始取、每種最多一次、最多取 n+1 種，取完再把仍有剩餘者放回；只要放回後還有任務，本輪就算 n+1 個單位（含填不滿的 idle），最後一輪只算實際取出的個數。回傳累計的單位數。
