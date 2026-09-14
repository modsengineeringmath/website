# Mod's Engineering Mathematics — Docusaurus v2

Production-ready Docusaurus v3 source for [modsengineeringmath.com](https://modsengineeringmath.com/).

This project lives on the `docusaurus-v2` branch so the current website on `main` remains unchanged.

## Technology

- Docusaurus 3.10.2 + TypeScript + React
- Markdown/MDX knowledge hub
- KaTeX mathematics
- Real build-time local search with `@easyops-cn/docusaurus-search-local`
- Responsive Docusaurus navbar with a functional mobile hamburger drawer
- SEO, sitemap, robots.txt, JSON-LD and llms.txt
- Static output for Cloudflare Pages Free Plan

## Install

Requirements: Node.js 20 or later.

~~~bash
git clone --branch docusaurus-v2 https://github.com/modsengineeringmath/website.git modsengineeringmath-v2
cd modsengineeringmath-v2
npm install
~~~

## Run locally

~~~bash
npm run start
~~~

Open `http://localhost:3000`.

## Type-check and build

~~~bash
npm run typecheck
npm run build
npm run serve
~~~

The production output is in `build/`.

> Local Search is indexed during `npm run build`. For the most accurate search test, run `npm run build` followed by `npm run serve`.

## Deploy to Cloudflare Pages

Connect the GitHub repository and select branch `docusaurus-v2`.

| Setting | Value |
|---|---|
| Framework preset | Docusaurus |
| Production branch | `docusaurus-v2` |
| Build command | `npm run build` |
| Build output directory | `build` |
| Root directory | `/` |
| Node version | `20` or later |

Then add the custom domain `modsengineeringmath.com` in **Workers & Pages → project → Custom domains**.

Do not point the production domain to this branch until the preview URL has been reviewed.

## Five main pages

- `/` — Home
- `/learn/` — Knowledge Hub
- `/courses` — Online Courses
- `/resources` — Resources / Digital Store
- `/about` — About and contact

Auxiliary templates:

- `/courses/laplace-transform`
- `/resources/laplace-transform-workbook`
- `/worksheet-generator`

## Add a lesson

1. Add a Markdown or MDX file under the correct folder in `docs/`.
2. Add front matter with `title`, `description`, `slug`, and `keywords`.
3. Add its document ID to `sidebars.ts`.
4. Add internal links from prerequisite and next-step lessons.
5. Run `npm run build` to regenerate the search index and sitemap.

Example:

~~~md
---
title: Eigenvalues for Engineers
description: ความหมายและการประยุกต์ eigenvalues ในระบบวิศวกรรม
slug: /linear-algebra/eigenvalues
keywords: [eigenvalues, linear algebra, state space]
---

# Eigenvalues for Engineers

Inline equation: $A\mathbf{v}=\lambda\mathbf{v}$

$$
\det(A-\lambda I)=0
$$
~~~

## Add a course or product

- Edit catalog data in `src/config/catalog.ts`.
- Add a detail page under `src/pages/courses/` or `src/pages/resources/`.
- Add truthful JSON-LD using `src/components/SeoJsonLd.tsx`.
- Keep purchase buttons disabled until a real checkout URL and fulfillment flow exist.

Payment configuration is isolated in `src/config/payment.ts`; no provider is hard-coded.

## Add an image

Place files under:

~~~text
static/images/logo/
static/images/home/
static/images/calculus/
static/images/linear-algebra/
static/images/laplace/
static/images/control/
static/images/courses/
static/images/products/
static/images/engineering/
~~~

Use lowercase, descriptive, hyphen-separated names such as:

`static/images/calculus/derivative-definition.webp`

Reference it as:

~~~md
![Derivative from definition graph](/images/calculus/derivative-definition.webp)
~~~

## Change social links

Edit only `src/config/site.ts`. Navbar and footer defaults are in `docusaurus.config.ts`.

## Search configuration

Search is configured in `docusaurus.config.ts`. It indexes:

- Docs titles and body text
- Static page titles and text
- Headings and keywords
- English and Thai language content

The search box and mobile search interface are supplied by the local-search theme integration and are not decorative controls.

## Mobile navigation

Docusaurus controls the responsive breakpoint, focus management, keyboard behavior, backdrop, open/close state, and route navigation. Custom CSS maintains 44px touch targets. Test at 360px, 390px, tablet, laptop, and desktop widths.

## Security

- No API key, payment secret, password, or private token is stored in browser code.
- `.env.example` contains names only.
- Future AI calls must go through a server-side Cloudflare Worker with authentication, validation, rate limits, and usage limits.

## Continuous integration

`.github/workflows/validate-docusaurus.yml` runs TypeScript checks and a production build after pushes to `docusaurus-v2`.
