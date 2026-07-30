---
id: backtracking-permutation-basics
title: Backtracking Permutation Basics
module: backtracking
topic: backtracking
difficulty: medium
estimated_minutes: 20
pattern_label: State Tracking Permutation
complexity_label: O(n!) / O(n)
prerequisite:
  - backtracking-core-concept-introduction
  - backtracking-combination-sum-ii
next:
  - backtracking-permutation-with-duplicates
learning_goal:
  - >-
    Learn how to generate permutations where order matters by visiting all
    unused elements at each step.
exit_criteria:
  - >-
    Can use a visited array or set to track which elements are currently
    included in the path.
  - Can generate all n! permutations.
leetcode:
  - 46
tags:
  - backtracking
  - permutations
---

## Author Hints

- 核心觀念：Unlike subsets where we move forward with indices, permutations can pick any unvisited element from the entire array at every position.
- Pattern 辨識線索：The problem asks for all possible orderings or arrangements (permutations) of a collection.
- Thinking：Iterate through the entire array from the beginning every time, using a boolean visited array to skip already selected elements.
- Common Mistakes：Forgetting to reset the visited flag when backtracking (unchoosing), leading to missing elements in subsequent paths.
- TypeScript 重點：Maintain a boolean array visited of size n to track element usage.
- Python 重點：Can use a boolean list or check if element is not in path for small arrays, though visited array is O(1) lookup.
- 題號 46 為何適合此 Pattern：Classic permutation problem where all orderings of a distinct set of numbers are required.
