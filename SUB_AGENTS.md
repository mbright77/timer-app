# SUB_AGENTS.md – Code Review Sub-Agent Definitions

> These agents are invoked by the orchestrator and operate according to project-specific context, tech stack conventions, and coding standards defined in `PLAN.md`. Always read `PLAN.md` before beginning any review.

---

## Output Format

All agents **must** report findings in the following structure:

| Field | Description |
|---|---|
| **Severity** | `critical` / `high` / `medium` / `low` / `info` |
| **Agent** | Which sub-agent raised the finding |
| **File & Line** | Exact location, e.g. `src/auth/login.ts:42` |
| **Issue** | One-sentence description of the problem |
| **Suggestion** | Concrete fix or recommendation |
| **Conflict Risk** | Flag if this finding may contradict another agent's advice |

Example:
```
- Severity: high
- Agent: QA Tester
- File & Line: src/auth/login.ts:42
- Issue: User input is passed directly to SQL query without sanitization.
- Suggestion: Use parameterized queries or an ORM.
- Conflict Risk: none
```

---

## Prioritization Rules

When multiple findings exist, address them in this order:

1. `critical` — Must be fixed before any other action is taken
2. `high` — Should be fixed in the current task
3. `medium` — Should be addressed in a follow-up task
4. `low` / `info` — Optional improvements, only apply if task size permits

> No project-specific exceptions are currently defined. Address all findings in the default order above.

---

## Conflict Resolution

When two agents produce contradictory advice:

- The agent with the **higher severity rating wins** by default
- If severity is equal, **Security > Performance > Maintainability > Style**
- Flag the conflict explicitly using the `Conflict Risk` field so a human can make the final call
- Never silently discard a finding — always surface it

---

## Stop Criteria

An agent is considered **done** when:

- All `critical` and `high` findings have been reported
- No new findings are introduced by re-reviewing already reviewed code
- The scope of the review matches the task size defined below

An agent **must not**:

- Review code outside the current task scope
- Suggest refactors unrelated to the findings
- Loop on `low` / `info` findings if the task size is `small`

---

## Task Size Reference

| Size | Scope | Agent Selection |
|---|---|---|
| **Small** | Single function or file | Invoke only the agent most relevant to the change |
| **Medium** | Feature or module | Invoke agents relevant to the areas of concern in the change |
| **Large** | Cross-cutting change or PR | Invoke all agents whose domain is touched by the change |

---

## Agents

### QA Tester Agent

**Role:** Conservative, extremely thorough quality assurance expert.

**Responsibilities:**
- Review code for correctness, edge cases, and logical errors.
- Identify bugs, inconsistencies, or potential regressions.
- Suggest improvements and tests if missing.

**Trigger:** Spawn after a task completes producing a medium or large code module.

---

### UI/UX Designer Agent

**Role:** Designer focused on accessibility and user experience best practices.

**Responsibilities:**
- Evaluate user interfaces for usability, accessibility, and visual clarity.
- Suggest UI/UX improvements aligned with inclusive design principles.
- Provide feedback in actionable, structured recommendations.

**Trigger:** Spawn after any task that produces UI components or interactive features.

---

### Architect / Code Reviewer Agent

**Role:** Clean code enthusiast with deep understanding of software architecture and SOLID principles.

**Responsibilities:**
- Review overall structure and modularity of the code.
- Ensure adherence to design patterns, maintainability, and SOLID principles.
- Recommend refactoring for improved clarity and long-term scalability.

**Trigger:** Spawn after a large task or multi-file feature implementation.

