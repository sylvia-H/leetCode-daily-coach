---
id: hash-table-prefix-sum-frequency
title: Prefix Sum Frequency for Subarray Counts
module: hash-table
topic: hash-table
difficulty: medium
estimated_minutes: 15
pattern_label: Prefix Sum Hash Map
complexity_label: O(n) / O(n)
prerequisite:
  - array-prefix-sum-basic
  - hash-table-frequency-counting
  - hash-table-grouping-anagrams
next:
  - hash-table-longest-consecutive-sequence
learning_goal:
  - >-
    Count subarrays matching a target sum using prefix sums stored in a
    frequency hash map.
exit_criteria:
  - Can compute running prefix sum
  - >-
    Can check if prefix_sum - target exists in the frequency map to count valid
    subarrays
leetcode:
  - 560
  - 525
tags:
  - hash-table
  - prefix-sum
---

## Author Hints

- 核心觀念：Store frequencies of prefix sums in a hash map to find sub-segments that sum to a target in O(n) time.
- Pattern 辨識線索：Subarray sum equals k with negative numbers present (where sliding window fails).
- Thinking：If prefixSum[j] - prefixSum[i] = target, then prefixSum[i] = prefixSum[j] - target. Look up prefixSum[j] - target in map.
- Common Mistakes：Forgetting to initialize the hash map with {0: 1} to account for subarrays starting from index 0.
- TypeScript 重點：Initialize map with entry [0, 1] before starting the loop.
- Python 重點：Use collections.defaultdict(int) with prefix_sum counts initialized to {0: 1}.
- 題號 560 為何適合此 Pattern：Subarray Sum Equals K counts prefix sum frequencies to find target sums.
- 題號 525 為何適合此 Pattern：Contiguous Array converts 0s to -1s and uses prefix sum matching to find equal 0s and 1s.
