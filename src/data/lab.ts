export const lab = {
  name: "Intergroup Experiences and Identity Lab",
  shortName: "IEI Lab",
  tagline:
    "Empirical research on intergroup conflict, identity, discrimination, and well-being.",
  university: "Ariel University",
  department: "Department of Psychology",
  location: "Ariel, Israel",
  foundedNote: "Established October 2026",
  email: "maorsha@ariel.ac.il",
  emails: ["maorsha@ariel.ac.il", "maor.shani@uos.de"],
  phones: {
    israel: "+972 52 5225996",
    germany: "+49 1573 7967296",
  },
  scholar: "https://scholar.google.com/citations?user=J0Zm7EwAAAAJ&hl=en",
  researchGate: "https://www.researchgate.net/profile/Maor-Shani",
  metrics: {
    hIndex: 12,
    i10: 13,
    citations: 917,
  },
  synopsis:
    "The IEI Lab investigates the dynamics of social identity, intergroup relations, and well-being across three interconnected foci: conflict and reconciliation; antisemitism, racism, and discrimination; and health psychology in chronic conditions. We combine rigorous quantitative and qualitative methods—from SEM and social network analysis to qualitative interviews—to produce evidence that informs theory, education, and public policy.",
  foci: [
    {
      id: "conflict",
      title: "Intergroup Conflict & Reconciliation",
      summary:
        "Psychological processes underlying conflict, prejudice, and interventions that foster coexistence and tolerance—especially among youth.",
      topics: [
        "Contact and coexistence orientation",
        "Inclusivity norms and polarization",
        "Hope, collective action, and peace",
        "School-based social network interventions",
      ],
    },
    {
      id: "discrimination",
      title: "Antisemitism, Racism & Discrimination",
      summary:
        "Mechanisms and psychosocial impacts of contemporary antisemitism and other forms of discrimination, centering target-group perspectives.",
      topics: [
        "Antisemitism and mental health",
        "Antisemitism accommodation",
        "Criticism of Israel vs. prejudice",
        "Coping, resilience, and identity",
      ],
    },
    {
      id: "health",
      title: "Health Psychology & Chronic Conditions",
      summary:
        "Illness identity, social support, and quality of life for people navigating chronic conditions such as celiac disease and IBD.",
      topics: [
        "Celiac camps and peer support",
        "Illness identity and flourishing",
        "Stigma and self-compassion",
        "Dyadic child–parent measurement",
      ],
    },
  ],
} as const;

export const pi = {
  name: "Dr. Maor Shani",
  title: "Senior Lecturer",
  role: "Lab Director / Principal Investigator",
  department: "Department of Psychology, Ariel University",
  startDate: "October 2026",
  bio: `Dr. Maor Shani is a social and political psychologist whose research program investigates intergroup conflict and reconciliation, contemporary antisemitism and discrimination, and health psychology in chronic illness. He joins Ariel University as Senior Lecturer in the Department of Psychology in October 2026, where he directs the Intergroup Experiences and Identity Lab.

His work combines advanced quantitative methods (SEM, multilevel and latent profile analysis, social network analysis) with qualitative approaches. Recent projects include longitudinal studies of inclusivity norms and adolescent polarization in Europe (Volkswagen Foundation INCLUSIVITY project), multi-method research on the psychosocial toll of antisemitism on Jews in Germany after October 7, and experimental work on “antisemitism accommodation”—how institutions enable prejudice to appease hostile third parties.

Dr. Shani holds a PhD in Psychology (with distinction) from BIGSSS / Bremen, an MA from Jacobs University Bremen, and a BA summa cum laude from the Hebrew University of Jerusalem. He previously served as post-doctoral researcher at Osnabrück University and at the Hebrew University’s PICR Lab with Prof. Eran Halperin.`,
  shortBio:
    "Social psychologist studying intergroup conflict, antisemitism and discrimination, and well-being in chronic conditions. Senior Lecturer at Ariel University from October 2026.",
  affiliations: [
    {
      role: "Senior Lecturer & Lab Director",
      org: "Department of Psychology, Ariel University",
      period: "from Oct 2026",
    },
    {
      role: "Research Fellow",
      org: "London Centre for the Study of Contemporary Antisemitism",
      period: "2025–present",
    },
    {
      role: "Research Adviser",
      org: "Center for Mental Health, Medical Corps, IDF",
      period: "2025–present",
    },
    {
      role: "Post-doctoral Researcher",
      org: "Osnabrück University (Developmental Psychology)",
      period: "2020–2025",
    },
  ],
  education: [
    {
      degree: "PhD in Psychology",
      place: "BIGSSS, Bremen, Germany",
      detail: "Defended with distinction. Advisor: Prof. Dr. Klaus Boehnke.",
      years: "2009–2016",
    },
    {
      degree: "MA in Integrated Social Sciences",
      place: "Jacobs University Bremen",
      detail: "Comparative Politics and Sociology",
      years: "2006–2008",
    },
    {
      degree: "BA in Sociology and Anthropology",
      place: "The Hebrew University of Jerusalem",
      detail: "Summa cum laude",
      years: "2003–2006",
    },
  ],
  methods: [
    "Measurement development & psychometrics",
    "Structural Equation Modeling (SEM)",
    "Multilevel & latent profile analysis",
    "Social network analysis",
    "Quasi-experiments & RCTs",
    "Qualitative interviews & mixed methods",
  ],
  languages: ["Hebrew (native)", "English (fluent)", "German (high proficiency)"],
  teaching: [
    "Statistics for Master Students in Clinical Psychology (Ariel)",
    "Bachelor Seminary: Antisemitism and Trauma (Ariel)",
    "Introduction to Developmental Psychology (Osnabrück)",
    "Intercultural Psychology (Osnabrück)",
    "Migration and Identity (Osnabrück)",
  ],
} as const;
