import { Button, Table } from 'antd';
import type { TableColumnsType } from 'antd';
import { DiffContentWithoutRaw } from '~/utils/types/diff';

const columns: TableColumnsType<DiffContentWithoutRaw> = [
  {
    title: 'Commit link',
    dataIndex: 'url',
    key: 'url',
    render: (url: string) => {
      const segments = url.split('/');
      return <a href={url}>{segments[segments.length - 1].slice(0, 6)}</a>;
    }
  },
  {
    title: 'Commit title',
    dataIndex: 'message',
    key: 'message',
    render: (commitMessage: string) => {
      const idxOfCommitBullet = commitMessage.indexOf('\n*');
      if (idxOfCommitBullet <= 0) {
        return commitMessage;
      }

      return commitMessage.slice(0, idxOfCommitBullet);
    }
  },
  {
    title: 'Commit date',
    dataIndex: 'date',
    key: 'date',
    render: (_, { date }) => {
      const formatted = new Intl.DateTimeFormat(window.navigator.language, {
        day: '2-digit',
        month: 'long',
        year: 'numeric'
      }).format(new Date(date));
      return <span>{formatted}</span>;
    }
  },
  {
    title: 'Additions',
    key: 'additions',
    dataIndex: 'diffInfo',
    render: (_, { diffInfo }) => (
      <div className="font-mono text-right">{diffInfo.additions}</div>
    )
  },
  {
    title: 'Deletions',
    key: 'deletions',
    dataIndex: 'diffInfo',
    render: (_, { diffInfo }) => (
      <div className="font-mono text-right">{diffInfo.deletions}</div>
    )
  }
];

const PAGE_LENGTH = 10;

export const CommitsTable = ({
  data,
  onFetchMore
}: {
  data: DiffContentWithoutRaw[];
  onFetchMore: ({ nextPage }: { nextPage: number }) => void;
}) => {
  function Footer() {
    return (
      <Button
        onClick={() => {
          const nextPage = data.length / PAGE_LENGTH + 1;
          onFetchMore({ nextPage });
        }}
      >
        Fetch more commits
      </Button>
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
