import type { CollapseProps } from 'antd';
import {
  Form,
  message,
  Input,
  Button,
  Space,
  Collapse,
  DatePicker
} from 'antd';
import type { Dispatch, SetStateAction } from 'react';
import { useEffect } from 'react';

import dayjs from 'dayjs';
import type { Dayjs } from 'dayjs';

import { isDev } from '~/utils/common/env';
import type { RootLoaderData } from '~/utils/types/root-loader';

export interface CommitsFetchInformation {
  sessionId: string | null;
  workspace: string;
  since: Dayjs | null;
  repo: string;
  branch: string;
}

export function FetchInformationForm({
  commitsFetchInformation,
  setCommitsFetchInformation,
  env
}: {
  commitsFetchInformation: CommitsFetchInformation;
  setCommitsFetchInformation: Dispatch<SetStateAction<CommitsFetchInformation>>;
  env: RootLoaderData['env'];
}) {
  const [formInstance] =
    Form.useForm<Omit<CommitsFetchInformation, 'sessionId'>>();
  const [toast, contextHolder] = message.useMessage();

  useEffect(() => {
    formInstance.setFieldsValue({
      repo: commitsFetchInformation.repo,
      workspace: commitsFetchInformation.workspace,
      branch: commitsFetchInformation.branch,
      since: dayjs().subtract(7, 'days')
    });
  }, [
    formInstance,
    commitsFetchInformation.repo,
    commitsFetchInformation.workspace,
    commitsFetchInformation.branch
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

  const onSubmitRepoInformation = async (
    values: Omit<CommitsFetchInformation, 'sessionId'>
  ) => {
    setCommitsFetchInformation((oldState) => ({
      ...oldState,
      repo: values.repo,
      workspace: values.workspace,
      branch: values.branch,
      since: values.since
    }));

    window.localStorage.setItem(
      'bitbucketFormState',
      JSON.stringify({
        repo: values.repo,
        workspace: values.workspace,
        branch: values.branch
      })
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
            <Input.Password />
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
        className="md:flex md:space-x-2 mb-6"
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

        <Form.Item
          label="Branch"
          name="branch"
          className="md:flex-1 md:mb-0"
          rules={[{ required: true, message: 'Branch is required' }]}
        >
          <Input />
        </Form.Item>

        <Form.Item
          label="Since date"
          name="since"
          className="md:flex-1 md:mb-0"
        >
          <DatePicker className="w-full" showTime />
        </Form.Item>

        <Button htmlType="submit" className="md:mt-[30px]">
          Submit
        </Button>
      </Form>
    </Space>
  );
}
