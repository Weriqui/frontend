import React from 'react';
import { Drawer, List, ListItem, ListItemText } from '@mui/material';

function Sidebar({ open, onClose }) {
  return (
    <Drawer open={open} onClose={onClose}>
      <List>
        <ListItem button>
          <ListItemText primary="Dashboard" />
        </ListItem>
        {/* Adicione mais itens conforme necessário */}
      </List>
    </Drawer>
  );
}

export default Sidebar;
