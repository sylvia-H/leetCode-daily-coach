# Specification Quality Checklist: Curriculum Schema（Curriculum 骨架、Concept frontmatter schema、DAG 建置與驗證）

**Purpose**: Validate specification completeness and quality before proceeding to planning
**Created**: 2026-07-21
**Feature**: [spec.md](../spec.md)

## Content Quality

- [x] No implementation details (languages, frameworks, APIs)
- [x] Focused on user value and business needs
- [x] Written for non-technical stakeholders
- [x] All mandatory sections completed

## Requirement Completeness

- [x] No [NEEDS CLARIFICATION] markers remain
- [x] Requirements are testable and unambiguous
- [x] Success criteria are measurable
- [x] Success criteria are technology-agnostic (no implementation details)
- [x] All acceptance scenarios are defined
- [x] Edge cases are identified
- [x] Scope is clearly bounded
- [x] Dependencies and assumptions identified

## Feature Readiness

- [x] All functional requirements have clear acceptance criteria
- [x] User scenarios cover primary flows
- [x] Feature meets measurable outcomes defined in Success Criteria
- [x] No implementation details leak into specification

## Notes

- **實作細節的界線**：spec 引用了 `docs/spec.md` §17 既定的檔案路徑（`curriculum/modules.json`、
  `src/compiler/curriculum.ts`、`concepts/**`）與領域術語（DAG、`prerequisite` / `next`、`ConceptNode`）。
  這些是**真實來源（spec §17 目錄結構契約）釘死的需求層事實**，非本 spec 自行選定的技術棧；具體工具
  （schema 驗證器、markdown 解析器、語言、測試框架）刻意留白，於 `/speckit-plan` 釘死。與 F1 spec 的慣例一致。
- **「非技術讀者」項**：本 Feature 本質為開發者 / 下游 Feature / 內容產線面向的資料契約與驗證基礎設施，
  其「使用者」即後續 Feature 與課程維護者；已盡量以價值與契約語言撰寫。此為 schema/DAG 類 Feature 的固有性質。
- **待 `/speckit-clarify` 定案項**：Module / Topic 命名與分層、Concept 顆粒度機器可驗門檻、`difficulty` 判定基準
  （§22.5 明列）、雙向邊一致性是否保留、F1 `getPathLabels` 交棒語意的回寫。均已於 spec 以合理預設 + Assumptions
  記錄，**不以 [NEEDS CLARIFICATION] 阻擋**，交由 `/speckit-clarify` 正式定案並回寫 `docs/spec.md`。
- Items marked incomplete require spec updates before `/speckit-clarify` or `/speckit-plan`.
