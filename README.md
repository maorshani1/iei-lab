# SERI Lab website

SERI Lab — Social Experiences, Resilience, and Identity — is directed by Dr. Maor Shani in the Department of Psychology at Ariel University. We study intergroup relations, discrimination, belonging, coping, resilience, and well-being.

Our website is available at https://www.maorshani.com. Its 37 pages include research projects, publications, thesis supervision, media coverage, conference presentations, published aggregate results, and a curated question-answering guide.

## Development

Node.js 20 or newer is required. The site has no runtime dependencies.

```sh
npm ci --ignore-scripts
npm run build
npm test
npm run preview
```

The preview server runs at http://127.0.0.1:4173. The default build is excluded from search indexing and disables inquiry submissions. `npm run review:html` generates `review/SERI_Lab_Preview.html`, a portable copy with embedded assets.

`npm run build:production` creates an indexable build with enabled inquiry forms. On Vercel, `npm run build:vercel` chooses the build mode using `VERCEL_ENV`; the published directory is `dist`. The existing GitHub repository and Vercel project are named `iei-lab`.

## Content

- `site/content/site.json`: lab name, research description, contact details, and domain.
- `site/content/publications.json`: citations, source links, and first-page previews.
- `site/content/projects.json`, `people.json`, and `theses.json`: research and supervision.
- `site/content/media.json` and `conferences.json`: media and presentation archives.
- `site/content/data-explorer.json`: published aggregate statistics and their sources.
- `site/content/campus.json`: campus photograph credits, licenses, and source URLs.
- `site/content/forms.json`: inquiry-provider configuration.
- `site/assets/lab-guide.js`: curated answers and links to source pages.

The campus photographs are cached locally. `npm run assets:campus` refreshes the four allowlisted images; source credits remain visible. Publication previews reproduce actual publication pages. Editorial illustrations are labeled as AI-generated.

The question-answering guide matches keywords locally. It does not call a generative-AI service or record visitors’ questions. Research displays use published summary statistics; individual participant records and unpublished experimental datasets are excluded.

`scripts/` contains build, server, and verification code. `dist/` and `review/` are generated directories excluded from Git. The established `/blog/welcome-to-iei` address is retained so existing links and feed identifiers continue to work.
