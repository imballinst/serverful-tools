import type { Dispatch, SetStateAction } from 'react';
import { useEffect, useRef, useState } from 'react';
import {
  Button,
  Form,
  Input,
  Layout,
  Collapse,
  Typography,
  Space,
  Spin,
  message
} from 'antd';
import type { CollapseProps } from 'antd';
import { CommitsTable } from '~/components/CommitsTable';
import { useRouteLoaderData } from '@remix-run/react';
import type { RootLoaderData } from '~/utils/types/rootLoader';
import { DiffContentWithoutRaw } from '~/utils/types/diff';
import type { V2_MetaFunction } from '@remix-run/node';

const { Content } = Layout;

export const meta: V2_MetaFunction = () => {
  return [
    {
      title: 'Bitbucket Commit Review'
    }
  ];
};

interface CommitsFetchInformation {
  sessionId: string | null;
  workspace: string;
  repo: string;
}

const FetchInformationForm = ({
  commitsFetchInformation,
  setCommitsFetchInformation,
  env
}: {
  commitsFetchInformation: CommitsFetchInformation;
  setCommitsFetchInformation: Dispatch<SetStateAction<CommitsFetchInformation>>;
  env: RootLoaderData['env'];
}) => {
  const [formInstance] =
    Form.useForm<Omit<CommitsFetchInformation, 'sessionId'>>();
  const [toast, contextHolder] = message.useMessage();

  useEffect(() => {
    formInstance.setFieldsValue({
      repo: commitsFetchInformation.repo,
      workspace: commitsFetchInformation.workspace
    });
  }, [
    formInstance,
    commitsFetchInformation.repo,
    commitsFetchInformation.workspace
  ]);

  const onSubmitAuthorization = async (values: any) => {
    const formData = new FormData();
    formData.append('token', values.token);

    const response = await fetch('/api/authorize', {
      method: 'post',
      body: formData
    });
    const json = await response.json();

    if (json.sessionId) {
      toast.success('Authenticated!');

      setCommitsFetchInformation((oldState) => ({
        ...oldState,
        sessionId: json.sessionId
      }));

      // Only set localStorage in dev.
      if (isDev(env.NODE_ENV)) {
        window.localStorage.setItem('sessionId', json.sessionId);
      }
    }
  };

  const onSubmitRepoInformation = async (values: any) => {
    setCommitsFetchInformation((oldState) => ({
      ...oldState,
      repo: values.repo,
      workspace: values.workspace
    }));

    window.localStorage.setItem(
      'bitbucketFormState',
      JSON.stringify({ repo: values.repo, workspace: values.workspace })
    );
  };

  const items: CollapseProps['items'] = [
    {
      key: 'authorization',
      label: 'Authorization',
      children: (
        <Form
          name="authorization"
          autoComplete="off"
          onFinish={onSubmitAuthorization}
          layout="vertical"
        >
          <Form.Item
            label="Bitbucket repository access token"
            name="token"
            rules={[
              {
                required: true,
                message: 'Bitbucket repository access token is required'
              }
            ]}
          >
            <Input type="password" />
          </Form.Item>

          <Button htmlType="submit">Submit</Button>
        </Form>
      )
    }
  ];

  return (
    <Space direction="vertical" className="w-full">
      <Collapse items={items} />

      {contextHolder}

      <Form
        name="repositoryInformation"
        form={formInstance}
        autoComplete="off"
        onFinish={onSubmitRepoInformation}
        layout="vertical"
        className="md:flex md:flex-row md:space-x-2 md:items-end mb-6"
      >
        <Form.Item
          label="Bitbucket workspace"
          name="workspace"
          className="md:flex-1 md:mb-0"
          rules={[
            { required: true, message: 'Bitbucket workspace is required' }
          ]}
        >
          <Input />
        </Form.Item>

        <Form.Item
          label="Bitbucket repository"
          name="repo"
          className="md:flex-1 md:mb-0"
          rules={[
            { required: true, message: 'Bitbucket repository is required' }
          ]}
        >
          <Input />
        </Form.Item>

        <Button htmlType="submit">Submit</Button>
      </Form>
    </Space>
  );
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

      // TODO: maybe we can use something like react-hook-form here.
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

// Helper functions.
function isDev(env: RootLoaderData['env']['NODE_ENV']) {
  return env === 'development';
}
