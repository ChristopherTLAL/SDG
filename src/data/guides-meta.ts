// src/data/guides-meta.ts — Knowledge Base article metadata
// Each article's full content lives in src/data/guides/{slug}.ts

export interface GuideMeta {
  slug: string;
  title: string;
  description: string;
  category: string;
  icon: string;
  readingTime: string;
  tags: string[];
  order: number; // for sorting within category
}

export const categories = [
  { id: 'self-discovery', label: 'Self-Discovery & Planning', icon: 'psychology', color: 'bg-amber-50 text-amber-700' },
  { id: 'personal-statement', label: 'Personal Statement & Essays', icon: 'edit_note', color: 'bg-blue-50 text-blue-700' },
  { id: 'academic-profile', label: 'Academic Profile & CV', icon: 'person', color: 'bg-emerald-50 text-emerald-700' },
  { id: 'standardized-tests', label: 'Standardized Tests', icon: 'quiz', color: 'bg-purple-50 text-purple-700' },
  { id: 'university-selection', label: 'University Selection', icon: 'location_city', color: 'bg-rose-50 text-rose-700' },
  { id: 'recommendation', label: 'Recommendation Letters', icon: 'mail', color: 'bg-cyan-50 text-cyan-700' },
  { id: 'graduate-phd', label: 'Graduate & PhD Applications', icon: 'school', color: 'bg-indigo-50 text-indigo-700' },
  { id: 'career', label: 'Career & Professional', icon: 'work', color: 'bg-orange-50 text-orange-700' },
  { id: 'post-admission', label: 'Post-Admission & Practical', icon: 'flight_takeoff', color: 'bg-teal-50 text-teal-700' },
];

export const guides: GuideMeta[] = [
  // ── Self-Discovery & Planning ──────────────────────────
  {
    slug: 'how-to-choose-a-major',
    title: 'How to Choose a Major When You Have No Idea What You Want',
    description: 'A systematic, evidence-based framework for choosing your academic direction — moving beyond salary tables and parental expectations to find genuine alignment.',
    category: 'self-discovery',
    icon: 'route',
    readingTime: '18 min',
    tags: ['undergraduate', 'major selection', 'career planning'],
    order: 1,
  },
  {
    slug: 'self-assessment-framework',
    title: 'Mapping Your Strengths: A Self-Assessment Framework for Students',
    description: 'Structured exercises to identify your core competencies, interests, and values — the foundation of every strong application and career decision.',
    category: 'self-discovery',
    icon: 'psychology',
    readingTime: '15 min',
    tags: ['self-assessment', 'career planning', 'strengths'],
    order: 2,
  },
  {
    slug: 'masters-vs-phd-vs-industry',
    title: 'Master\'s vs PhD vs Industry: A Decision Framework',
    description: 'When should you pursue a master\'s, when a PhD, and when should you go straight into industry? A decision tree based on your goals, not prestige.',
    category: 'self-discovery',
    icon: 'fork_right',
    readingTime: '20 min',
    tags: ['graduate', 'PhD', 'career', 'decision-making'],
    order: 3,
  },
  {
    slug: 'gap-year-strategic-or-risky',
    title: 'Gap Year: Strategic or Risky?',
    description: 'An evidence-based look at when a gap year strengthens your application and when it doesn\'t, with real examples from successful and unsuccessful cases.',
    category: 'self-discovery',
    icon: 'flight_takeoff',
    readingTime: '14 min',
    tags: ['gap year', 'planning', 'application strategy'],
    order: 4,
  },

  // ── Personal Statement & Essays ────────────────────────
  {
    slug: 'ucas-personal-statement',
    title: 'Anatomy of a Winning Personal Statement: UCAS Edition',
    description: 'Line-by-line dissection of what makes UCAS personal statements work, with structural templates and real anonymised examples from successful applicants.',
    category: 'personal-statement',
    icon: 'edit_note',
    readingTime: '25 min',
    tags: ['UCAS', 'UK', 'personal statement', 'undergraduate'],
    order: 1,
  },
  {
    slug: 'statement-of-purpose-graduate',
    title: 'How to Write a Statement of Purpose for Graduate School',
    description: 'The definitive guide to crafting a graduate SOP — from opening hook to research fit, with discipline-specific advice for STEM, humanities, and social sciences.',
    category: 'personal-statement',
    icon: 'description',
    readingTime: '22 min',
    tags: ['SOP', 'graduate', 'master\'s', 'PhD'],
    order: 2,
  },
  {
    slug: 'common-app-essays-decoded',
    title: 'Common App Essays: The 7 Prompts Decoded',
    description: 'What each Common App prompt is really asking, which one suits your story, and how to stand out among 1 million+ applicants.',
    category: 'personal-statement',
    icon: 'auto_stories',
    readingTime: '20 min',
    tags: ['Common App', 'US', 'undergraduate', 'essays'],
    order: 3,
  },
  {
    slug: 'why-this-university-essay',
    title: 'Why This University? How to Write a Compelling "Fit" Essay',
    description: 'The supplemental essay that trips up most applicants. Learn to demonstrate genuine research and authentic connection without sounding generic.',
    category: 'personal-statement',
    icon: 'favorite',
    readingTime: '16 min',
    tags: ['supplemental essays', 'fit', 'university research'],
    order: 4,
  },
  {
    slug: 'personal-statement-mistakes',
    title: 'The 15 Biggest Personal Statement Mistakes (and How to Fix Them)',
    description: 'Admissions officers read thousands of essays. These are the patterns that make them stop reading — and the fixes that keep them engaged.',
    category: 'personal-statement',
    icon: 'error',
    readingTime: '18 min',
    tags: ['personal statement', 'common mistakes', 'editing'],
    order: 5,
  },

  // ── Academic Profile & CV ──────────────────────────────
  {
    slug: 'academic-cv-guide',
    title: 'Building an Academic CV That Gets You Interviews',
    description: 'How to structure a CV for graduate school, postdoc, and faculty positions — what to include, what to cut, and how formatting signals professionalism.',
    category: 'academic-profile',
    icon: 'person',
    readingTime: '16 min',
    tags: ['CV', 'academic', 'graduate', 'postdoc'],
    order: 1,
  },
  {
    slug: 'research-experience-from-zero',
    title: 'How to Build Research Experience When You Have None',
    description: 'A practical roadmap for undergraduates to go from zero research background to a competitive applicant — cold emails, RA positions, and independent projects.',
    category: 'academic-profile',
    icon: 'science',
    readingTime: '20 min',
    tags: ['research', 'undergraduate', 'experience building'],
    order: 2,
  },
  {
    slug: 'extracurriculars-that-matter',
    title: 'Extracurriculars That Actually Matter',
    description: 'Quality over quantity — how admissions officers evaluate your activities list, what "depth" really means, and how to present impact, not just participation.',
    category: 'academic-profile',
    icon: 'emoji_events',
    readingTime: '15 min',
    tags: ['extracurriculars', 'activities', 'leadership'],
    order: 3,
  },
  {
    slug: 'portfolio-guide-art-design',
    title: 'The Portfolio Guide: Art, Design, and Architecture Applications',
    description: 'What top creative programmes actually look for, how to curate 12–20 pieces that tell a coherent story, and platform-specific requirements for RCA, RISD, AA, and more.',
    category: 'academic-profile',
    icon: 'palette',
    readingTime: '22 min',
    tags: ['portfolio', 'art', 'design', 'architecture'],
    order: 4,
  },

  // ── Standardized Tests ─────────────────────────────────
  {
    slug: 'ielts-vs-toefl',
    title: 'IELTS vs TOEFL: Which One and How to Prepare',
    description: 'A detailed comparison of both tests, which universities prefer which, and a 90-day preparation plan for each — with section-by-section strategies.',
    category: 'standardized-tests',
    icon: 'translate',
    readingTime: '22 min',
    tags: ['IELTS', 'TOEFL', 'English proficiency'],
    order: 1,
  },
  {
    slug: 'gre-strategy-guide',
    title: 'GRE Strategy: What Top Programs Actually Care About',
    description: 'Which programmes still require the GRE, what scores actually matter, and a structured study plan that maximises score improvement per hour invested.',
    category: 'standardized-tests',
    icon: 'calculate',
    readingTime: '20 min',
    tags: ['GRE', 'graduate', 'test prep'],
    order: 2,
  },
  {
    slug: 'gmat-preparation-plan',
    title: 'GMAT Focus Edition: A 3-Month Intensive Preparation Plan',
    description: 'Week-by-week breakdown of GMAT prep covering Quantitative, Verbal, and Data Insights — with recommended resources and score prediction benchmarks.',
    category: 'standardized-tests',
    icon: 'trending_up',
    readingTime: '18 min',
    tags: ['GMAT', 'MBA', 'business school'],
    order: 3,
  },

  // ── University Selection ───────────────────────────────
  {
    slug: 'beyond-rankings',
    title: 'Beyond Rankings: How to Actually Choose the Right University',
    description: 'Rankings measure institutional prestige, not personal fit. A multi-dimensional framework for evaluating programmes based on what actually matters to your career.',
    category: 'university-selection',
    icon: 'balance',
    readingTime: '20 min',
    tags: ['university selection', 'rankings', 'fit'],
    order: 1,
  },
  {
    slug: 'researching-graduate-programs',
    title: 'How to Research Graduate Programs Like a Professional',
    description: 'The exact process top applicants use to build a shortlist — from reading faculty publications to decoding placement data and reaching out to current students.',
    category: 'university-selection',
    icon: 'manage_search',
    readingTime: '18 min',
    tags: ['graduate', 'research', 'shortlisting'],
    order: 2,
  },
  {
    slug: 'uk-us-hk-differences',
    title: 'Applying to the UK, US, and Hong Kong: Key Differences',
    description: 'Three systems, three philosophies. A side-by-side comparison of application timelines, requirements, costs, and what each system values most.',
    category: 'university-selection',
    icon: 'public',
    readingTime: '24 min',
    tags: ['UK', 'US', 'Hong Kong', 'comparison'],
    order: 3,
  },
  {
    slug: 'oxbridge-application-demystified',
    title: 'Demystifying the Oxbridge Application',
    description: 'Timeline, admissions tests, interviews, and college selection — a comprehensive guide for international students applying to Oxford and Cambridge.',
    category: 'university-selection',
    icon: 'school',
    readingTime: '28 min',
    tags: ['Oxford', 'Cambridge', 'UK', 'undergraduate'],
    order: 4,
  },

  // ── Recommendation Letters ─────────────────────────────
  {
    slug: 'how-to-ask-for-recommendation',
    title: 'How to Ask for a Strong Recommendation Letter',
    description: 'When to ask, who to ask, and exactly what to provide your recommenders so they can write a letter that actually moves the needle on your application.',
    category: 'recommendation',
    icon: 'mail',
    readingTime: '14 min',
    tags: ['recommendation', 'letters', 'professors'],
    order: 1,
  },
  {
    slug: 'what-recommenders-actually-write',
    title: 'What Professors Actually Write in Recommendation Letters',
    description: 'A behind-the-scenes look at recommendation letter conventions, the coded language admissions committees decode, and why "good student" isn\'t good enough.',
    category: 'recommendation',
    icon: 'visibility',
    readingTime: '16 min',
    tags: ['recommendation', 'behind-the-scenes', 'professors'],
    order: 2,
  },

  // ── Graduate & PhD Applications ────────────────────────
  {
    slug: 'masters-application-complete-guide',
    title: 'The Complete Guide to Master\'s Applications: Timeline and Checklist',
    description: 'A month-by-month roadmap from 18 months before deadlines to enrolment — covering every deliverable, deadline pattern, and decision point.',
    category: 'graduate-phd',
    icon: 'checklist',
    readingTime: '26 min',
    tags: ['master\'s', 'timeline', 'checklist', 'planning'],
    order: 1,
  },
  {
    slug: 'finding-phd-supervisors',
    title: 'How to Find and Contact Potential PhD Supervisors',
    description: 'The cold email that actually gets a response. How to identify the right supervisors, read their work intelligently, and craft a message that starts a conversation.',
    category: 'graduate-phd',
    icon: 'person_search',
    readingTime: '20 min',
    tags: ['PhD', 'supervisor', 'cold email', 'research fit'],
    order: 2,
  },
  {
    slug: 'writing-research-proposal',
    title: 'Writing a Research Proposal That Gets Accepted',
    description: 'Step-by-step guide to structuring a research proposal for PhD and research master\'s applications — from identifying gaps to methodology and feasibility.',
    category: 'graduate-phd',
    icon: 'description',
    readingTime: '24 min',
    tags: ['research proposal', 'PhD', 'methodology'],
    order: 3,
  },
  {
    slug: 'funding-scholarships-guide',
    title: 'Funding Your Studies: Scholarships, Grants, and Assistantships',
    description: 'A comprehensive guide to financing graduate education — from CSC and Chevening to university-specific awards, assistantships, and creative funding strategies.',
    category: 'graduate-phd',
    icon: 'payments',
    readingTime: '22 min',
    tags: ['scholarships', 'funding', 'CSC', 'Chevening', 'assistantships'],
    order: 4,
  },
  {
    slug: 'phd-interview-preparation',
    title: 'The PhD Interview: What to Expect and How to Prepare',
    description: 'From technical deep-dives to "why this lab?" — a field-by-field breakdown of PhD interview formats, common questions, and what panels are really evaluating.',
    category: 'graduate-phd',
    icon: 'record_voice_over',
    readingTime: '20 min',
    tags: ['PhD', 'interview', 'preparation'],
    order: 5,
  },
  {
    slug: 'understanding-the-phd',
    title: 'Understanding the PhD: What It Really Takes',
    description: 'The unvarnished truth about doctoral study — time commitment, mental health, supervisor dynamics, and how to decide if this path is genuinely right for you.',
    category: 'graduate-phd',
    icon: 'psychology_alt',
    readingTime: '22 min',
    tags: ['PhD', 'expectations', 'mental health', 'reality'],
    order: 6,
  },

  // ── Career & Professional ──────────────────────────────
  {
    slug: 'academia-to-industry',
    title: 'From Academia to Industry: Navigating the Transition',
    description: 'How to translate academic skills into industry language, where PhDs are valued most, and the networking strategies that actually lead to offers.',
    category: 'career',
    icon: 'swap_horiz',
    readingTime: '18 min',
    tags: ['career transition', 'industry', 'PhD', 'job search'],
    order: 1,
  },
  {
    slug: 'networking-effectively',
    title: 'How to Network Effectively in Your Field',
    description: 'Networking doesn\'t mean collecting business cards. A practical guide to building genuine professional relationships that advance your career organically.',
    category: 'career',
    icon: 'hub',
    readingTime: '16 min',
    tags: ['networking', 'professional development', 'conferences'],
    order: 2,
  },
  {
    slug: 'internship-strategy',
    title: 'Internship Strategy: How to Get Meaningful Experience',
    description: 'Why most students waste their internships, how to find positions that build real skills, and the application strategies that work in competitive fields.',
    category: 'career',
    icon: 'work_history',
    readingTime: '18 min',
    tags: ['internship', 'experience', 'career development'],
    order: 3,
  },

  // ── Post-Admission & Practical ─────────────────────────
  {
    slug: 'visa-applications-demystified',
    title: 'Visa Applications Demystified: US, UK, HK, and Europe',
    description: 'Step-by-step visa application guides for the four most common destinations — documents, timelines, interviews, and the mistakes that cause rejections.',
    category: 'post-admission',
    icon: 'badge',
    readingTime: '24 min',
    tags: ['visa', 'F-1', 'Tier 4', 'practical'],
    order: 1,
  },
  {
    slug: 'first-semester-survival',
    title: 'Your First Semester Abroad: A Survival Guide',
    description: 'Culture shock, academic adjustment, making friends, and managing finances — honest advice from international students who\'ve been through it.',
    category: 'post-admission',
    icon: 'luggage',
    readingTime: '16 min',
    tags: ['first semester', 'international student', 'adjustment'],
    order: 2,
  },
];

export function getGuidesByCategory(): Map<string, GuideMeta[]> {
  const map = new Map<string, GuideMeta[]>();
  for (const cat of categories) {
    const items = guides.filter(g => g.category === cat.id).sort((a, b) => a.order - b.order);
    if (items.length > 0) map.set(cat.id, items);
  }
  return map;
}

export function getGuideBySlug(slug: string): GuideMeta | undefined {
  return guides.find(g => g.slug === slug);
}

export function getCategoryById(id: string) {
  return categories.find(c => c.id === id);
}
