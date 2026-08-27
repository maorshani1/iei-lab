export type BlogPost = {
  slug: string;
  title: string;
  date: string;
  author: string;
  excerpt: string;
  tags: string[];
  body: string[];
};

export const blogPosts: BlogPost[] = [
  {
    slug: "welcome-iei-lab",
    title: "Welcome to the Intergroup Experiences and Identity Lab",
    date: "2026-08-01",
    author: "Dr. Maor Shani",
    excerpt:
      "A short note on why this lab exists, what we study, and how students, collaborators, and participants can get involved as we open at Ariel University.",
    tags: ["lab news", "welcome"],
    body: [
      "In October 2026, the Intergroup Experiences and Identity Lab opens at the Department of Psychology, Ariel University. Our mission is simple to state and demanding to pursue: produce rigorous, ethically grounded evidence on how people experience intergroup life—and how those experiences shape identity, health, and the possibility of coexistence.",
      "The lab’s three pillars—conflict and reconciliation; antisemitism, racism, and discrimination; and health psychology in chronic conditions—are not separate silos. They share a commitment to centering lived experience, measuring carefully, and translating findings for educators, clinicians, and the public.",
      "This website will grow with the lab: publications, current studies you can join, openings for students, and a blog for research notes and public scholarship. If you are a prospective student, collaborator, journalist, or community partner, I hope you will reach out.",
      "— Maor",
    ],
  },
  {
    slug: "antisemitism-accommodation",
    title: "What is “antisemitism accommodation”?",
    date: "2026-07-15",
    author: "Dr. Maor Shani",
    excerpt:
      "A research brief on institutional decisions that marginalize Jews or Israelis not from personal animus, but to appease hostile third parties.",
    tags: ["antisemitism", "methods", "theory"],
    body: [
      "Much research on prejudice focuses on biased individuals. Yet after October 7, many of the most consequential harms reported by Jews and Israelis in universities, workplaces, and cultural institutions did not look like classic personal bigotry. They looked like avoidance, silence, double standards, and “neutral” procedures applied unevenly.",
      "I use the term antisemitism accommodation for decisions that enable anti-Jewish marginalization in order to reduce conflict with third parties perceived as more threatening or more costly to confront. The mechanism is political and social, not merely attitudinal—and it can be studied experimentally from offender, bystander, and victim perspectives.",
      "Our lab is developing paradigms that distinguish accommodation from both principled policy disagreement and classic antisemitic intent. Early findings and talks (including the ISCA Early Career Speaker Series at Indiana University) will feed into papers presented at the Contemporary Antisemitism 2026 Conference in Haifa.",
      "If your organization is grappling with hostile-environment dynamics, or if you are a student interested in experimental social psychology of discrimination, this line of work is open for collaboration.",
    ],
  },
  {
    slug: "together-for-tolerance",
    title: "Together for Tolerance: seeding inclusivity norms in schools",
    date: "2026-06-10",
    author: "Dr. Maor Shani",
    excerpt:
      "Lessons from a social-network intervention designed to improve adolescents’ intergroup tolerance via equality-based respect.",
    tags: ["youth", "intervention", "INCLUSIVITY"],
    body: [
      "Adolescents do not only learn attitudes from curricula; they learn them from peers. The “Together for Tolerance” feasibility work, embedded in the broader Volkswagen Foundation INCLUSIVITY program, asked whether identifying social referents and seeding norms of equality-based respect can shift intergroup tolerance in diverse German schools.",
      "The intervention approach sits at the intersection of developmental psychology, network science, and political psychology. Follow-up papers now link perceived inclusivity norms to opinion polarization over time, and related school experiments examine defending behavior in cyberbullying contexts.",
      "For practitioners: the takeaway is not a single “magic workshop,” but a design principle—norms travel through real social structure. For researchers: multi-level, multi-wave designs with clear theoretical mediators remain essential if we want interventions that outlast a single semester.",
    ],
  },
];

export function getPost(slug: string) {
  return blogPosts.find((p) => p.slug === slug);
}
