export type Project = {
  id: string;
  title: string;
  status: "active" | "completed" | "pipeline";
  period: string;
  funding?: string;
  role: string;
  summary: string;
  focus: "conflict" | "discrimination" | "health" | "methods";
  outputs?: string[];
};

export const projects: Project[] = [
  {
    id: "inclusivity",
    title: "INCLUSIVITY: Countering Polarization through Inclusivity Norms",
    status: "active",
    period: "2020–2025+",
    funding: "Volkswagen Stiftung (VW Foundation)",
    role: "Project leader / Co-PI (Leading PI: Prof. Maarten van Zalk)",
    summary:
      "A multi-country program examining how inclusivity norms shape tolerance, contact, and cooperation amid polarization. Includes the school-based “Together for Tolerance” social-network intervention in diverse German schools, longitudinal adolescent surveys, and cross-national evidence from 12 European countries.",
    focus: "conflict",
    outputs: [
      "PNAS Nexus (2026) multi-country norms study",
      "Social Inclusion (2025) longitudinal polarization paper",
      "International Journal of Developmental Sciences (2023) feasibility study",
      "Journal of Youth and Adolescence (2025) cyberbullying norms RCT",
    ],
  },
  {
    id: "antisemitism-health",
    title: "Antisemitism, Collective Trauma, and Psychosocial Health",
    status: "active",
    period: "2022–present",
    role: "PI",
    summary:
      "Multi-method research documenting the prevalence and mental-health correlates of antisemitism among Jews in Germany—before and after October 7—and adaptive versus maladaptive coping. Extends to qualitative network analyses of social support disruption and resilience pedagogies with Jewish educators (Project Ma’aneh).",
    focus: "discrimination",
    outputs: [
      "Frontiers in Psychology (2025): “If you prick us, do we not bleed?”",
      "Education after October 7 book chapter (2025)",
      "Scientific report: October 7, One Year Later (2024)",
      "Handbook of Antisemitism Studies chapter (forthcoming 2026)",
    ],
  },
  {
    id: "accommodation",
    title: "Antisemitism Accommodation & Anti-Zionist Litmus Tests",
    status: "active",
    period: "2025–present",
    role: "PI",
    summary:
      "Experimental and conceptual work on how institutions and bystanders enable anti-Jewish discrimination when it is framed as political neutrality—and how “litmus tests” silence Jews and allies in progressive and workplace settings. Includes studies from offender, bystander, and victim perspectives.",
    focus: "discrimination",
    outputs: [
      "Early Career Speaker Series, Indiana University (2025)",
      "Contemporary Antisemitism 2026 Conference (Haifa)",
      "Collaborative work with Czech and Israeli partners on workplace silencing",
    ],
  },
  {
    id: "boycott-boundary",
    title: "Criticism of Israel, Antisemitism, and Support for Boycott vs. Engagement",
    status: "active",
    period: "2024–present",
    role: "PI",
    summary:
      "Longitudinal and multi-wave studies testing when criticism of Israeli policy predicts constructive engagement versus punitive boycotts—and whether antisemitism operates as a critical boundary condition for that pathway.",
    focus: "discrimination",
    outputs: [
      "Manuscript under review at Scientific Reports (with S. Vopel)",
    ],
  },
  {
    id: "gun-culture",
    title: "Civilian Firearm Decision-Making after October 7",
    status: "active",
    period: "2025–present",
    funding: "Israeli Ministry of Innovation, Science & Technology (~500,000 NIS)",
    role: "Co-PI (Leading PI: Prof. Uzi Ben Shalom)",
    summary:
      "“Stop or I’ll Shoot”: a systematic examination of civilian firearm decision-making in Israel’s post-October 7 context—including latent profiles of licensed gun owners and psychopolitical predictors of support for civilian armament and lethal force legitimacy.",
    focus: "methods",
    outputs: [
      "Multiple manuscripts under review / in preparation",
    ],
  },
  {
    id: "idf-resilience",
    title: "Mental Resilience & PTSD Prevention (IDF Medical Corps)",
    status: "active",
    period: "2025–present",
    role: "Research Adviser, Center for Mental Health, Medical Corps",
    summary:
      "Applied research on mental resilience and interventions to prevent distress and PTSD among soldiers and reservists, in partnership with the IDF Center for Mental Health.",
    focus: "health",
  },
  {
    id: "celiac-health",
    title: "Illness Identity, Camps, and Quality of Life in Chronic Conditions",
    status: "active",
    period: "2018–present",
    role: "PI",
    summary:
      "A sustained health-psychology program on celiac disease and IBD: camps and peer support for youth, illness identity and flourishing, romantic rejection concerns, dyadic parent–child measurement, and scientific advising to celiac societies in Israel, Germany, and Switzerland.",
    focus: "health",
    outputs: [
      "British Journal of Health Psychology (2025) celiac camps quasi-experiment",
      "Journal of Health Psychology papers (2022, 2024)",
      "Frontiers in Psychology (2024) romantic rejection concerns",
    ],
  },
  {
    id: "hope-conflict",
    title: "The Paradox of Hope in Intractable Conflict",
    status: "completed",
    period: "2019–2024",
    role: "PI / lead author",
    summary:
      "With collaborators including Eran Halperin and Jonas Kunst, this line of work shows how group-based hope for victory can both energize and obstruct pathways to peace—with implications for resilience and war attitudes after October 7.",
    focus: "conflict",
    outputs: [
      "British Journal of Social Psychology (2024)",
      "AIS conference presentation (2024)",
    ],
  },
];

export const methodsHighlights = [
  {
    title: "Social network interventions",
    text: "Identifying influential students and seeding equality-based respect norms in schools.",
  },
  {
    title: "Longitudinal & multi-country designs",
    text: "Adolescent panels in Germany; inclusivity-norm evidence across 12 European countries.",
  },
  {
    title: "Experiments & quasi-experiments",
    text: "Protest tactics, school RCTs, celiac-camp evaluations, accommodation paradigms.",
  },
  {
    title: "Measurement science",
    text: "Scale development, SEM, dyadic invariance, latent profile analysis.",
  },
];
