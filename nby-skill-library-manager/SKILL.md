---
name: nby-skill-library-manager
version: 0.1.0
description: This skill should be used when the user wants to create, organize, enable, disable, list, or move skills within a Git-managed skill library. Use whenever the user mentions "技能库", "skill library", "创建技能", "新技能", "create skill", "add skill", "enable skill", "disable skill", "list skills", "技能列表", "启用", "禁用", or asks about skill organization. Also use this skill whenever the user starts creating any new skill, even if they don't mention the library — every new skill needs to be placed somewhere. Works alongside skill-creator: skill-creator handles HOW to write skills, this skill handles WHERE to put them.
allowed-tools: Bash, Read, Write
---

# Skill Library Manager

Manage a Git-versioned skill library with symlink-based enable/disable.

## How It Works

Symlinks keep a single source of truth in the library directory while allowing
Claude's skill loader to discover only the enabled subset. Enable/disable is
instant — no file copying, no duplication.

When `skill-creator` is also active, this skill runs first to determine the
target directory and set up the skeleton, then `skill-creator` takes over for
writing the SKILL.md content and running evals.

## Prerequisites Check

Before creating a new skill, check if `skill-creator` is available in the
current session's skill list. If not, suggest installing it:

```bash
npx skills add https://github.com/anthropics/skills --skill skill-creator
```

This is optional but recommended — `skill-creator` provides structured eval,
benchmark, and description optimization capabilities that significantly improve
skill quality. Without it, this skill can still manage library placement and
symlinks, but the user will need to write SKILL.md content manually.

Skip this check for non-creation operations (enable, disable, list).

## Load Configuration

Before any operation, read `EXTEND.md` from config paths (in priority order):

1. `.nby-skills/nby-skill-library-manager/EXTEND.md` (project-level)
2. `~/.nby-skills/nby-skill-library-manager/EXTEND.md` (user-level)

If neither exists, run **First-Time Setup** (see below).

## Operations

### Creating a New Skill

1. Read `EXTEND.md` to get `library_path` and `enabled_path`
2. Create skill directory: `{library_path}/{skill-name}/`
3. After skill content is ready, enable it: `cd {enabled_path} && ln -s {library_path}/{skill-name} .`
4. Update the library README skill table (if `readme_path` is configured)
5. Remind user to commit changes to Git

### Enabling a Skill

```bash
cd {enabled_path} && ln -s {library_path}/{skill-name} .
```

### Disabling a Skill

```bash
rm {enabled_path}/{skill-name}
```

Only removes the symlink, not the skill itself.

### Listing Skills

```bash
# All available
ls {library_path}/

# Currently enabled
ls -la {enabled_path}/
```

## First-Time Setup

If no `EXTEND.md` config is found, guide the user:

1. Ask: "Do you have an existing skill library directory?"
   - **Yes** → Ask for the path, detect its structure
   - **No** → Offer to create one (see Init below)

2. Ask: "Save config for this project only, or for all projects (user-level)?"
   - Project: `.nby-skills/nby-skill-library-manager/EXTEND.md`
   - User: `~/.nby-skills/nby-skill-library-manager/EXTEND.md`

3. Write the `EXTEND.md` config file

### Init a New Library

```bash
mkdir -p {library_path} {enabled_path}

# Point Claude's skill loading to the enabled directory
ln -sf {enabled_path} ~/.claude/skills
```

Create a README with skill table template at `{library_path}/../README.md` (or wherever the repo root is).

## README Update

When `readme_path` is configured and a skill is created/removed, update the
skill table in that README. Match the existing table format — scan for
`| Skill | Description |` header and append/remove rows.

## Configuration Reference

See `EXTEND.md.example` for all available options.
