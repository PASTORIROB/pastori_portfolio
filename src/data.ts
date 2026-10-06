// Edit this file to change the site. Replace the placeholder links before launch.
export const profile = {
  name: 'Rob Pastori',
  title: 'VP, FCRM Data Analytics',
  org: 'Origin Bank',
  location: 'Florida',
  headline: 'I turn banking and market data into decisions.',
  blurb:
    'Twelve-plus years across BNY Mellon–Pershing, Cowen and Convergex, now leading financial crime risk analytics. Lead Financial & Data Analytics Specialist | Python & SQL | Model Risk, Validation & Empirical Performance',
  email: 'rpastori@me.com',
  linkedin: 'https://www.linkedin.com/in/rpastori/',
  github: 'https://github.com/PASTORIROB',
  resume: '/Rob_Pastori_Resume.pdf',
  headshot: '/headshot.jpeg',
};

export const skills = [
  { group: 'Languages & tools', items: ['Python', 'SQL', 'Excel', 'Pandas', 'Pydantic', 'MLflow'] },
  { group: 'Machine learning & AI', items: ['Predictive modeling', 'Leakage-free validation', 'LLM data extraction', 'Conditional-probability models'] },
  { group: 'Big data', items: ['High-volume transaction data', 'Pipelines', 'Alert analytics'] },
  { group: 'Finance & banking', items: ['AML / BSA', 'OFAC automation', 'Threshold tuning', 'Market microstructure', 'Series 7'] },
];

export const projects = [
  {
    title: 'SEC dilution predictor',
    tags: ['Python', 'ML', 'Claude API', 'MLflow'],
    text: 'Watches EDGAR for secondary offerings and predicts post-announcement price impact. Claude and Pydantic extract filing terms, Alpaca labels outcomes, MLflow tracks experiments, and folds are isolated to prevent leakage.',
  },
  {
    title: 'Pairs trading bot',
    tags: ['Python', 'Statistics', 'Alpaca'],
    text: 'Detects spread dislocations with z-scores, estimates hedge ratios by linear regression, and checks borrow availability before trading. Backed by a divergence screener across about 20 curated competitor pairs.',
  },
  {
    title: 'AML alert tuning',
    tags: ['SQL', 'Python', 'Modeling'],
    text: 'Threshold tuning and conditional-probability modeling to cut noisy alerts while keeping coverage, plus OFAC screening automation. Described at the method level; no bank data appears on this site.',
  },
  {
    title: 'FCRM reporting rebuild',
    tags: ['SQL', 'Excel', 'Dashboards'],
    text: 'Replaced siloed metrics with one trend-driven reporting framework, which shortened the reporting cycle.',
  },
  {
    title: 'Real estate analyzer',
    tags: ['Python', 'Playwright', 'Claude API'],
    text: 'Desktop app that scrapes listings, pulls FEMA flood zones and city permit data, runs mortgage math and asks a Claude agent for an investment read.',
  },
  {
    title: 'Algo trading framework',
    tags: ['Python', 'Backtesting'],
    text: 'SMA crossover, RSI mean-reversion and momentum strategies with pattern-day-trader guardrails.',
  },
];

export const suggestions = [
  'What is Rob strongest at?',
  'Tell me about the SEC dilution project.',
  'What does Rob do in AML analytics?',
];
