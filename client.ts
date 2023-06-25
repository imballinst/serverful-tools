import { makeApi, Zodios, type ZodiosOptions } from '@zodios/core';
import { z } from 'zod';

const AuthorizeBitbucketRequestV1 = z.object({ token: z.string() });
const AuthorizeBitbucketResponseV1 = z.object({ sessionId: z.string() });
const Error = z.object({ code: z.string(), message: z.string() });
const BitbucketCommitsV1 = z.object({
  diffInfo: z
    .object({ additions: z.number(), deletions: z.number() })
    .partial(),
  url: z.string(),
  date: z.string(),
  message: z.string()
});

export const schemas = {
  AuthorizeBitbucketRequestV1,
  AuthorizeBitbucketResponseV1,
  Error,
  BitbucketCommitsV1
};

const endpoints = makeApi([
  {
    method: 'post',
    path: '/v1/bitbucket/authorize',
    description: `Create a session using a Bitbucket repository token`,
    requestFormat: 'json',
    parameters: [
      {
        name: 'body',
        type: 'Body',
        schema: z.object({ token: z.string() })
      }
    ],
    response: z.object({ sessionId: z.string() }),
    errors: [
      {
        status: 400,
        description: `Invalid request body`,
        schema: Error
      }
    ]
  },
  {
    method: 'get',
    path: '/v1/bitbucket/workspaces/:workspace/repos/:repo/commits',
    description: `Get the list of Bitbucket commits including the number of changed lines`,
    requestFormat: 'json',
    parameters: [
      {
        name: 'workspace',
        type: 'Path',
        schema: z.string()
      },
      {
        name: 'repo',
        type: 'Path',
        schema: z.string()
      },
      {
        name: 'page',
        type: 'Query',
        schema: z.string().optional().default('1')
      },
      {
        name: 'branch',
        type: 'Query',
        schema: z.string().optional()
      },
      {
        name: 'since',
        type: 'Query',
        schema: z.string().optional()
      }
    ],
    response: BitbucketCommitsV1,
    errors: [
      {
        status: 401,
        description: `Not authenticated or session expired`,
        schema: Error
      },
      {
        status: 403,
        description: `Invalid Bitbucket repository token`,
        schema: Error
      },
      {
        status: 404,
        description: `Not found`,
        schema: Error
      }
    ]
  }
]);

export const api = new Zodios(endpoints);

export function createApiClient(baseUrl: string, options?: ZodiosOptions) {
  return new Zodios(baseUrl, endpoints, options);
}

