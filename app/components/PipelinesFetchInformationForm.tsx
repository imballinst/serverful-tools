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

import type { Dayjs } from 'dayjs';

import { isDev } from '~/utils/common/env';
import type { RootLoaderData } from '~/utils/types/root-loader';
import { getCommitSince } from '~/utils/client-utils/date';

export interface PipelinesFetchInformation {
  sessionId: string | null;
  gitlabProjectPath: string;
  variables: string;
}

export function PipelinesFetchInformationForm({
  pipelinesFetchInformation,
  setPipelinesFetchInformation,
  env
}: {
  pipelinesFetchInformation: PipelinesFetchInformation;
  setPipelinesFetchInformation: Dispatch<
    SetStateAction<PipelinesFetchInformation>
  >;
  env: RootLoaderData['env'];
}) {
  const [formInstance] =
    Form.useForm<Omit<PipelinesFetchInformation, 'sessionId'>>();
  const [toast, contextHolder] = message.useMessage();

  useEffect(() => {
    formInstance.setFieldsValue({
      gitlabProjectPath: pipelinesFetchInformation.gitlabProjectPath,
      variables: pipelinesFetchInformation.variables
    });
  }, [
    formInstance,
    pipelinesFetchInformation.gitlabProjectPath,
    pipelinesFetchInformation.variables
  ]);

  const onSubmitAuthorization = async (values: any) => {
    const formData = new FormData();
    for (const key in values) {
      formData.append(key, values[key]);
    }

    const response = await fetch('/api/authorize', {
      method: 'post',
      body: formData
    });
    const json = await response.json();

    if (json.sessionId) {
      toast.success('Authenticated!');

      setPipelinesFetchInformation((oldState) => ({
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
    values: Omit<PipelinesFetchInformation, 'sessionId'>
  ) => {
    setPipelinesFetchInformation((oldState) => ({
      ...oldState,
      gitlabProjectPath: values.gitlabProjectPath,
      variables: values.variables
    }));

    window.localStorage.setItem(
      'gitlabFormState',
      JSON.stringify({
        gitlabProjectPath: values.gitlabProjectPath,
        variables: values.variables
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
          initialValues={{
            tokenType: 'gitlab'
          }}
          layout="vertical"
        >
          <Form.Item
            label="GitLab access token"
            name="token"
            rules={[
              {
                required: true,
                message: 'GitLab access token is required'
              }
            ]}
          >
            <Input.Password />
          </Form.Item>

          <Form.Item name="tokenType" hidden>
            <Input />
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
          label="GitLab repo path"
          name="gitlabProjectPath"
          className="md:flex-1 md:mb-0"
          rules={[{ required: true, message: 'GitLab repo path is required' }]}
        >
          <Input />
        </Form.Item>

        <Form.Item
          label="Variables"
          name="variables"
          className="md:flex-1 md:mb-0"
        >
          <Input placeholder="HELLO=world, PING=pong" />
        </Form.Item>

        <Button htmlType="submit" className="md:mt-[30px]">
          Submit
        </Button>
      </Form>
    </Space>
  );
}
