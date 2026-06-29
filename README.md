# TODO Expiry

> **TODO comments that turn 🟢 green → 🟡 yellow → 🔴 red as their due date approaches.**
> Zero config. Works in every language.

[![Version](https://img.shields.io/visual-studio-marketplace/v/sonu8212.todo-expiry?color=blue&label=VS%20Code%20Marketplace)](https://marketplace.visualstudio.com/items?itemName=sonu8212.todo-expiry)
[![Installs](https://img.shields.io/visual-studio-marketplace/i/sonu8212.todo-expiry)](https://marketplace.visualstudio.com/items?itemName=sonu8212.todo-expiry)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

---

## The Problem

Every codebase has TODO comments that were written once and never touched again:

```js
// TODO: fix this later          ← when is "later"?
// TODO: remove before release   ← which release?
// TODO: optimize this           ← still here 2 years later
```

There's no urgency, no deadline, no reminder. They just rot.

---

## The Solution

Add a date to your TODO. TODO Expiry does the rest.

```js
// TODO[2026-08-01]: Refactor payment service     ← 🟢 Green — plenty of time
// TODO[2026-07-05]: Write unit tests             ← 🟡 Yellow — due soon!
// TODO[2025-01-01]: Remove deprecated endpoint  ← 🔴 Red — overdue!
```

![TODO Expiry in action](https://raw.githubusercontent.com/Sonu8212/todo-expiry/main/images/screenshot.png)

---

## Features

- 🟢 **Green** — more than 7 days remaining
- 🟡 **Yellow** — within 7 days of the due date  
- 🔴 **Red** — past the due date (overdue)
- 💬 **Hover tooltip** — shows exact days remaining or how many days overdue
- 📊 **Status bar** — live count of overdue / due soon / on track TODOs
- 🌍 **Every language** — JS, TS, Python, C#, Go, Java, Rust, PHP, and more
- ⚡ **Zero config** — just write the comment and it works instantly

---

## Usage

Write any comment with a date in `TODO[YYYY-MM-DD]` format:

```javascript
// TODO[2026-09-01]: Migrate to new API
```

```python
# TODO[2026-07-10]: Add input validation
```

```csharp
// TODO[2026-08-15]: Refactor auth middleware
```

```go
// TODO[2026-07-03]: Optimise database query
```

Works in **any file type**. No ESLint, no build tools, no config needed.

---

## Why Not Just Use ESLint?

| | TODO Expiry | ESLint plugins |
|---|---|---|
| Works in every language | ✅ | ❌ JS/TS only |
| Visual color change | ✅ | ❌ Just a lint error |
| Zero config | ✅ | ❌ Requires ESLint setup |
| Works in CI | ➖ | ✅ |
| Live in editor | ✅ | ⚠️ Depends on setup |

---

## Settings

| Setting | Default | Description |
|---|---|---|
| `todoExpiry.warningDays` | `7` | Days before due date when TODO turns yellow |

---

## Contributing

Found a bug or have a feature idea? Open an issue on [GitHub](https://github.com/Sonu8212/todo-expiry/issues).

---

## License

MIT © [Sonu](https://github.com/Sonu8212)
