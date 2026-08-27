# IEI Lab — Intergroup Experiences and Identity Lab

Site for [maorshani.com](https://maorshani.com): research, people, publications, notes, and study participation.

Directed by Dr. Maor Shani, Department of Psychology, Ariel University.

## Run locally

```bash
npm install
npm run dev
```

## Put it on GitHub and on maorshani.com

This is a TanStack Start app (not a folder of static HTML). **GitHub is the right place for the code. GitHub Pages is not the right place to host it.**

The reliable path:

1. Push this repository to GitHub.
2. Connect it to **Vercel** (free) — this project is already set up for that.
3. Point **maorshani.com** at Vercel.

Cloudflare Pages is a fine alternative. GitHub Pages would need a static rebuild of the whole site.

### 1. Create the GitHub repo

On [github.com/new](https://github.com/new):

- Repository name: e.g. `iei-lab` or `maorshani.com`
- Public is typical for an academic site
- Do **not** add a README, `.gitignore`, or license (this project already has them)

On your computer, in this project folder:

```bash
git init
git add .
git commit -m "Initial commit: IEI Lab site"
git branch -M main
git remote add origin https://github.com/YOUR_USER/iei-lab.git
git push -u origin main
```

### 2. Deploy from GitHub (Vercel)

1. Sign in at [vercel.com](https://vercel.com) with GitHub.
2. **Add New → Project** and import the repo.
3. Leave the defaults (Vite / TanStack Start, `npm run build`).
4. Click **Deploy**.

You will get a URL like `iei-lab.vercel.app`. Check that it looks right before touching DNS.

### 3. Attach maorshani.com

In the Vercel project: **Settings → Domains → Add** `maorshani.com` and `www.maorshani.com`. Prefer the apex (`maorshani.com`) as the primary and redirect `www` to it (or the reverse — pick one).

At your domain registrar (where you bought maorshani.com), set:

**Apex (`maorshani.com`)** — A records:

| Type | Name | Value |
| --- | --- | --- |
| A | `@` | `76.76.21.21` |
| A | `@` | `76.76.21.22` |

**www** — CNAME:

| Type | Name | Value |
| --- | --- | --- |
| CNAME | `www` | `cname.vercel-dns.com` |

Vercel’s dashboard will show the exact records if they differ. Remove any old A/CNAME records for `@` and `www` that point elsewhere.

DNS can take from a few minutes to a few hours. HTTPS is issued automatically.

### Alternative: Cloudflare Pages

1. [dash.cloudflare.com](https://dash.cloudflare.com) → **Workers & Pages → Create → Pages → Connect to Git**.
2. Build command: `npm run build`
3. Output: follow the TanStack Start / Nitro preset Cloudflare documents (or use the Vercel path above — it is simpler for this repo).
4. **Custom domains** → add `maorshani.com`. If the domain’s nameservers are already at Cloudflare, this is one click.

### Why not GitHub Pages?

GitHub Pages only serves static files. This site is built as a server app (TanStack Start + Nitro). Forcing it onto Pages would mean rewriting the build to a static export. If you specifically want Pages, say so and it can be converted.

## After it is live

- Future edits: change files, `git push` — Vercel rebuilds automatically.
- Scholar / email / phone: edit `src/data/lab.ts`, `src/data/publications.ts`, `src/data/people.ts`, `src/data/research.ts`, `src/data/blog.ts`.
- Forms on Participate and Contact currently record interest in the browser (toast confirmation). Wire them to email (Formspree, Basin, or a Vercel serverless route) when you want messages in your inbox.
