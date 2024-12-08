import type { APIRoute } from 'astro';
import axios from 'axios';
import { cache } from '../../../utils/cache';

export const prerender = false;

const ROUTE_PREFIX = '/api/gitlab/';

export const GET: APIRoute = async ({ request }) => {
  const gitlabToken = request.headers.get('PRIVATE-TOKEN');

  const requestUrl = new URL(request.url);
  const apiPath = requestUrl.pathname.slice(ROUTE_PREFIX.length);

  const [account, project, ...rest] = apiPath.split('/');
  if (!account || !project || rest.length === 0) {
    return new Response(
      JSON.stringify({
        message:
          'Invalid path. Please include {account}/{project_id}/{endpoint} in the request path.'
      }),
      { status: 400 }
    );
  }

  // Reference: https://docs.gitlab.com/ee/api/rest/index.html#namespaced-paths.
  const namespaceAndProjectPath = encodeURIComponent(`${account}/${project}`);
  const gitlabEndpoint = rest.join('/');

  const { page = 1, ...pipelineVariablesToFilter } = Object.fromEntries(
    requestUrl.searchParams
  );

  const { data: pipelines } = await axios(
    `https://gitlab.com/api/v4/projects/${namespaceAndProjectPath}/${gitlabEndpoint}?page=${page}`,
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
      if (cached) return cached;

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

      return data;
    })
  );

  const result: any[] = [];
  const hasFilter = Object.keys(pipelineVariablesToFilter).length > 0;

  for (let i = 0; i < pipelines.length; i++) {
    const pipelineVariables = pipelinesVariables[i];
    let isIncluded = true;

    if (hasFilter) {
      isIncluded = pipelineVariables.some((variable: any) => {
        const { key, value } = variable;
        return pipelineVariablesToFilter[key] === value;
      });
    }

    if (!isIncluded) continue;

    result.push({
      link: pipelines[i].web_url,
      status: pipelines[i].status,
      createdAt: pipelines[i].created_at,
      variables: pipelineVariables
    });
  }

  return new Response(JSON.stringify(result), {
    headers: {
      'content-type': 'application/json'
    }
  });
};
