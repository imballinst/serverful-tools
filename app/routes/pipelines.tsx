import { useCallback, useEffect, useRef, useState } from 'react';
import { Layout, Space, Spin, Result } from 'antd';
import { InfoCircleOutlined } from '@ant-design/icons';

import { useRouteLoaderData } from '@remix-run/react';
import type { RootLoaderData } from '~/utils/types/root-loader';
import type { V2_MetaFunction } from '@remix-run/node';

import { isDev } from '~/utils/common/env';
import { ErrorCodes } from '~/utils/types/error-codes';
import type { PipelinesFetchInformation } from '~/components/PipelinesFetchInformationForm';
import { PipelinesFetchInformationForm } from '~/components/PipelinesFetchInformationForm';
import { PipelinesTable } from '~/components/PipelinesTable';

const { Content } = Layout;

export const meta: V2_MetaFunction = () => {
  return [
    {
      title: 'GitLab Pipelines'
    }
  ];
};

export default function Pipelines() {
  const { env } = useRouteLoaderData('root') as RootLoaderData;

  const [pipelinesFetchInformation, setPipelinesFetchInformation] =
    useState<PipelinesFetchInformation>({
      gitlabProjectPath: '',
      variables: '',
      sessionId: null
    });
  const [pipelines, setPipelines] = useState<any[] | null>(null);
  const [page, setPage] = useState(1);
  const [fetchPipelinesError, setFetchPipelinesError] =
    useState<ErrorCodes | null>(null);
  const [fetchState, setFetchState] = useState<'idle' | 'fetching'>('idle');

  const prevPipelinesFetchInformation = useRef(pipelinesFetchInformation);

  useEffect(() => {
    const gitlabFormState = window.localStorage.getItem('gitlabFormState');

    if (gitlabFormState) {
      const parsed = JSON.parse(gitlabFormState);

      setPipelinesFetchInformation((oldState) => ({
        ...oldState,
        gitlabProjectPath: parsed.gitlabProjectPath,
        variables: parsed.variables
      }));
    }
  }, []);

  useEffect(() => {
    // Local storage is only for DEV, in case in Codespaces.
    // In production, we always set this to empty string since we'll be using cookies.
    if (!isDev(env.NODE_ENV)) {
      setPipelinesFetchInformation((oldState) => ({
        ...oldState,
        sessionId: ''
      }));
      return;
    }

    const storageSessionId = window.localStorage.getItem('sessionId');
    setPipelinesFetchInformation((oldState) => ({
      ...oldState,
      sessionId: storageSessionId || ''
    }));
  }, [env.NODE_ENV]);

  useEffect(() => {
    async function fetchPipelines() {
      const { gitlabProjectPath, variables, sessionId } =
        pipelinesFetchInformation;

      // No-op when sessionId is still null.
      if (sessionId === null) return;

      // Dev only: check if we have session ID or not since in Codespaces we tend to not being able
      // to have cookies.
      if (isDev(env.NODE_ENV) && !sessionId) {
        setFetchPipelinesError(ErrorCodes.MISSING_REPOSITORY_TOKEN);
        return;
      }

      if (!gitlabProjectPath) {
        setFetchPipelinesError(ErrorCodes.MISSING_GITLAB_PROJECT_PATH);
        return;
      }

      if (!variables) {
        setFetchPipelinesError(ErrorCodes.MISSING_VARIABLES);
        return;
      }

      if (prevPipelinesFetchInformation.current !== pipelinesFetchInformation) {
        setPipelines(null);
      }

      setFetchPipelinesError(null);

      // TODO
      const searchEntries = Object.fromEntries(
        variables.split(/,\s?/).map((item) => item.split('='))
      );
      searchEntries.page = page;

      setFetchState('fetching');

      try {
        const response = await fetch(
          `/api/gitlab/${gitlabProjectPath}/pipelines?${new URLSearchParams(
            searchEntries
          ).toString()}`,
          {
            headers: {
              'x-session-id': sessionId
            }
          }
        );

        if (response.status !== 200) {
          const json = await response.json();

          switch (json.code) {
            case ErrorCodes.UNAUTHENTICATED: {
              setFetchPipelinesError(ErrorCodes.UNAUTHENTICATED);
              break;
            }
            case ErrorCodes.SESSION_EXPIRED: {
              window.localStorage.removeItem('sessionId');
              setFetchPipelinesError(ErrorCodes.SESSION_EXPIRED);
              break;
            }
            case ErrorCodes.TOKEN_IS_INVALID: {
              window.localStorage.removeItem('sessionId');
              setFetchPipelinesError(ErrorCodes.TOKEN_IS_INVALID);
              break;
            }
            default: {
              setFetchPipelinesError(ErrorCodes.UNKNOWN_ERROR);
            }
          }

          return;
        }

        const json = await response.json();

        setPipelines((prev) => {
          return [...(prev || []), ...json];
        });
      } catch (err) {
        // No-op.
      }

      setFetchState('idle');
    }

    fetchPipelines();
  }, [pipelinesFetchInformation, page, env.NODE_ENV]);

  useEffect(() => {
    // Put this last for synchronization purposes.
    prevPipelinesFetchInformation.current = pipelinesFetchInformation;
  }, [pipelinesFetchInformation]);

  const memoizedSetPipelinesFetchInformation = useCallback(
    (...params: Parameters<typeof setPipelinesFetchInformation>) => {
      setPipelinesFetchInformation(...params);
      setPage(1);
    },
    []
  );

  return (
    <Content style={{ padding: 16 }}>
      <Space direction="vertical" className="w-full">
        <PipelinesFetchInformationForm
          pipelinesFetchInformation={pipelinesFetchInformation}
          setPipelinesFetchInformation={memoizedSetPipelinesFetchInformation}
          env={env}
        />

        {fetchPipelinesError && <FetchErrorResult code={fetchPipelinesError} />}
        {!fetchPipelinesError && !pipelines && (
          <div className="w-full flex flex-row justify-center">
            <Spin />
          </div>
        )}

        {pipelines && (
          <PipelinesTable
            data={pipelines}
            isFetching={fetchState === 'fetching'}
            currentPage={page}
            onFetchMore={({ nextPage }) => {
              setPage(nextPage);
            }}
          />
        )}
      </Space>
    </Content>
  );
}

// Composing functions.
function FetchErrorResult({ code }: { code: ErrorCodes }) {
  switch (code) {
    case ErrorCodes.MISSING_REPOSITORY_TOKEN: {
      return (
        <Result
          title="Please verify your repository token, then try again."
          icon={<InfoCircleOutlined />}
        />
      );
    }
    case ErrorCodes.MISSING_WORKSPACE_NAME:
    case ErrorCodes.MISSING_REPOSITORY_NAME:
    case ErrorCodes.MISSING_BRANCH_NAME: {
      return (
        <Result
          title="Please verify your repository information, then try again."
          icon={<InfoCircleOutlined />}
        />
      );
    }
    case ErrorCodes.UNAUTHENTICATED: {
      return (
        <Result
          status="warning"
          title="You are not authenticated yet. Submit your repository token, then try again."
          icon={<InfoCircleOutlined />}
        />
      );
    }
    case ErrorCodes.TOKEN_IS_INVALID: {
      return (
        <Result
          status="403"
          title="Token is invalid or does not have the proper permissions. Ensure that you are using the correct token, then try again."
        />
      );
    }
    case ErrorCodes.SESSION_EXPIRED: {
      return (
        <Result
          status="warning"
          title="Session expired. Re-submit your repository token, then try again."
        />
      );
    }
  }

  // Unknown error.
  return (
    <Result
      status="500"
      title="Something went wrong. Try again in a little bit."
    />
  );
}
