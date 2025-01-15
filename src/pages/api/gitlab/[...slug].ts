import type { GitLabPipelinesResponse } from '@/models/pipelines';
import type { APIRoute } from 'astro';
import axios, { AxiosError } from 'axios';
import { cache } from '../../../lib/cache';

export const prerender = false;

const ROUTE_PREFIX = '/api/gitlab/';

export const GET: APIRoute = async ({ request }) => {
  const gitlabToken = request.headers.get('PRIVATE-TOKEN');

  const requestUrl = new URL(request.url);
  const apiPath = requestUrl.pathname.slice(ROUTE_PREFIX.length);

  const [project, ...rest] = apiPath.split('/');
  if (!project || rest.length === 0) {
    return new Response(
      JSON.stringify({
        message:
          'Invalid path. Please include {account}/{project_id}/{endpoint} in the request path.'
      }),
      { status: 400 }
    );
  }

  // Reference: https://docs.gitlab.com/ee/api/rest/index.html#namespaced-paths.
  const gitlabEndpoint = rest.join('/');

  const { page = '1', ...pipelineVariablesToFilter } = Object.fromEntries(
    requestUrl.searchParams
  );

  try {
    const { data: pipelines, headers: pipelineResponseHeaders } = await axios(
      `https://gitlab.com/api/v4/projects/${project}/${gitlabEndpoint}?page=${page}`,
      {
        headers: {
          'PRIVATE-TOKEN': gitlabToken
        }
      }
    );

    const pipelineVariableKeys: string[] = pipelines.map(
      (item: any) => `${item.project_id}/pipelines/${item.id}/variables`
    );

    const pipelinesVariables = await Promise.all(
      pipelineVariableKeys.map(async (key) => {
        const cached = cache.get(key);
        if (cached) {
          return {
            data: cached,
            isCached: true
          };
        }

        const response = await axios(
          `https://gitlab.com/api/v4/projects/${key}`,
          {
            headers: {
              'PRIVATE-TOKEN': gitlabToken
            }
          }
        );
        const data = response.data;
        cache.set(key, data);

        return {
          data,
          isCached: false
        };
      })
    );

    const { 'x-next-page': nextPage, 'x-prev-page': prevPage } =
      pipelineResponseHeaders;

    const result: GitLabPipelinesResponse = {
      data: [],
      paging: {
        next: nextPage ? Number(nextPage) : null,
        prev: prevPage ? Number(prevPage) : null
      }
    };
    const hasFilter = Object.keys(pipelineVariablesToFilter).length > 0;

    for (let i = 0; i < pipelines.length; i++) {
      const pipelineVariables = pipelinesVariables[i];
      let isIncluded = true;

      if (hasFilter) {
        isIncluded = pipelineVariables.data.some((variable: any) => {
          const { key, value } = variable;
          return pipelineVariablesToFilter[key] === value;
        });
      }

      if (!isIncluded) continue;

      result.data.push({
        link: pipelines[i].web_url,
        status: pipelines[i].status,
        createdAt: pipelines[i].created_at,
        variables: pipelineVariables.data,
        // TODO: for debugging only.
        isVariablesCached: pipelineVariables.isCached
      });
    }

    return new Response(JSON.stringify(result), {
      headers: {
        'content-type': 'application/json'
      }
    });
  } catch (err) {
    return getErrorResponse(err);
  }
};

function getErrorResponse(err: unknown) {
  let body: { message: string };
  let status: number;

  if (err instanceof AxiosError) {
    body = {
      message: err.stack
    };
    status = err.status;
  } else {
    body = { message: (err as Error).message };
    status = 500;
  }

  return new Response(JSON.stringify(body), { status });
}
