---
id: backtracking-subset-generation
title: Backtracking Subset Generation
module: backtracking
topic: backtracking
difficulty: easy
estimated_minutes: 15
pattern_label: Include/Exclude Choice Pattern
complexity_label: O(2^n) / O(n)
prerequisite:
  - backtracking-core-concept-introduction
next:
  - backtracking-subset-with-duplicates
  - backtracking-combination-sum
learning_goal:
  - '熟練透過在每個索引做二元選擇（取或不取）來生成一個集合的所有子集。'
exit_criteria:
  - '能寫出子集生成的遞迴函式，且不遺漏任何組合。'
  - '能在每個節點或葉節點正確收集結果。'
leetcode:
  - 78
  - 90
tags:
  - backtracking
  - subsets
---

## Author Hints

- 核心觀念：At each step, decide whether to include the current element in the subset or exclude it, advancing the index until all elements are processed.
- Pattern 辨識線索：The problem asks for power sets or collecting all valid combinations of various lengths.
- Thinking：Start with an empty path, branch to include index i, recurse, then pop and branch to exclude index i.
- Common Mistakes：Adding references to the temporary path list instead of shallow/deep copies (e.g., path.slice() or list(path)).
- TypeScript 重點：Remember to push a copy of the array (results.push([...path])) rather than the reference itself.
- Python 重點：Append a copy of the list (results.append(list(path))) to prevent future mutations from altering saved answers.
- 題號 78 為何適合此 Pattern：Classic subset generation where every node in the recursion tree represents a valid subset.
- 題號 90 為何適合此 Pattern：Extends basic subsets by requiring handling of duplicate elements to avoid duplicate result sets.
