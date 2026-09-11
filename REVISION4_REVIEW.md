# Revision 4: content and publication checklist

Prepared 10 September 2026. This is not a deployment report.

## Public website changes

The homepage hope table was removed, not the full Study 4 display. Real campus-photo placements were added, with credits and photo dates; these are not photographs of the IEI Lab itself. Publication thumbnails are genuine PDF-page renders, not reconstructed covers. Media and conference archives and the published data explorer have been added. The menu retains the larger sans-serif typography.

## Campus photographs: network-dependent until cached

Four verified Wikimedia Commons photo-source records are in `site/content/campus.json`. The source pages were read and licenses/attributions recorded. The four image files themselves could not be downloaded in this environment. They are currently remote URLs. The Vercel build attempts a bounded allowlisted download; if it fails, the site retains the remote URL and offers the credited source on image-load failure. This is a graceful fallback, not a claim that image delivery was verified. Confirm all four actual photos render in the preview deployment before switching the public domain. A locally opened portable preview needs internet access for these four photos.

The older editorial photos are still labeled AI-generated. No generated person is used as a portrait of a named staff member or student.

## Publication-page previews

18 records have an actual first-page preview. The PNAS Nexus image is the supplied accepted-manuscript version and is labeled accordingly. The preview is not a full-text download. The following six published records still have no genuine preview in this package: How to make gluten-free friends (2025); CoCo project (2023); Stress and worry across 48 countries (2021); COVIDiSTRESS dataset (2021); Can Abraham bring peace? (2019); Deep-sea mining (2018). Two forthcoming chapter records have no fabricated image. See the preview audit JSON for source mapping.

The publication list was not comprehensively updated to include every possible new publication or revised author order. This revision adds previews to the existing bibliography.

## Media records

23 records combine the attached 28 October 2024 media document with the media section of the September 2026 CV. Repeated links were deduplicated. An archive entry may be a third-party news report, outside commentary, an institutional notice, or a print reference; it is not automatically a text authored by Maor.

Important page-verified metadata is distinguished from the source-list wording. The linked taz interview is dated 26 July 2013, with a different title from the CV. The linked Times of Israel blog is by Wendy Kalman (5 March 2025), not by Maor; it discusses his research. The Copenhagen item is dated 7 March 2024 and the Phys.org item 8 March 2024. The FACE Joven item is dated 8 December 2024, despite the October 2024 filename of the supplied media list. NDR dates remain unconfirmed and are not guessed. Print-only and login-dependent items are labeled; no claim is made that every historical link is currently accessible.

## Conference archive

30 entries are transcribed from the September 2026 CV: 26 conference presentations and four invited lectures/workshops. This supersedes the earlier April CV where dates differ, including the Haifa conference entry (7–9 July 2026 in the newer CV). These are source-derived archival records, not independently verified event attendance or a future-events calendar. Some meeting-number ordinals in the CV may warrant checking. No future invitation, keynote designation, recording, or public presentation-file link was invented.

## Ask the lab

This is a functional, curated question-answering guide with relevant internal sources. It is not a generative AI agent, and does not call an AI service. Unknown questions receive a bounded fallback. A real conversational AI layer would be a separate, reviewed server-side integration with an approved provider, credentials, usage budget, abuse controls, privacy text, and a public-content-only knowledge base. No external AI account, key, billing, or provider access was added here.

## Data

The public data explorer contains all 45 unique correlations among the ten variables in the published Germany study, along with the reported confidence intervals and descriptive statistics. It does not infer raw observations, undocumented pair-specific N, exact p-values, Spearman correlations, or experimental subgroups from that matrix.

The separately supplied experimental HTML is private author review. It is NOT included anywhere in this website package. Its Ariel composite scores and screening decisions are explicit provisional proposals and require scientific confirmation. Do not copy its JSON, screenshots, or output into this repository merely because it contains aggregates rather than identifiers. The study consent specifies aggregate-only reporting; that does not by itself settle scoring, publication timing, or coauthor approval.

## Deployment and forms

The existing form-provider code and configuration were preserved. The Content Security Policy adds only the campus image host to image sources; inquiry destinations remain unchanged. Review mode cannot send inquiries. No live GitHub/Drive/Vercel change or mail-delivery test was made. Keep the existing rollback/preview/approval workflow in MIGRATE_IN_CODEX.md.
