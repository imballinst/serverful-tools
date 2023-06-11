import type { Dispatch, SetStateAction } from 'react';
import { useEffect, useState } from 'react';
import { Button, Form, Input, Layout, Collapse, Typography, Space } from 'antd';
import type { CollapseProps } from 'antd';
import { CommitsTable } from '~/components/CommitsTable';
import { useRouteLoaderData } from '@remix-run/react';
import type { RootLoaderData } from '~/utils/types/rootLoader';

const { Content } = Layout;

interface CommitsFetchInformation {
  sessionId: string | null;
  workspace: string;
  repo: string;
}

const FetchInformationCollapse = ({
  commitsFetchInformation,
  setCommitsFetchInformation,
  env
}: {
  commitsFetchInformation: CommitsFetchInformation;
  setCommitsFetchInformation: Dispatch<SetStateAction<CommitsFetchInformation>>;
  env: RootLoaderData['env'];
}) => {
  const onSubmit = async (values: any) => {
    const formData = new FormData();
    formData.append('token', values.token);

    const response = await fetch('/api/authorize', {
      method: 'post',
      body: formData
    });
    const json = await response.json();

    if (json.sessionId) {
      setCommitsFetchInformation((oldState) => ({
        ...oldState,
        sessionId: json.sessionId,
        repo: values.repo,
        workspace: values.workspace
      }));

      window.localStorage.setItem(
        'bitbucketFormState',
        JSON.stringify({ repo: values.repo, workspace: values.workspace })
      );

      // Only set localStorage in dev.
      if (isDev(env.NODE_ENV)) {
        window.localStorage.setItem('sessionId', json.sessionId);
      }
    }
  };

  const items: CollapseProps['items'] = [
    {
      key: 'fetchInformation',
      label: 'Fetch Information',
      children: (
        <Form
          name="basic"
          labelCol={{ span: 8 }}
          wrapperCol={{ span: 16 }}
          autoComplete="off"
          onFinish={onSubmit}
          layout="vertical"
        >
          <Form.Item label="Bitbucket repository access token" name="token">
            <Input />
          </Form.Item>

          <Form.Item label="Bitbucket workspace" name="workspace">
            <Input defaultValue={commitsFetchInformation.workspace} />
          </Form.Item>

          <Form.Item label="Bitbucket repository" name="repo">
            <Input defaultValue={commitsFetchInformation.repo} />
          </Form.Item>

          <Button htmlType="submit">Submit</Button>
        </Form>
      )
    }
  ];

  return <Collapse items={items} />;
};

export default function Commits() {
  const { env } = useRouteLoaderData('root') as RootLoaderData;

  const [commitsFetchInformation, setCommitsFetchInformation] =
    useState<CommitsFetchInformation>({
      repo: '',
      workspace: '',
      sessionId: null
    });
  const [commits, setCommits] = useState<any>(null);
  const [fetchCommitsError, setFetchCommitsError] = useState<string | null>(
    null
  );

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

      // TODO: maybe we can use something like react-hook-form here.
      if (!workspace) {
        setFetchCommitsError('Please input your Bitbucket workspace first.');
        return;
      }

      if (!repo) {
        setFetchCommitsError('Please input your Bitbucket repository first.');
        return;
      }

      setCommits(null);
      setFetchCommitsError(null);
      const response = await fetch(
        `/api/workspaces/${workspace}/repos/${repo}/commits`,
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
        }

        return;
      }

      const json = await response.json();
      setCommits(json.commits);
    }

    fetchCommits();
  }, [commitsFetchInformation, env.NODE_ENV]);

  return (
    <Content style={{ padding: 16 }}>
      <Space direction="vertical" className="w-full">
        <FetchInformationCollapse
          commitsFetchInformation={commitsFetchInformation}
          setCommitsFetchInformation={setCommitsFetchInformation}
          env={env}
        />

        {fetchCommitsError && (
          <Typography.Paragraph>{fetchCommitsError}</Typography.Paragraph>
        )}
        {commits && <CommitsTable data={commits.diff} />}
      </Space>
    </Content>
  );
}

// Helper functions.
function isDev(env: RootLoaderData['env']['NODE_ENV']) {
  return env === 'development';
}
