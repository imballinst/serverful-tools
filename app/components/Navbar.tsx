import { BarsOutlined, HomeOutlined } from '@ant-design/icons';
import type { MenuProps } from 'antd';
import { Menu } from 'antd';
import { Link, useLocation } from '@remix-run/react';

const items: MenuProps['items'] = [
  {
    label: <Link to="/">Home</Link>,
    key: '/',
    icon: <HomeOutlined />
  },
  {
    label: <Link to="/commits">Commits</Link>,
    key: '/commits',
    icon: <BarsOutlined />
  }
];

export const Navbar = () => {
  const { pathname } = useLocation();

  return <Menu selectedKeys={[pathname]} mode="horizontal" items={items} />;
};
