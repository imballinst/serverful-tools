import { useEffect, useRef, useState } from 'react';
import { Layout, Space, Spin, Result } from 'antd';
import { InfoCircleOutlined } from '@ant-design/icons';

import { CommitsTable } from '~/components/CommitsTable';
import { useRouteLoaderData } from '@remix-run/react';
import type { RootLoaderData } from '~/utils/types/root-loader';
import type {
  CommitsResponse,
  DiffContentWithoutRaw
} from '~/utils/types/diff';
import type { V2_MetaFunction } from '@remix-run/node';

import { isDev } from '~/utils/common/env';
import type { CommitsFetchInformation } from '~/components/FetchInformationForm';
import { FetchInformationForm } from '~/components/FetchInformationForm';
import { ErrorCodes } from '~/utils/types/error-codes';
import { getCommitSince } from '~/utils/client-utils/date';

const { Content } = Layout;

export const meta: V2_MetaFunction = () => {
  return [
    {
      title: 'Bitbucket Commit Review'
    }
  ];
};

export default function Commits() {
  const { env } = useRouteLoaderData('root') as RootLoaderData;

  const [commitsFetchInformation, setCommitsFetchInformation] =
    useState<CommitsFetchInformation>({
      repo: '',
      workspace: '',
      branch: '',
      since: getCommitSince(),
      sessionId: null
    });
  const [commits, setCommits] = useState<DiffContentWithoutRaw[] | null>(null);
  const [page, setPage] = useState(1);
  const [fetchCommitsError, setFetchCommitsError] = useState<ErrorCodes | null>(
    null
  );
  const [fetchState, setFetchState] = useState<'idle' | 'fetching'>('idle');

  const prevCommitsFetchInformation = useRef(commitsFetchInformation);

  useEffect(() => {
    const bitbucketFormState =
      window.localStorage.getItem('bitbucketFormState');

    if (bitbucketFormState) {
      const parsed = JSON.parse(bitbucketFormState);

      setCommitsFetchInformation((oldState) => ({
        ...oldState,
        workspace: parsed.workspace,
        repo: parsed.repo,
        branch: parsed.branch,
        since: getCommitSince()
      }));
    }
  }, []);

  useEffect(() => {
    // Local storage is only for DEV, in case in Codespaces.
    // In production, we always set this to empty string since we'll be using cookies.
    if (!isDev(env.NODE_ENV)) {
      setCommitsFetchInformation((oldState) => ({
        ...oldState,
        sessionId: ''
      }));
      return;
    }

    const storageSessionId = window.localStorage.getItem('sessionId');
    setCommitsFetchInformation((oldState) => ({
      ...oldState,
      sessionId: storageSessionId || ''
    }));
  }, [env.NODE_ENV]);

  useEffect(() => {
    async function fetchCommits() {
      const { repo, sessionId, workspace, branch, since } =
        commitsFetchInformation;

      // No-op when sessionId is still null.
      if (sessionId === null) return;

      // Dev only: check if we have session ID or not since in Codespaces we tend to not being able
      // to have cookies.
      if (isDev(env.NODE_ENV) && !sessionId) {
        setFetchCommitsError(ErrorCodes.MISSING_REPOSITORY_TOKEN);
        return;
      }

      if (!workspace) {
        setFetchCommitsError(ErrorCodes.MISSING_WORKSPACE_NAME);
        return;
      }

      if (!repo) {
        setFetchCommitsError(ErrorCodes.MISSING_REPOSITORY_NAME);
        return;
      }

      if (!branch) {
        setFetchCommitsError(ErrorCodes.MISSING_BRANCH_NAME);
        return;
      }

      if (prevCommitsFetchInformation.current !== commitsFetchInformation) {
        setCommits(null);
      }

      setFetchCommitsError(null);

      // Fetch.
      let nextPage: number | undefined = page;

      setFetchState('fetching');

      while (nextPage !== undefined) {
        const searchParams = new URLSearchParams({ branch });
        if (nextPage) searchParams.append('page', `${nextPage}`);
        if (since) searchParams.append('since', since.toISOString());

        const response = await fetch(
          `/api/workspaces/${workspace}/repos/${repo}/commits?${searchParams.toString()}`,
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
              setFetchCommitsError(ErrorCodes.UNAUTHENTICATED);
              break;
            }
            case ErrorCodes.SESSION_EXPIRED: {
              window.localStorage.removeItem('sessionId');
              setFetchCommitsError(ErrorCodes.SESSION_EXPIRED);
              break;
            }
            case ErrorCodes.TOKEN_IS_INVALID: {
              window.localStorage.removeItem('sessionId');
              setFetchCommitsError(ErrorCodes.TOKEN_IS_INVALID);
              break;
            }
            default: {
              setFetchCommitsError(ErrorCodes.UNKNOWN_ERROR);
            }
          }

          return;
        }

        const json: CommitsResponse = await response.json();
        setCommits((prev) => {
          const prevCommits = prev || [];
          return prevCommits.concat(json.commits);
        });

        nextPage = json.nextPage;
      }

      setFetchState('idle');
    }

    fetchCommits();
  }, [commitsFetchInformation, page, env.NODE_ENV]);

  useEffect(() => {
    // Put this last for synchronization purposes.
    prevCommitsFetchInformation.current = commitsFetchInformation;
  }, [commitsFetchInformation]);

  return (
    <Content style={{ padding: 16 }}>
      <Space direction="vertical" className="w-full">
        <FetchInformationForm
          commitsFetchInformation={commitsFetchInformation}
          setCommitsFetchInformation={setCommitsFetchInformation}
          env={env}
        />

        {fetchCommitsError && <FetchErrorResult code={fetchCommitsError} />}
        {!fetchCommitsError && !commits && (
          <div className="w-full flex flex-row justify-center">
            <Spin />
          </div>
        )}

        {commits && (
          <CommitsTable
            data={commits}
            isFetching={fetchState === 'fetching'}
            currentPage={page}
            onFetchMore={
              commitsFetchInformation.since
                ? undefined
                : ({ nextPage }) => setPage(nextPage)
            }
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
