# Fix: nested `<form>` hydration error (Next.js)

## Problem

You hit this runtime warning/error:

> In HTML, `<form>` cannot be a descendant of `<form>`. This will cause a hydration error.

The stack trace pointed at:

- `packages/ui/src/components/ai/input.tsx` (`AIInput` renders a `<form>`)
- `apps/web/modules/dashboard/ui/views/ConversationsViewId.tsx` (wraps `AIInput` in `react-hook-form`’s `<Form>`)

## Why it happened (root cause)

There were **two separate components rendering actual `<form>` tags**:

1. `AIInput` is defined as:
   - `export const AIInput = (...) => (<form ... />)`
2. In `ConversationsViewId`, the component imported `Form` from `react-hook-form`:
   - `import { Form, useForm } from "react-hook-form";`
   - `react-hook-form`’s `<Form>` component renders a real `<form>` element.

So the resulting DOM became:

```html
<form>
  <!-- react-hook-form Form -->
  <form>
    <!-- AIInput -->
    ...
  </form>
</form>
```

That’s invalid HTML. On the client, React/Next tries to reconcile the server HTML with client-rendered HTML and warns about hydration problems.

## Fix strategy

Keep **exactly one** real `<form>` element.

In this codebase, the pattern used elsewhere (e.g. the widget) is:

- Use `@workspace/ui/components/form`’s `Form` which is **just `FormProvider`** (context provider, **not** a `<form>`)
- Let `AIInput` be the actual `<form>` wrapper that handles `onSubmit`

So we changed `ConversationsViewId` to use the UI `Form` provider instead of `react-hook-form`’s `<Form>` element.

## What changed

File: `apps/web/modules/dashboard/ui/views/ConversationsViewId.tsx`

- Removed `Form` import from `react-hook-form`
- Imported `Form` from `@workspace/ui/components/form`

Result: there is only one `<form>` in the rendered tree (the one from `AIInput`).

## Patch (conceptual)

Before:

```ts
import { Form, useForm } from "react-hook-form";
import { FormField } from "@workspace/ui/components/form";
```

After:

```ts
import { useForm } from "react-hook-form";
import { Form, FormField } from "@workspace/ui/components/form";
```

## How to verify

1. Run the app and open the conversation view page.
2. Confirm the console warning is gone.

If your environment has dependencies installed, you can run:

```bash
cd /mnt/storage/projects/web/node/vivia
pnpm install
pnpm dev
```

## Notes / gotchas

- `@workspace/ui/components/form`’s `Form` is a context provider (no DOM), so it’s safe to wrap real `<form>` elements.
- `react-hook-form`’s `<Form>` renders a real `<form>`, so you must not wrap another form element inside it.
- If you ever need `AIInput` to be usable inside an existing form, an alternative fix is to refactor `AIInput` to render a `<div>` (or add an `asChild`/`as` prop). We didn’t do that here because the repo already uses `AIInput` as the primary form container.

## Quick heuristic to avoid this later

- Search for `<form` in reusable UI components (like `AIInput`).
- Ensure pages don’t also wrap those components in another `<form>`.
- Prefer: **one form tag per submission boundary**.
