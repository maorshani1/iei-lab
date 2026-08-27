export type Person = {
  id: string;
  name: string;
  role: string;
  program?: string;
  focus?: string;
  status: "pi" | "active" | "alumni" | "collaborator";
  thesis?: string;
  note?: string;
};

export const people: Person[] = [
  {
    id: "maor-shani",
    name: "Dr. Maor Shani",
    role: "Lab Director · Senior Lecturer",
    program: "Department of Psychology, Ariel University",
    focus:
      "Intergroup conflict, antisemitism & discrimination, health psychology, youth interventions",
    status: "pi",
  },
  {
    id: "roy-russo",
    name: "Roy Russo",
    role: "Master’s student (thesis)",
    program: "Clinical Psychology, Ariel University",
    focus: "Political psychology of antisemitism",
    thesis:
      "The ‘Contrarian–Conspiracist Antisemitism’ Model: Explaining the rise of antisemitism on the far right",
    status: "active",
  },
  {
    id: "eden-silne",
    name: "Eden Silne",
    role: "Master’s student (thesis)",
    program: "Clinical Psychology, Ariel University",
    focus: "Shared traumatic reality & mental health professionals",
    thesis:
      "Professional and personal consequences of working within a Shared Traumatic Reality following October 7",
    status: "active",
  },
  {
    id: "shachar-bitton",
    name: "Shachar Bitton",
    role: "Master’s student (thesis)",
    program: "Clinical Psychology, Ariel University",
    focus: "Secondary traumatic stress in therapists",
    thesis:
      "Spillover and crossover effects following secondary traumatic stress among Israeli therapists and their partners",
    status: "active",
  },
  {
    id: "amit-lavie",
    name: "Amit Lavie",
    role: "Master’s student (thesis)",
    program: "Organizational Psychology, Ariel University",
    focus: "Workplace discrimination",
    thesis:
      "Perceived antisemitic discrimination among Israelis in organizational / work environments",
    note: "Co-supervised with Prof. Abira Reizer",
    status: "active",
  },
  {
    id: "thomas-grabiak",
    name: "Thomas Grabiak",
    role: "External supervisee (B.Sc.)",
    program: "Psychology, Osnabrück University",
    thesis:
      "The relationship between antisemitism and psychological health: Meta-analysis and systematic review",
    status: "active",
  },
  {
    id: "andrea-ormaza",
    name: "Andrea Ormaza",
    role: "External supervisee (M.Sc.)",
    program: "Intercultural Psychology, Osnabrück University",
    thesis:
      "Longitudinal relationship between intersectional discrimination and well-being among adolescents in Germany",
    status: "active",
  },
];

export const alumniHighlights = [
  {
    name: "Laura Stritzke",
    year: "2024",
    degree: "M.Sc. Clinical Psychology",
    note: "Gert-Sommer Prize, German Peace Psychology Forum",
    outcome: "Forthcoming book chapter: Shani & Stritzke (2026)",
  },
  {
    name: "Daniel Lobenhofer",
    year: "2021",
    degree: "M.Sc. Clinical Psychology",
    note: "Best Paper Prize, Association of Psychologists in Osnabrück",
    outcome: "Published: Shani, Lobenhofer & van Zalk (2025), GPIR",
  },
  {
    name: "Dana Goldberg",
    year: "2022",
    degree: "B.Sc. Psychology",
    note: "Thesis on antisemitism and well-being",
    outcome: "Published: Shani, Goldberg & van Zalk (2025), Frontiers",
  },
  {
    name: "Marie Herb & Jana Gerber",
    year: "2025",
    degree: "B.Sc. Psychology",
    note: "Qualitative work on Jewish life after October 7",
    outcome: "Two book chapters (2025, 2026 forthcoming)",
  },
  {
    name: "Kilian Wübbelt",
    year: "2024",
    degree: "M.Sc. Clinical Psychology",
    note: "Long-COVID stigma and self-compassion",
    outcome: "Published: Shani & Wübbelt (2025)",
  },
  {
    name: "Antonia Krömeke",
    year: "2023",
    degree: "M.Sc. Clinical Psychology",
    note: "IBD, illness identity, flourishing",
    outcome: "Published: Shani & Krömeke (2024)",
  },
];

export const collaborators = [
  {
    name: "Prof. Maarten van Zalk",
    org: "Osnabrück University",
    area: "INCLUSIVITY project · adolescent networks",
  },
  {
    name: "Prof. Eran Halperin",
    org: "Hebrew University of Jerusalem",
    area: "Intergroup conflict · hope",
  },
  {
    name: "Prof. Klaus Boehnke",
    org: "Constructor University / BIGSSS",
    area: "Political socialization · peace psychology",
  },
  {
    name: "Prof. Abira Reizer",
    org: "Ariel University",
    area: "Organizational psychology · thesis co-supervision",
  },
  {
    name: "Prof. Uzi Ben Shalom & Dr. Vered Ne’eman-Haviv",
    org: "Ariel University",
    area: "Civilian firearm decision-making project",
  },
  {
    name: "London Centre for the Study of Contemporary Antisemitism",
    org: "Research fellowship network",
    area: "Contemporary antisemitism studies",
  },
];
