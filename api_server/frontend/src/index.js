import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import { BrowserRouter, Routes, Route } from "react-router-dom";
import PaypalPaymentForm from './modules/PaypalPaymentForm';
import DiscordAdminPanel from './modules/DiscordAdminPanel/DiscordAdminPanel';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';

export default function Router() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/warframehub/purchase/vip/sandbox" element={<PaypalPaymentForm />}>
          <Route index element={<PaypalPaymentForm />} />
        </Route>
        <Route path="/admin" element={<DiscordAdminPanel />}>
          <Route index element={<DiscordAdminPanel />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}


const theme = createTheme({
  palette: {
    primary: {
      main: '#651fff',
    },
    secondary: {
      main: '#f50057',
    },
  },
});

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <ThemeProvider theme={theme}>
    <CssBaseline />
    <Router />
  </ThemeProvider>
);