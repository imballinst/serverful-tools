import { useEffect, useState } from 'react';
import { Button, Form, Input, Layout, Collapse, Typography } from 'antd';
import type { CollapseProps } from 'antd';
import { CommitsTable } from '~/components/CommitsTable';

const { Content } = Layout;

const AuthorizationCollapse = ({
  setSessionId
}: {
  setSessionId: (value: string) => void;
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
      window.localStorage.setItem('sessionId', json.sessionId);
      setSessionId(json.sessionId);
    }
  };

  const items: CollapseProps['items'] = [
    {
      key: 'authorization',
      label: 'Authorization',
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

          <Button htmlType="submit">Submit</Button>
        </Form>
      )
    }
  ];

  return <Collapse items={items} />;
};

export default function Commits() {
  const [sessionId, setSessionId] = useState('');
  const [commits, setCommits] = useState<any>(null);
  const [fetchCommitsError, setFetchCommitsError] = useState<string | null>(
    null
  );

  useEffect(() => {
    const storageSessionId = window.localStorage.getItem('sessionId');
    if (storageSessionId) {
      setSessionId(storageSessionId);
    }
  }, []);

  useEffect(() => {
    async function fetchCommits() {
      if (!sessionId) {
        setFetchCommitsError(
          'Please input your Bitbucket repository token first.'
        );
        return;
      }

      setCommits(null);
      setFetchCommitsError(null);
      const response = await fetch('/api/commits', {
        headers: {
          'x-session-id': sessionId
        }
      });

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
  }, [sessionId]);

  return (
    <Content style={{ padding: 16 }}>
      <AuthorizationCollapse setSessionId={setSessionId} />

      {fetchCommitsError && (
        <Typography.Paragraph>{fetchCommitsError}</Typography.Paragraph>
      )}
      {commits && <CommitsTable data={commits.diff} />}
    </Content>
  );
}
