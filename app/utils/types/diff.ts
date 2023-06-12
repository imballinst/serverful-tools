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
