import { Button, Spin, Table } from 'antd';
import type { TableColumnsType } from 'antd';
import type { DiffContentWithoutRaw } from '~/utils/types/diff';

const columns: TableColumnsType<DiffContentWithoutRaw> = [
  {
    title: 'Pipeline link',
    dataIndex: 'web_url',
    key: 'web_url',
    render: (url: string) => {
      return <a href={url}>{url}</a>;
    }
  },
  {
    title: 'Created at',
    dataIndex: 'created_at',
    key: 'created_at',
    render: (createdAt: string) => {
      const formatted = new Intl.DateTimeFormat(window.navigator.language, {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        timeZoneName: 'long'
      }).format(new Date(createdAt));
      return <span>{formatted}</span>;
    }
  },
  {
    title: 'Variables',
    dataIndex: 'variables',
    key: 'variables',
    render: (variables) => {
      return (
        <ol>
          {variables.map((variable: any) => {
            return (
              <li key={variable.key}>
                <strong>{variable.key}</strong>: {variable.value}
              </li>
            );
          })}
        </ol>
      );
    }
  }
];

export const PipelinesTable = ({
  data,
  isFetching,
  currentPage,
  onFetchMore
}: {
  data: DiffContentWithoutRaw[];
  isFetching: boolean;
  currentPage: number;
  onFetchMore?: ({ nextPage }: { nextPage: number }) => void;
}) => {
  function Footer() {
    return (
      <div>
        {onFetchMore && (
          <Button
            className="mr-4"
            disabled={isFetching}
            onClick={() => {
              onFetchMore({ nextPage: currentPage + 1 });
            }}
          >
            Fetch more pipelines
          </Button>
        )}

        {isFetching && <Spin />}
      </div>
    );
  }

  return (
    <Table
      columns={columns}
      dataSource={data}
      rowKey="url"
      footer={Footer}
      pagination={false}
    />
  );
};
