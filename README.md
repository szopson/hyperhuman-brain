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

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

## Known Limitations (v0.1)

- **`PainSchema.category` enum nie zawiera `competitive_risk`** — to legitna kategoria pain wskazana w briefingu Konrada (zagrożenie ze strony konkurencji jako odrębny pain). W v0.1 P-019 (Market Intelligence) mapuje na `scaling_blocker` + `lost_context` jako closest fit. Wymaga schema bump + regeneracja Phase A — planowane na v0.2.
- **Strategic briefing overlay** (`data/cases/*/inputs/strategic-briefing-overlay.json`) jako ad-hoc mechanizm dodawania painów spoza transkryptu (np. founder pain identyfikowany przez konsultanta). Planowane: Phase B enrichment ma to przejąć systematycznie.
- **Master extraction prompt z §4.2** trzymany verbatim — nie modyfikujemy go aby dodać founder-perspective pain category. Founder pain wprowadzamy przez overlay.
