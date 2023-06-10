import { Table } from 'antd';
import type { TableColumnsType } from 'antd';

interface DataType {
  url: string;
  message: string;
  date: string;
  diffInfo: {
    additions: number;
    deletions: number;
  };
}

const columns: TableColumnsType<DataType> = [
  {
    title: 'Commit link',
    dataIndex: 'url',
    key: 'url',
    render: (text) => <a href={text}>{text}</a>
  },
  {
    title: 'Commit title',
    dataIndex: 'message',
    key: 'message'
  },
  {
    title: 'Commit date',
    dataIndex: 'date',
    key: 'date'
  },
  {
    title: 'Additions',
    key: 'diffInfo',
    dataIndex: 'diffInfo',
    render: (_, { diffInfo }) => <span>{diffInfo.additions}</span>
  },
  {
    title: 'Deletions',
    key: 'diffInfo',
    dataIndex: 'diffInfo',
    render: (_, { diffInfo }) => <span>{diffInfo.deletions}</span>
  }
];

export const CommitsTable = ({ data }: { data: DataType[] }) => (
  <Table columns={columns} dataSource={data} />
);
