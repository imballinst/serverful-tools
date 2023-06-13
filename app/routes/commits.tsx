import { useEffect, useRef, useState } from 'react';
import { Layout, Typography, Space, Spin } from 'antd';
import { CommitsTable } from '~/components/CommitsTable';
import { useRouteLoaderData } from '@remix-run/react';
import type { RootLoaderData } from '~/utils/types/root-loader';
import type { DiffContentWithoutRaw } from '~/utils/types/diff';
import type { V2_MetaFunction } from '@remix-run/node';
import { isDev } from '~/utils/common/env';
import type { CommitsFetchInformation } from '~/components/FetchInformationForm';
import { FetchInformationForm } from '~/components/FetchInformationForm';

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
      sessionId: null
    });
  const [commits, setCommits] = useState<DiffContentWithoutRaw[] | null>(null);
  const [page, setPage] = useState(1);
  const [fetchCommitsError, setFetchCommitsError] = useState<string | null>(
    null
  );

  const prevCommitsFetchInformation = useRef(commitsFetchInformation);

  useEffect(() => {
    const bitbucketFormState =
      window.localStorage.getItem('bitbucketFormState');

    if (bitbucketFormState) {
      const parsed = JSON.parse(bitbucketFormState);
      setCommitsFetchInformation((oldState) => ({
        ...oldState,
        workspace: parsed.workspace,
        repo: parsed.repo
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
      const { repo, sessionId, workspace } = commitsFetchInformation;

      // No-op when sessionId is still null.
      if (sessionId === null) return;

      // Dev only: check if we have session ID or not since in Codespaces we tend to not being able
      // to have cookies.
      if (isDev(env.NODE_ENV) && !sessionId) {
        setFetchCommitsError(
          'Please input your Bitbucket repository token first.'
        );
        return;
      }

      if (!workspace) {
        setFetchCommitsError('Please input your Bitbucket workspace first.');
        return;
      }

      if (!repo) {
        setFetchCommitsError('Please input your Bitbucket repository first.');
        return;
      }

      if (prevCommitsFetchInformation.current !== commitsFetchInformation) {
        setCommits(null);
      }

      setFetchCommitsError(null);
      const response = await fetch(
        `/api/workspaces/${workspace}/repos/${repo}/commits?page=${page}`,
        {
          headers: {
            'x-session-id': sessionId
          }
        }
      );

      if (response.status !== 200) {
        const json = await response.json();

        switch (json.code) {
          case '10000': {
            setFetchCommitsError(
              'Please input your Bitbucket repository token first.'
            );
            break;
          }
          case '10001': {
            window.localStorage.removeItem('sessionId');
            setFetchCommitsError(
              'Session expired. Please input your Bitbucket repository token then try again.'
            );
            break;
          }
          case '10002': {
            window.localStorage.removeItem('sessionId');
            setFetchCommitsError(
              'Token is invalid. Please ensure your form is correct, then try again.'
            );
            break;
          }
        }

        return;
      }

      const json = await response.json();
      setCommits((prev) => {
        const prevCommits = prev || [];
        return prevCommits.concat(json.commits);
      });
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

        {fetchCommitsError && (
          <Typography.Paragraph>{fetchCommitsError}</Typography.Paragraph>
        )}
        {!fetchCommitsError && !commits && (
          <div className="w-full flex flex-row justify-center">
            <Spin />
          </div>
        )}

        {commits && (
          <CommitsTable
            data={commits}
            onFetchMore={({ nextPage }) => setPage(nextPage)}
          />
        )}
      </Space>
    </Content>
  );
}
