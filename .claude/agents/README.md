# Claude Agents

This directory contains specialized agent prompts for specific tasks in the LabWiseLink project.

## Available Agents

### Design System Reviewer

**File:** `design-system-reviewer.md`

**Purpose:** Validates that all code follows the semantic color system and design system guidelines.

**When to use:**
- Before committing new UI features
- During code review of pull requests
- After making UI changes
- When you want to ensure design system compliance

**How to use:**

1. **With Claude Code (recommended):**
   ```
   Use the Task tool to run the design-system-reviewer agent on the recent changes
   ```

2. **Manual review:**
   - Open `.claude/agents/design-system-reviewer.md`
   - Follow the search patterns to find violations
   - Check against the validation rules
   - Generate a report using the template

**What it checks:**
- ❌ Hardcoded colors (bg-blue-600, text-gray-500, etc.)
- ✅ Semantic colors (bg-primary, text-foreground, etc.)
- ❌ Inline form elements (<input>, <button>, <select>)
- ✅ Custom UI components (Input, Button, Select, PasswordInput)
- ❌ Inline SVG icons
- ✅ Centralized Icons.tsx usage

**Example output:**
```markdown
# Design System Review Report

## Summary
- Files reviewed: 5
- Violations found: 3
- Status: ❌ FAILED

## Violations

❌ **src/components/NewFeature.tsx:23**
- Found: `className="bg-blue-600 text-white"`
- Fix: `className="bg-primary text-primary-foreground"`
- Reason: Use semantic color instead of hardcoded blue
```

## How Agents Work

Agents are specialized prompt templates that:
1. Have a specific role and expertise
2. Follow consistent review patterns
3. Provide structured, actionable output
4. Reference project documentation

## Creating New Agents

To create a new agent:

1. **Create a new .md file** in this directory
2. **Define the role** - What is the agent's expertise?
3. **Specify what it does** - Clear, actionable steps
4. **Provide templates** - Output format examples
5. **List success criteria** - When does it pass?
6. **Reference docs** - Link to relevant project files

**Template structure:**
```markdown
# [Agent Name]

## Role
[What is this agent? What's its expertise?]

## What You Do
[Specific actions the agent takes]

## How to Review
[Step-by-step process]

## Report Template
[Expected output format]

## Success Criteria
[What does "passing" look like?]
```

## Best Practices

- Keep agents focused on ONE specific task
- Provide clear, grep-able search patterns
- Include examples of both ❌ wrong and ✅ correct code
- Reference official project documentation
- Use templates for consistent reports
- Make success criteria measurable

## Tips

- Agents are most effective when run **before** committing
- Combine multiple agents for comprehensive reviews
- Update agent files when project standards change
- Keep agent instructions concise but complete
