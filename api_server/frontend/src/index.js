import ReactDOM from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import CssBaseline from '@mui/material/CssBaseline';
import { ThemeProvider, createTheme, responsiveFontSizes } from '@mui/material/styles';
import React, { useEffect } from "react";
import MainLayout from "./layouts/MainLayout";
import MainHome from "./views/MainHome";
import theme from "./theme";
import Settings from "./views/Settings/Settings";
import Profile from "./views/Profile/Profile";
import FirebaseNotifications from "./firebase/firebase-notifications";
import TermsOfService from "./views/MainFooter/TermsOfService";
import PrivacyPolicy from "./views/MainFooter/PrivacyPolicy";
import FAQ from "./views/MainFooter/FAQ";
import { AuthContext } from "./context/AuthContext";
import MiniframeLayout from "./views/Miniframe/MiniframeLayout";
import MiniframeGame from "./views/Miniframe/MiniframeGame";
import AllSquadsReview2023 from "./views/AllSquadsReview/AllSquadsReview2023";
import DiscordAdminPanel from "./views/DiscordAdminPanel/DiscordAdminPanel";

class Router extends React.Component {
  constructor(props) {
    super(props)
    this.state = {
      user: null
    }
  }

  render() {
    return (
      <AuthContext.Provider value={{ user: this.state.user, setUser: (user, callback) => this.setState({ user: user }, () => callback ? callback() : null) }}>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<MainLayout />}>
              <Route index element={<MainHome />} />
              <Route path="settings" element={<Settings />} />
              <Route path="profile/:username" element={<Profile />} />
              <Route path="terms-of-service" element={<TermsOfService />} />
              <Route path="privacy-policy" element={<PrivacyPolicy />} />
              <Route path="faq" element={<FAQ />} />
              <Route path="allsquads-review-2023" element={<AllSquadsReview2023 />} />
            </Route>
            <Route path="/miniframe" element={<MiniframeLayout />}>
              <Route index element={<MiniframeGame />} />
            </Route>
            <Route path="/admin" element={<DiscordAdminPanel />}>
              <Route index element={<DiscordAdminPanel />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </AuthContext.Provider>
    )
  }
}

const themeTemplate = responsiveFontSizes((createTheme(theme)));

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <ThemeProvider theme={themeTemplate}>
    <CssBaseline />
    <Router />
    <FirebaseNotifications />
  </ThemeProvider>
);