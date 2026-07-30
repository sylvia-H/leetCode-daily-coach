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
  - >-
    Master generating all subsets of a set by making a binary choice (take or
    skip) at each index.
exit_criteria:
  - >-
    Can write the subset generation recursive function without missing
    combinations.
  - Can collect results correctly at every node or leaf.
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
