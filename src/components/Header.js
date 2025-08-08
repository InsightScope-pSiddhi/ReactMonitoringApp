import React from 'react';
import { Tabs, Tab, AppBar, Toolbar, Typography } from '@mui/material';
import { useLocation, useNavigate } from 'react-router-dom';

const tabs = [
  { label: '🩺 Health', path: '/health' },
  { label: '🟢 Ready', path: '/ready' },
  { label: '❤️‍🔥 Live', path: '/live' },
  { label: '📜 Logs', path: '/logs' },
  { label: '📈 Metrics', path: '/metrics' },
];

function Header() {
  const navigate = useNavigate();
  const location = useLocation();
  const currentTab = tabs.findIndex(tab => location.pathname.startsWith(tab.path));

return ( 
  <AppBar position="static" color="primary">
    <Toolbar>
      <Typography
        variant="h5"
        sx={{
          flexGrow: 1,
          fontWeight: 'bold',
          color: 'white', // ensures it's visible on primary AppBar
        }}
      >
        InsightScope
      </Typography>
      <Tabs
        value={currentTab !== -1 ? currentTab : 0}
        onChange={(_, newValue) => navigate(tabs[newValue].path)}
        textColor="inherit"
        indicatorColor="secondary"
      >
        {tabs.map((tab, index) => (
          <Tab
            key={index}
            label={tab.label}
            sx={{
              color: currentTab === index ? '#0e0f0fff' : '#ffffff', // lime green when selected, white otherwise
              fontWeight: currentTab === index ? 'bold' : 'normal',
              textTransform: 'none',
            }}
          />
        ))}
      </Tabs>
    </Toolbar>
  </AppBar>
);
}
export default Header;
