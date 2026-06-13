// Professional experience timeline. Newest first.
// TODO(caio): confirm your current Red Hat title and start date.

export type Job = {
  role: string;
  org: string;
  location?: string;
  start: string;
  end: string; // 'Present' for current
  summary?: string;
  tags?: string[];
};

export const EXPERIENCE: Job[] = [
  {
    role: 'Software Engineer',
    org: 'Red Hat',
    location: 'Remote',
    start: '2023',
    end: 'Present',
    summary:
      'Building and maintaining software in an open-source-first engineering organisation.',
    tags: ['software', 'open source'],
  },
  {
    role: 'Visiting Scholar — Biomedical Engineering',
    org: 'Rochester Institute of Technology',
    location: 'Rochester, NY, USA',
    start: 'Oct 2021',
    end: 'Oct 2021',
    summary:
      'Research on diffusion coefficients in biopolymer matrices for molecular communications.',
    tags: ['research'],
  },
  {
    role: 'Computer Science Lecturer',
    org: 'Waterford Institute of Technology',
    location: 'Waterford, Ireland',
    start: 'Nov 2020',
    end: 'Dec 2020',
    summary: 'Taught Programming Fundamentals and Data Structures.',
    tags: ['teaching'],
  },
  {
    role: 'Electrical Engineering Intern',
    org: 'ENGESELT',
    location: 'Brazil',
    start: 'Sep 2018',
    end: 'Dec 2018',
    tags: ['engineering'],
  },
  {
    role: 'Visiting Researcher',
    org: 'Edmond & Lily Safra International Institute of Neuroscience',
    location: 'Natal, Brazil',
    start: 'Jan 2017',
    end: 'Apr 2017',
    summary: 'EEG signal processing and brain–machine interfaces.',
    tags: ['research', 'neuroscience'],
  },
  {
    role: 'Visiting Student Researcher',
    org: 'University of California, Los Angeles (UCLA)',
    location: 'Los Angeles, CA, USA',
    start: 'May 2015',
    end: 'Sep 2015',
    summary: 'Research on lithium-ion battery behaviour.',
    tags: ['research'],
  },
  {
    role: 'Lecture Assistant',
    org: 'Federal University of Campina Grande',
    location: 'Campina Grande, Brazil',
    start: '2013',
    end: '2016',
    summary: 'Multiple teaching-assistant roles in electrical engineering.',
    tags: ['teaching'],
  },
];

export type Degree = {
  degree: string;
  field: string;
  org: string;
  location?: string;
  start?: string;
  end: string;
};

export const EDUCATION: Degree[] = [
  {
    degree: 'PhD',
    field: 'Computer Science',
    org: 'Waterford Institute of Technology — Walton Institute',
    location: 'Ireland',
    end: '2023',
  },
  {
    degree: 'BEng',
    field: 'Electrical Engineering',
    org: 'Federal University of Campina Grande',
    location: 'Brazil',
    end: '2019',
  },
  {
    degree: 'Exchange Programme',
    field: 'Electrical Engineering',
    org: 'Western New England University',
    location: 'USA',
    start: '2014',
    end: '2015',
  },
];

export const RESEARCH_INTERESTS: string[] = [
  'molecular communications',
  'neural engineering',
  'bioengineering',
  'molecular biophysics',
  'computational neuroscience',
  'bio-inspired computing',
  'cancer drug delivery',
  'nanomedicine',
  'artificial intelligence',
  'power electronics',
];
