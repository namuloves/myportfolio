# css-spec

A **dev-only**, Figma-style CSS design-spec overlay for **Next.js (App Router)**.

Hover any element to read its box model, type, and color spec. Open the inventory
panel to edit design tokens live and write them back to your globals stylesheet.
Built for developers running Claude Code on localhost — when a change can't be made
safely in-place, it copies a precise, natural-language instruction for Claude Code
to edit the exact CSS rule (never a global find-replace).

Toggle the overlay with **⌥D** (Alt+D).

> **Dev-only by design.** The server route returns **404 in production**
> (`NODE_ENV === "production"`), and the overlay component is tree-shaken out of
> production builds. Never mount it on a public deployment.

## Quick start

```bash
npm i -D css-spec
npx css-spec init
```

`css-spec init` wires everything up for you — it creates the dev API route and
adds the overlay (and its styles) to your `app/layout.tsx`. Then run your dev
server and press **⌥D**. It's safe to re-run; it skips anything already set up.

`react`, `react-dom`, and `next` are peer dependencies (React 18–19, Next 14–15).

---

## Manual setup

Prefer to wire it yourself? `css-spec init` does exactly these three steps.

### 1. Mount the dev API route

Create `app/api/design-spec-dev/route.ts`:

```ts
import { createDesignSpecHandler } from "css-spec/server";

export const POST = createDesignSpecHandler();
export const runtime = "nodejs"; // the handler uses fs — must not run on Edge
```

### 2. Render the overlay (dev-only)

In `app/layout.tsx`, mount it so it's tree-shaken from production:

```tsx
import dynamic from "next/dynamic";

const DesignSpecOverlay =
  process.env.NODE_ENV !== "production"
    ? dynamic(() => import("css-spec/client").then((m) => m.DesignSpecOverlay))
    : () => null;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html>
      <body>
        {children}
        <DesignSpecOverlay />
      </body>
    </html>
  );
}
```

The component accepts an optional `apiPath` (defaults to `/api/design-spec-dev`).
Set it only if you mount the route somewhere else:

```tsx
<DesignSpecOverlay apiPath="/api/my-design-spec" />
```

### 3. Import the styles (once)

Import the overlay's stylesheet anywhere it loads in dev — e.g. at the top of
`app/layout.tsx`:

```ts
import "css-spec/style.css";
```

(The styles are scoped to the overlay's own hashed class names, so they won't
affect your app's CSS.)

## Configuration

The handler resolves your globals stylesheet and the directories it may edit,
in this order:

1. **Config** — `designSpec` key in `package.json`, or a `design-spec.config.json`:
   ```json
   { "globals": "src/styles/globals.css", "scan": ["src"] }
   ```
2. **Env** — `DESIGN_SPEC_GLOBALS=src/styles/globals.css`
3. **Auto-detect** — scans for the `.css` file declaring the most `:root` tokens.

The handler only writes `.css` files inside the resolved scan roots, validates
token names/values by shape, and never touches the dark-theme `:root` block.

## Requirements

- Next.js 14–15, App Router
- React 18–19

## License

MIT
