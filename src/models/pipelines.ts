interface GitLabPipeline {
  link: string;
  status: string;
  createdAt: string;
  variables: Array<{
    variable_type: string;
    key: string;
    value: string;
    raw: boolean;
  }>;
  // TODO: for debugging only.
  isVariablesCached?: boolean;
}

export interface GitLabPipelinesResponse {
  data: GitLabPipeline[];
  paging: {
    prev: number | null;
    next: number | null;
  };
}
