export type Publication = {
  id: string;
  type: "article" | "chapter" | "proceedings" | "report" | "other";
  year: number;
  title: string;
  authors: string;
  venue: string;
  doi?: string;
  url?: string;
  firstAuthor?: boolean;
  studentCoauthor?: boolean;
  sharedFirst?: boolean;
  forthcoming?: boolean;
  if?: string;
  quartile?: string;
  citations?: number;
  tags: string[];
  highlight?: boolean;
};

export const publications: Publication[] = [
  {
    id: "pnas-nexus-2026",
    type: "article",
    year: 2026,
    title:
      "Associations between inclusivity norms and tolerance, contact, and cooperation amid polarization: Evidence from 12 European countries",
    authors:
      "Schäfer, L. F., Tausch, N., Bukowski, M., Jaspers, E., Lubbers, M. J., van Zalk, M., Shani, M., … Christ, O.",
    venue: "PNAS Nexus",
    doi: "10.1093/pnasnexus/pgag087",
    if: "3.8",
    quartile: "Q1",
    citations: 7,
    tags: ["inclusivity", "polarization", "Europe"],
    highlight: true,
  },
  {
    id: "stritzke-chapter-2026",
    type: "chapter",
    year: 2026,
    title: "Political socialization in war and peace",
    authors: "Shani, M. & Stritzke, L.",
    venue:
      "In K. Boehnke et al. (Eds.), Research Handbook on Political Socialization. Edward Elgar",
    firstAuthor: true,
    studentCoauthor: true,
    forthcoming: true,
    tags: ["political socialization", "war", "peace"],
  },
  {
    id: "handbook-antisemitism-2026",
    type: "chapter",
    year: 2026,
    title:
      "The psychosocial impact of antisemitism on Jewish communities in Germany after October 7th",
    authors: "Shani, M., Gerber, J., & Herb, M.",
    venue:
      "In J. Bernstein, S. Müller, & F. Diddens (Eds.), The Handbook of Antisemitism Studies. Nomos",
    firstAuthor: true,
    studentCoauthor: true,
    forthcoming: true,
    tags: ["antisemitism", "Germany", "trauma"],
  },
  {
    id: "place-branding-2025",
    type: "article",
    year: 2025,
    title:
      "Re-imaging a country beyond its conflict: Evaluation of an Israeli public diplomacy intervention for youth in Germany",
    authors: "Shani, M.",
    venue: "Place Branding and Public Diplomacy, 21, 232–244",
    doi: "10.1057/s41254-024-00386-x",
    firstAuthor: true,
    if: "1.9",
    quartile: "Q2",
    citations: 2,
    tags: ["public diplomacy", "youth", "Israel"],
  },
  {
    id: "celiac-camps-2025",
    type: "article",
    year: 2025,
    title:
      "How to make gluten-free friends: A quasi-experimental study on the psychosocial benefits of celiac camps",
    authors: "Shani, M. & Böttcher, M.",
    venue: "British Journal of Health Psychology, 30(4), e70027",
    doi: "10.1111/bjhp.70027",
    firstAuthor: true,
    studentCoauthor: true,
    if: "2.5",
    quartile: "Q1",
    tags: ["celiac", "health", "camps"],
    highlight: true,
  },
  {
    id: "long-covid-2025",
    type: "article",
    year: 2025,
    title:
      "Coping with long-COVID stigma: The role of self-compassion and self-coldness",
    authors: "Shani, M. & Wübbelt, K.",
    venue: "Health Psychology Open, 12",
    doi: "10.1177/20551029251349409",
    firstAuthor: true,
    studentCoauthor: true,
    if: "1.3",
    quartile: "Q2",
    citations: 2,
    tags: ["stigma", "health", "coping"],
  },
  {
    id: "cyberbullying-2025",
    type: "article",
    year: 2025,
    title:
      "Differential effects of friendship and school norms on adolescents’ defending in cyberbullying situations: A randomized school-based experiment",
    authors: "Richters, S., Shani, M., Geyer, L., & van Zalk, M. H. W.",
    venue: "Journal of Youth and Adolescence, 54(7), 1677–1692",
    doi: "10.1007/s10964-025-02202-y",
    if: "3.6",
    quartile: "Q1",
    citations: 1,
    tags: ["youth", "norms", "cyberbullying"],
  },
  {
    id: "social-inclusion-2025",
    type: "article",
    year: 2025,
    title:
      "Longitudinal associations between perceived inclusivity norms and opinion polarization in adolescence",
    authors:
      "Shani, M., Berns, M., Bergen, L., Richters, S., Krämer, K., de Lede, S., & van Zalk, M.",
    venue: "Social Inclusion, 13, Article 10122",
    doi: "10.17645/si.10122",
    firstAuthor: true,
    studentCoauthor: true,
    if: "1.2",
    quartile: "Q2",
    citations: 1,
    tags: ["inclusivity", "polarization", "adolescence"],
    highlight: true,
  },
  {
    id: "gpir-2025",
    type: "article",
    year: 2025,
    title:
      "Revisiting constructive disruption: Protest tactics, resistant bystanders, and the limits of support in issue-based social movements",
    authors: "Shani, M., Lobenhofer, D., & van Zalk, M.",
    venue: "Group Processes & Intergroup Relations, 28(6), 1235–1262",
    doi: "10.1177/13684302251322760",
    firstAuthor: true,
    studentCoauthor: true,
    if: "2.3",
    quartile: "Q1",
    citations: 2,
    tags: ["collective action", "protest"],
  },
  {
    id: "bleed-2025",
    type: "article",
    year: 2025,
    title:
      "“If you prick us, do we not bleed?” Antisemitism and psychosocial health among Jews in Germany",
    authors: "Shani, M., Goldberg, D., & van Zalk, M. H.",
    venue: "Frontiers in Psychology, 15, 1499295",
    doi: "10.3389/fpsyg.2024.1499295",
    firstAuthor: true,
    studentCoauthor: true,
    if: "2.9",
    quartile: "Q1",
    citations: 17,
    tags: ["antisemitism", "mental health", "Germany"],
    highlight: true,
  },
  {
    id: "education-oct7-2025",
    type: "chapter",
    year: 2025,
    title:
      "Collective trauma, resilience, and Jewish education: How German Jews navigate life after October 7",
    authors: "Shani, M., Gerber, J., & Herb, M.",
    venue:
      "In M. Reingold (Ed.), Education after October 7 (pp. 63–88). Academic Studies Press",
    doi: "10.1515/9798897830701-005",
    firstAuthor: true,
    studentCoauthor: true,
    tags: ["antisemitism", "education", "resilience"],
  },
  {
    id: "ibd-2024",
    type: "article",
    year: 2024,
    title:
      "Flourishing in life in patients with Inflammatory Bowel Disease: The role of illness identity and health-related quality of life",
    authors: "Shani, M. & Krömeke, A.",
    venue: "Journal of Health Psychology, 30(5), 1089–1103",
    doi: "10.1177/13591053241260288",
    firstAuthor: true,
    studentCoauthor: true,
    sharedFirst: true,
    if: "2.2",
    quartile: "Q2",
    citations: 6,
    tags: ["IBD", "illness identity", "health"],
  },
  {
    id: "love-gluten-2024",
    type: "article",
    year: 2024,
    title:
      "Love beyond gluten: Self-esteem, illness identity, and social support in romantic rejection concerns among adolescents with celiac disease",
    authors: "Shani, M. & van Zalk, M.",
    venue: "Frontiers in Psychology",
    doi: "10.3389/fpsyg.2024.1335201",
    firstAuthor: true,
    if: "2.9",
    quartile: "Q1",
    citations: 8,
    tags: ["celiac", "adolescence", "identity"],
  },
  {
    id: "hope-conflict-2024",
    type: "article",
    year: 2024,
    title:
      "Between victory and peace: Unravelling the paradox of hope in intractable conflicts",
    authors:
      "Shani, M., Kunst, J. R., Anjum, G., Obaidi, M., Leshem, O. A., Antonovsky, R., van Zalk, M., & Halperin, E.",
    venue: "British Journal of Social Psychology, 63(3), 1357–1384",
    doi: "10.1111/bjso.12722",
    firstAuthor: true,
    if: "3.0",
    quartile: "Q1",
    citations: 12,
    tags: ["hope", "conflict", "Israel"],
    highlight: true,
  },
  {
    id: "nature-comms-2024",
    type: "article",
    year: 2024,
    title: "Psychological well-being in Europe after the outbreak of war in Ukraine",
    authors: "Scharbert, J., Humberg, S., Kroencke, L., … Shani, M., … & Back, M. D.",
    venue: "Nature Communications, 15(1), 1202",
    if: "15.7",
    quartile: "Q1",
    citations: 89,
    tags: ["well-being", "crisis", "Europe"],
    highlight: true,
  },
  {
    id: "together-tolerance-2023",
    type: "article",
    year: 2023,
    title:
      "A social network intervention to improve adolescents’ intergroup tolerance via norms of equality-based respect: The “Together for Tolerance” feasibility study",
    authors:
      "Shani, M., de Lede, S., Richters, S., Kleuker, M., Middendorf, W., Liedtke, J., Witolla, S., & van Zalk, M.",
    venue: "International Journal of Developmental Sciences, 17(1–3), 93–110",
    doi: "10.3233/DEV-230342",
    firstAuthor: true,
    if: "0.6",
    quartile: "Q2",
    citations: 14,
    tags: ["intervention", "tolerance", "youth"],
    highlight: true,
  },
  {
    id: "coco-2023",
    type: "article",
    year: 2023,
    title:
      "A global experience-sampling method study of well-being during times of crisis: The CoCo project",
    authors: "Scharbert, J., Reiter, T., Sakel, S., … Shani, M., … & Back, M. D.",
    venue: "Social and Personality Psychology Compass, 17(10)",
    doi: "10.1111/spc3.12813",
    if: "2.8",
    quartile: "Q2",
    citations: 18,
    tags: ["well-being", "methods"],
  },
  {
    id: "celiac-2022",
    type: "article",
    year: 2022,
    title:
      "The potential benefits of camps for children and adolescents with celiac disease on social support, illness acceptance, and health-related quality of life",
    authors: "Shani, M., Kraft, L., Müller, M., & Boehnke, K.",
    venue: "Journal of Health Psychology, 27(7), 1635–1645",
    doi: "10.1177/1359105320968142",
    firstAuthor: true,
    if: "2.2",
    quartile: "Q2",
    citations: 23,
    tags: ["celiac", "camps", "youth"],
  },
  {
    id: "cdqol-2021",
    type: "article",
    year: 2021,
    title:
      "Structural validation and dyadic child-parent measurement invariance of the celiac disease quality of life questionnaire",
    authors: "Meyer, S., & Shani, M.",
    venue: "European Journal of Gastroenterology & Hepatology, 34(1), 39–47",
    doi: "10.1097/MEG.0000000000002051",
    sharedFirst: true,
    if: "1.8",
    quartile: "Q2",
    citations: 10,
    tags: ["celiac", "measurement"],
  },
  {
    id: "covidistress-2021",
    type: "article",
    year: 2021,
    title:
      "Stress and worry in the 2020 coronavirus pandemic: Relationships to trust and compliance with preventive measures across 48 countries",
    authors: "Lieberoth, A., Lin, S. Y., Stöckli, S., … Shani, M., … & Dubrov, D.",
    venue: "Royal Society Open Science, 8(2), 200589",
    if: "2.9",
    quartile: "Q1",
    citations: 184,
    tags: ["COVID-19", "global", "compliance"],
    highlight: true,
  },
  {
    id: "scientific-data-2021",
    type: "article",
    year: 2021,
    title:
      "COVIDiSTRESS Global Survey dataset on psychological and behavioural consequences of the COVID-19 outbreak",
    authors: "Yamada, Y., Ćepulić, D. B., Coll-Martín, T., … Shani, M., … & Lieberoth, A.",
    venue: "Scientific Data, 8(1), 1–23",
    if: "6.9",
    quartile: "Q1",
    citations: 161,
    tags: ["COVID-19", "open data"],
  },
  {
    id: "abraham-2019",
    type: "article",
    year: 2019,
    title:
      "Can Abraham bring peace? The relationship between acknowledging shared religious roots and intergroup conflict",
    authors: "Kunst, J. R., Kimel, S. Y., Shani, M., Alayan, R., & Thomsen, L.",
    venue: "Psychology of Religion and Spirituality, 11(4), 417–432",
    if: "2.2",
    quartile: "Q2",
    citations: 26,
    tags: ["religion", "conflict"],
  },
  {
    id: "fusion-2018",
    type: "article",
    year: 2018,
    title:
      "Engaging in extreme activism in support of others’ political struggles: The role of politically motivated fusion with out-groups",
    authors: "Kunst, J. R., Boos, B., Kimel, S. Y., Obaidi, M., Shani, M., & Thomsen, L.",
    venue: "PLOS ONE, 13(1), e0190639",
    doi: "10.1371/journal.pone.0190639",
    if: "2.6",
    quartile: "Q1",
    citations: 116,
    tags: ["activism", "identity fusion"],
  },
  {
    id: "deep-sea-2018",
    type: "article",
    year: 2018,
    title:
      "Deep-sea mining: Interdisciplinary research on potential environmental, legal, economic, and societal implications",
    authors: "Koschinsky, A., Heinrich, L., Boehnke, K., … Shani, M., … & Werner, W.",
    venue: "Integrated Environmental Assessment and Management, 14(6), 672–691",
    if: "8.4",
    quartile: "Q2",
    citations: 149,
    tags: ["interdisciplinary"],
  },
  {
    id: "mixed-model-2017",
    type: "article",
    year: 2017,
    title:
      "The effect of Jewish–Palestinian mixed-model encounters on readiness for contact and policy support",
    authors: "Shani, M. & Boehnke, K.",
    venue: "Peace and Conflict: Journal of Peace Psychology, 23(3), 219–227",
    firstAuthor: true,
    if: "1.5",
    quartile: "Q2",
    citations: 35,
    tags: ["contact", "Israel", "peace"],
    highlight: true,
  },
  {
    id: "oct7-report-2024",
    type: "report",
    year: 2024,
    title:
      "October 7, One Year Later: Resilience and Coping Among Jews in Germany Amid Rising Antisemitism and Collective Trauma",
    authors: "Shani, M., Gerber, J., & Herb, M.",
    venue: "Osnabrück University",
    firstAuthor: true,
    studentCoauthor: true,
    citations: 4,
    tags: ["antisemitism", "resilience", "report"],
  },
];

export const underReview = [
  {
    title:
      "Antisemitism as a boundary condition: How prejudice moderates the relationship between criticism of Israel and support for boycott versus engagement",
    authors: "Shani, M. & Vopel, S.",
    venue: "Scientific Reports",
  },
  {
    title:
      "Identifying adaptive and maladaptive coping with direct and vicarious antisemitism among Jews in Germany",
    authors: "Shani, M. & Goldberg, D.",
    venue: "Cultural Diversity & Ethnic Minority Psychology",
  },
  {
    title:
      "Arming the citizenry: Psychopolitical predictors of support for civilian firearm possession in Israel’s post-October 7th context",
    authors:
      "Ne’eman-Haviv, V., Shani, M., Stern, N., Shviro, N., Ben Shalom, U., Hakimi, I., & Nagar, G.",
    venue: "Current Psychology",
  },
  {
    title:
      "Profiles of licensed gun owners in Israel following the October 7 attacks: A latent profile analysis across two independent samples",
    authors: "Shani, M., Ne’eman-Haviv, V., & Ben Shalom, U.",
    venue: "Submitted",
  },
];

export function publicationYears(pubs: Publication[] = publications) {
  return [...new Set(pubs.map((p) => p.year))].sort((a, b) => b - a);
}

export function doiUrl(doi: string) {
  return `https://doi.org/${doi}`;
}
