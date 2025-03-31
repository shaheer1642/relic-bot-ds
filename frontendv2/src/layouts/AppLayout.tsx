/* eslint eqeqeq: "off", no-unused-vars: "off" */
import { useEffect } from 'react';
import { Outlet, useNavigate, useSearchParams } from "react-router-dom";
import { AppBar, Toolbar, Typography, Button, Fab, Grid } from '@mui/material';
import { Chat } from '@mui/icons-material'
import { Settings } from '@mui/icons-material';
import { socket } from '../socket'
import Footer from '../components/Footer';
import LoginScreen from '../views/Authorization/LoginScreen';
import Chats from '../views/Chats/Chats';
// import eventHandler from '../event_handler/eventHandler'; TODO: implement app context
import CookieConsent from '../views/CookieConsent/CookieConsent';
import Verification from '../views/Verification/Verification';
import { useAuth } from '../hooks/useAuth';
// import { putCookie } from '../cookie_handler'; TODO: implement local storage

export default function MainLayout() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { user, login } = useAuth();

  useEffect(() => {
    console.log('[MainLayout] mounted')

    login()

    // eventHandler.addListener('user/logout', handleLogout) TODO: implement app context
    socket.on('allsquads/users/update', updateUserContext)

    if (searchParams.has('login_token')) {
      const login_token = searchParams.get('login_token');
      if (login_token) {
        // putCookie('login_token', login_token) TODO: implement local storage
        login()
        setTimeout(() => {
          // TODO: original code
          // setSearchParams(searchParams.delete('login_token'))
          searchParams.delete('login_token')
        }, 1000);
      }
    }

    return () => {
      console.log('[MainLayout] unmounted')
      // eventHandler.removeListener('user/logout', handleLogout) TODO: implement app context
      socket.off('allsquads/users/update', updateUserContext)
    }
  }, [])

  const updateUserContext = (data: any) => {
    if (user?.user_id == data.user_id) {
      const updatedIGN = user?.ingame_name != data.ingame_name ? true : false
      login(() => {
        // if (updatedIGN) eventHandler.emit('user/updatedIGN') TODO: implement app context
      })
    }
  }

  const handleLogout = () => {
    navigate('/')
  }

  return (
    <Grid container>
      <Grid size={12}>
        <AppBar position="static" sx={{ backgroundColor: 'secondary.main' }}>
          <Toolbar>
            <Typography
              variant="h6"
              noWrap
              component="a"
              href="/"
              sx={{
                flexGrow: 1,
                mr: 2,
                display: { xs: 'flex' },
                textDecoration: 'none',
                color: 'text.primary'
              }}
            >
              Warframe Squads
            </Typography>
            {user ?
              <Typography
                variant="h6"
                noWrap
                component="a"
                href={`/profile/${user.ingame_name}`}
                sx={{
                  mr: 2,
                  display: { xs: 'flex' },
                  textDecoration: 'none',
                  color: 'inherit'
                }}
              >
                Logged in as {user.ingame_name}
              </Typography>
              :
              <Button color="primary" variant='contained' onClick={() => {
                // eventHandler.emit('requestLogin') TODO: implement app context
              }}>Login</Button>
            }
            {user ? <Button color="inherit" onClick={() => navigate('settings')}><Settings /></Button> : <></>}
          </Toolbar>
        </AppBar>
      </Grid>
      <Grid size={12} minHeight='80vh' sx={{ backgroundColor: 'primary.dark' }}>
        <Outlet />
      </Grid>
      <Grid size={12}>
        <Footer />
      </Grid>
      <LoginScreen />
      <Chats />
      <Fab
        sx={{
          position: 'fixed',
          right: '20px',
          bottom: '20px',
          color: 'white',
          backgroundColor: 'secondary.main',
          ':hover': { backgroundColor: 'secondary.light' }
        }}
        onClick={() => {
          // TODO: implement app context
          // if (!user) return eventHandler.emit('requestLogin', {})
          // if (!user.ingame_name) return eventHandler.emit('requestVerify', {})
          // eventHandler.emit('openChat', {})
        }}
      >
        <Chat />
      </Fab>
      <CookieConsent />
      <Verification />
    </Grid>
  );
}