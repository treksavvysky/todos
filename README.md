This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deployment

Todos is not deployed on Vercel. Production runs on atlas-xxl as an infrastructure deploy unit
(`treksavvysky/infrastructure`, `hosts/atlas-xxl/services/todos`), reachable only over Tailscale
(SEC-2026-10-20-TODOS).

- Only pushed commits are deployed. The image `todo-app:<short-sha>` is built from the commit itself
  on the isolated builder (rootless BuildKit on atlas-xxl) and stored in the private tailnet registry.
- `deploy-unit todos --release <sha> --build --reason "…"` on atlas-xxl builds if needed, pulls the
  image, backs up `data/` (`pre_up`), restarts the container, checks health, and rolls back to the
  previous release if the checks fail.
- `@plugins/*` are vendored in `vendor/plugins/`, so a todos commit alone fixes the whole build.
- Local development: `npm run dev` (above) or `docker compose up --build` (see `CLAUDE.md`).
