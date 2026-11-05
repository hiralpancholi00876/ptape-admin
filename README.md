# P-Tape Admin (v2)

React + Vite rewrite of the Next.js admin in `../admin`. It talks to the same API in `../backend`.

## Setup

```sh
bun install
cp .env.example .env.local   # optional; defaults to http://localhost:5551/api/v1/admin/
bun run dev
```

| Script            | What it does                         |
| ----------------- | ------------------------------------ |
| `bun run dev`     | Vite dev server                      |
| `bun run build`   | Type-check, then production build    |
| `bun run lint`    | ESLint                               |
| `bun run preview` | Serve the production build locally   |

## Routes

| Path                   | Page                                                                 |
| ---------------------- | -------------------------------------------------------------------- |
| `/`                    | Redirects to the drafts queue                                        |
| `/video/drafts`        | Publishing queue: tabs by stage (`?tab=`), publish panel, bulk actions |
| `/video/list`          | Videos with search, visibility filter and sort (`?q=&status=&sort=&page=`) |
| `/video/add`           | New video                                                            |
| `/video/edit/:slug`    | Edit video                                                           |
| `/video/details/:slug` | Player, sources, metadata                                            |
| `/studios`             | Studios                                                              |
| `/pornstars`           | Pornstars                                                            |
| `/category`            | Categories                                                           |

## Keyboard

| Keys          | Where                     | Does                         |
| ------------- | ------------------------- | ---------------------------- |
| `/`           | Videos                    | Focus search                 |
| `⌘S` / `Ctrl+S` | Video form and publish panel | Save (hidden, for new videos) |
| `⌘↵` / `Ctrl+↵` | New video and publish panel  | Publish                      |
| `Esc`         | Publish panel, dialogs    | Close (asks first if there are unsaved edits) |

## Notes

- Server data (videos, studios, drafts, …) is cached by react-query. Client state shared across the app lives in zustand stores under `src/stores`: auth, theme, sidebar, drafts preferences, and `confirm()`.
- Notifications use [react-hot-toast](https://react-hot-toast.com/): call `toast.success()`, `toast.error()` or `toast()` (info) from anywhere, including outside React. Styling lives in `src/components/Toaster.tsx`.
- The video list uses the backend's optional `status` (`active`/`hidden`) and `sort` (`newest`/`oldest`/`views`/`title`) parameters and its `pagination.total` count.
- The auth token lives in `localStorage` and is sent as a bearer header. A 401/403 from the API clears it and sends you back to `/login`.
- This is a client-rendered SPA. Whatever hosts `dist/` must serve `index.html` for unknown paths so deep links work.
