export interface DiffContent {
  raw: string;
  diffInfo: {
    additions: number;
    deletions: number;
  };
  url: string;
  date: string;
  message: string;
}

export type DiffContentWithoutRaw = Omit<DiffContent, 'raw'>;

// Commits response.
export interface CommitsResponse {
  commits: DiffContentWithoutRaw[];
  nextPage?: number;
}
