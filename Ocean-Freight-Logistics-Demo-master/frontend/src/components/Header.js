import React from 'react';
import { Menu } from 'semantic-ui-react';
import { Link } from 'react-router-dom';

export default () => {
  return (
    <Menu style={{ marginTop: '0px', }} size={'large'}>
      <Menu.Item><Link to='/'>HOME</Link></Menu.Item>
    </Menu>
  );
};