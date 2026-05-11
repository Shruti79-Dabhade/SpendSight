# Tests

## Running tests

```bash
npm install
npx vitest run
```

To run only the audit engine suite (filename filter):

```bash
npx vitest run audit-engine
```

## Test files

| File | What it covers | Command |
|------|----------------|---------|
| `tests/audit-engine.test.ts` | Core audit logic: duplicate coding stack detection (Cursor + Copilot + Anthropic API), seat-based downgrades, Credex spend threshold, verdict bands, coding use-case routing, zero-savings edge case, single-tool safety, annualization | `npx vitest run audit-engine` |
