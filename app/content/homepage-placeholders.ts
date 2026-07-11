/**
 * PLACEHOLDER CONTENT — every block below is a stand-in that content
 * authors will replace in Strapi (via Hub Studio). Each constant notes
 * its CMS home. The homepage uses these ONLY when the CMS source is
 * missing/empty, so entering real content flips a section live with no
 * code change:
 *
 *   HOMEPAGE_COPY   → pages collection, slug `hub-home` (hero, welcome,
 *                     section intros, topics)
 *   PLACEHOLDER_CENTERS  → centers collection (currently seeded — live
 *                     data wins when present)
 *   PLACEHOLDER_PROJECTS → projects collection (same)
 *
 * Once hub-home is authored, consider removing the fallbacks entirely so
 * a CMS outage fails the build instead of shipping placeholder copy.
 */
import type { Center, Project } from '../types/content'

export const HOMEPAGE_COPY = {
  hero: {
    title: 'ICJIA\'s Research Hub',
    lede:
      'The Research & Analysis Unit delivers impartial, rigorous, and accessible criminal justice research — publications, datasets, and interactive dashboards that inform policy and practice across Illinois.',
  },
  welcome: {
    title: 'Research and Analysis Unit',
    subtitle: 'Quality criminal justice research and analytics',
    body:
      'Welcome to the Research & Analysis (R&A) Unit of the Illinois Criminal Justice Information Authority (ICJIA). The unit serves as a hub for data-driven insight into the Illinois criminal justice system: policy-relevant research, rigorous program evaluation, and public data resources. Our work supports practitioners, policymakers, researchers, and communities working to improve justice outcomes across the state.',
  },
  centersIntro:
    'Explore the specialized research centers within the unit. Each center provides a detailed overview of its focus areas, and expands to describe the research it conducts.',
  topics: {
    title: 'Topics in R&A',
    intro:
      'Our research covers a vast array of topics, with the eight areas below comprising the major focus of our published work and datasets.',
    focusAreas: [
      'Violence Prevention',
      'Victim Services',
      'Corrections & Reentry',
      'Behavioral Health & Justice',
      'Juvenile Justice',
      'Policing & Deflection',
      'Criminal History Records',
      'Program Evaluation',
    ],
  },
  projectsIntro:
    'These are five examples of ICJIA that focus on different areas of the criminal justice system. Click the tiles to get an overview of the projects and their approach.',
} as const

/** Fallback centers — the centers collection replaces these when populated. */
export const PLACEHOLDER_CENTERS: Center[] = [
  {
    documentId: 'placeholder-cjre',
    title: 'Center for Justice Research and Evaluation',
    description:
      'Conducts criminal justice research and program evaluation, including studies of courts, corrections, policing, and reentry, to build evidence for what works in Illinois.',
  },
  {
    documentId: 'placeholder-cvs',
    title: 'Center for Victim Studies',
    description:
      'Studies the experiences and needs of crime victims and evaluates victim service programs to strengthen support systems across the state.',
  },
  {
    documentId: 'placeholder-cvpir',
    title: 'Center for Violence Prevention and Intervention Research',
    description:
      'Examines violence prevention and intervention strategies, supporting community-based programs with research and evaluation.',
  },
  {
    documentId: 'placeholder-csrpd',
    title: 'Center for Sponsored Research and Program Development',
    description:
      'Coordinates externally funded research initiatives and develops new research programs in partnership with state and federal agencies.',
  },
  {
    documentId: 'placeholder-ccjda',
    title: 'Center for Criminal Justice Data and Analytics',
    description:
      'Collects, analyzes, and disseminates crime and risk-factor statistics for strategic planning, policy decisions, and public education, including criminal history record information for research.',
  },
  {
    documentId: 'placeholder-cccr',
    title: 'Center for Community Corrections Research',
    description:
      'Conducts research on probation, parole, and other community-based corrections programs and their outcomes in Illinois.',
  },
]

/** Fallback projects — the projects collection replaces these when populated. */
export const PLACEHOLDER_PROJECTS: Project[] = [
  {
    documentId: 'placeholder-justice-counts',
    slug: 'justice-counts',
    title: 'Justice Counts Implementation Program',
    category: 'Justice Counts',
    body: '',
    description:
      'ICJIA leads Illinois\'s participation in Justice Counts, a national initiative to modernize criminal justice metrics across agencies so that decision-making draws on timely, consistent data.',
    authors: [],
    bullets: ['Infrastructure Development', 'Cross-Agency Metrics', 'Data-Informed Policy'],
    order: 1,
  },
  {
    documentId: 'placeholder-r3',
    slug: 'restore-reinvest-renew',
    title: 'Restore, Reinvest, Renew (R3)',
    category: 'R3',
    body: '',
    description:
      'The R3 program reinvests cannabis tax revenue in communities harmed by violence, excessive incarceration, and economic disinvestment — with ICJIA research supporting planning and evaluation.',
    authors: [],
    bullets: ['Community Reinvestment', 'Grantee Evaluation', 'Equity Analysis'],
    order: 2,
  },
  {
    documentId: 'placeholder-dicra',
    slug: 'deaths-in-custody',
    title: 'Deaths in Custody Reporting',
    category: 'DICRA',
    body: '',
    description:
      'ICJIA collects and reports data on deaths in custody under the Death in Custody Reporting Act, publishing annual analyses and a public dashboard.',
    authors: [],
    bullets: ['Statewide Data Collection', 'Annual Reporting', 'Public Dashboard'],
    order: 3,
  },
]
