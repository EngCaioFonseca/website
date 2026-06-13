import fs from 'node:fs';
import path from 'node:path';

export type ContributionDay = {
  date: string;
  count: number;
};

export type ContributionCalendar = {
  totalContributions: number;
  weeks: ContributionDay[][];
};

type GraphQLResponse = {
  data?: {
    user?: {
      contributionsCollection?: {
        contributionCalendar?: {
          totalContributions: number;
          weeks: Array<{
            contributionDays: Array<{
              contributionCount: number;
              date: string;
            }>;
          }>;
        };
      };
    };
  };
  errors?: Array<{ message: string }>;
};

const QUERY = `
  query ($login: String!) {
    user(login: $login) {
      contributionsCollection {
        contributionCalendar {
          totalContributions
          weeks {
            contributionDays {
              contributionCount
              date
            }
          }
        }
      }
    }
  }
`;

const CACHE_DIR = path.join(process.cwd(), '.cache');
const CACHE_FILE = path.join(CACHE_DIR, 'github-contributions.json');

function readCache(login: string): ContributionCalendar | null {
  try {
    const raw = fs.readFileSync(CACHE_FILE, 'utf8');
    const cached = JSON.parse(raw) as { login: string; data: ContributionCalendar };
    return cached.login === login ? cached.data : null;
  } catch {
    return null;
  }
}

function writeCache(login: string, data: ContributionCalendar): void {
  fs.mkdirSync(CACHE_DIR, { recursive: true });
  fs.writeFileSync(CACHE_FILE, JSON.stringify({ login, data }, null, 2));
}

async function fetchFromApi(login: string): Promise<ContributionCalendar | null> {
  const token =
    (import.meta.env?.GITHUB_TOKEN as string | undefined) ?? process.env.GITHUB_TOKEN;

  try {
    const res = await fetch('https://api.github.com/graphql', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/vnd.github+json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({ query: QUERY, variables: { login } }),
    });

    if (!res.ok) return null;

    const json = (await res.json()) as GraphQLResponse;
    if (json.errors?.length) return null;

    const calendar = json.data?.user?.contributionsCollection?.contributionCalendar;
    if (!calendar) return null;

    return {
      totalContributions: calendar.totalContributions,
      weeks: calendar.weeks.map((week) =>
        week.contributionDays.map((day) => ({
          date: day.date,
          count: day.contributionCount,
        })),
      ),
    };
  } catch {
    return null;
  }
}

/** Fetch contribution calendar at build/dev time. Falls back to `.cache/` on API errors. */
export async function fetchGitHubContributions(login: string): Promise<ContributionCalendar | null> {
  const fresh = await fetchFromApi(login);
  if (fresh) {
    writeCache(login, fresh);
    return fresh;
  }
  return readCache(login);
}

function level(count: number): 0 | 1 | 2 | 3 | 4 {
  if (count === 0) return 0;
  if (count <= 3) return 1;
  if (count <= 6) return 2;
  if (count <= 9) return 3;
  return 4;
}

export function monthLabels(weeks: ContributionDay[][]): { label: string; col: number }[] {
  const labels: { label: string; col: number }[] = [];
  let last = '';

  weeks.forEach((week, col) => {
    const first = week[0];
    if (!first) return;

    const month = new Date(first.date + 'T12:00:00').toLocaleDateString('en', { month: 'short' });
    if (month !== last) {
      labels.push({ label: month, col });
      last = month;
    }
  });

  return labels;
}

export function fmtContributionDate(iso: string): string {
  return new Date(iso + 'T12:00:00').toLocaleDateString('en', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export function contributionLevelClass(count: number): string {
  const cell = 'h-[11px] w-[11px] rounded-[2px]';
  const levels: Record<0 | 1 | 2 | 3 | 4, string> = {
    0: `${cell} bg-surface-2`,
    1: `${cell} bg-accent/25`,
    2: `${cell} bg-accent/45`,
    3: `${cell} bg-accent/70`,
    4: `${cell} bg-accent`,
  };
  return levels[level(count)];
}
