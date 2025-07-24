import { List, ListItem, ListItemText } from '@mui/material';
import {
  Dashboard as DashboardIcon,
  People as UsersIcon
} from '@mui/icons-material';

export default function AdminNav() {
  return (
    <List>
      <ListItem button>
        <DashboardIcon />
        <ListItemText primary="Dashboard" />
      </ListItem>
      <ListItem button>
        <UsersIcon />
        <ListItemText primary="Users" />
      </ListItem>
    </List>
  );
}