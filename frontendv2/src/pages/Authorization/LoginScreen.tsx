/* eslint eqeqeq: "off", no-unused-vars: "off" */
import { useState, useEffect, useRef } from 'react';
import { Dialog, Button, Typography, TextField, Grid, Alert, CircularProgress, Link } from '@mui/material';
import { isEmailValid } from '../../utils/functions';
// import eventHandler from '../../event_handler/eventHandler'; TODO: implement app context
// import { putCookie } from '../../cookie_handler'; TODO: implement localStorage

const login_url = 'https://discord.com/api/oauth2/authorize?' + new URLSearchParams({
  client_id: process.env.VITE_ENVIRONMENT == 'dev' ? '878017655028723803' : '832682369831141417',
  redirect_uri: process.env.VITE_SERVER_URL + 'api/allsquads/authorization/discordOAuth2',
  response_type: 'code',
  scope: 'identify email guilds',
  state: `${process.env.VITE_SERVER_URL}`
}).toString();

export default function LoginScreen(props: { user: any, login: (callback?: () => void) => void }) {
  const [open, setOpen] = useState(false);
  const [type, setType] = useState('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [alertMessage, setAlertMessage] = useState('');
  const [callingApi, setCallingApi] = useState(false);
  const alertTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // eventHandler.addListener('requestLogin', openLogin); TODO: implement app context
    // eventHandler.addListener('userLogin/loggedIn', closeLogin); TODO: implement app context

    return () => {
      // eventHandler.removeListener('requestLogin', openLogin); TODO: implement app context
      // eventHandler.removeListener('userLogin/loggedIn', closeLogin); TODO: implement app context
    };
  }, []);

  useEffect(() => {
    if (!alertMessage) return;

    if (alertTimeoutRef.current) {
      clearTimeout(alertTimeoutRef.current);
    }

    alertTimeoutRef.current = setTimeout(() => {
      setAlertMessage('');
    }, 3000);
  }, [alertMessage]);

  const openLogin = () => {
    console.log('opening login page');
    setOpen(true);
  };

  const closeLogin = () => {
    console.log('closing login page');
    setOpen(false);
  };

  const handleLoginSubmit = () => {
    if (!email || !password) return setAlertMessage('Fields cannot be empty');
    if (!isEmailValid(email)) return setAlertMessage('Please enter a valid email address');

    setCallingApi(true);
    fetch(`${process.env.REACT_APP_SOCKET_URL}api/allsquads/authorization/login/email?email=${email}&password=${password}`, { credentials: 'include' })
      .then((res) => res.json())
      .then((res) => {
        setCallingApi(false);
        if (res.code == 200) {
          // putCookie('login_token', res.data.login_token); TODO: implement localStorage
          props.login(() => closeLogin());
        } else {
          return setAlertMessage(res.message || 'Error occured');
        }
      })
      .catch(console.error);
  };

  const handleSignupSubmit = () => {
    if (!email || !password || !confirmPassword) return setAlertMessage('Fields cannot be empty');
    if (password != confirmPassword) return setAlertMessage('Passwords Mismatch');
    if (!isEmailValid(email)) return setAlertMessage('Please enter a valid email address');

    setCallingApi(true);
    fetch(`${process.env.REACT_APP_SOCKET_URL}api/allsquads/authorization/signup/email?email=${email}&password=${password}`, { credentials: 'include' })
      .then((res) => res.json())
      .then((res) => {
        setCallingApi(false);
        console.log(res);
        if (res.code == 200) {
          // putCookie('login_token', res.data.login_token); TODO: implement localStorage
          props.login();
        } else {
          return setAlertMessage(res.message || 'Error occured');
        }
      })
      .catch(console.error);
  };

  return (
    <Dialog onClose={closeLogin} open={props.user ? false : open} sx={{ '& .MuiDialog-paper': { padding: '20px', backgroundColor: 'primary.dark' } }}>
      {type == 'login' ? (
        <Grid container rowSpacing={'20px'}>
          <Grid size={12} display={'flex'} justifyContent={'center'}>
            <Typography variant='h5'>Login</Typography>
          </Grid>
          <Grid size={12} display={'flex'} justifyContent={'center'}>
            <Typography>You will need to login in order to use features on this website</Typography>
          </Grid>
          <Grid size={12}>
            {alertMessage ? <Alert severity='warning'>{alertMessage}</Alert> : <></>}
          </Grid>
          <Grid size={12} display={'flex'} justifyContent={'center'}>
            <TextField color='secondary' fullWidth id="email" label="Email" variant="outlined" value={email} onChange={(e) => setEmail(e.target.value)} />
          </Grid>
          <Grid size={12} display={'flex'} justifyContent={'center'}>
            <TextField color='secondary' fullWidth id="password" label="Password" type='password' value={password} variant="outlined" onChange={(e) => setPassword(e.target.value)} />
          </Grid>
          <Grid size={12} display={'flex'} justifyContent={'center'}>
            <Button color='secondary' variant='contained' onClick={handleLoginSubmit}>{callingApi ? <CircularProgress /> : 'Login'}</Button>
          </Grid>
          <Grid size={12} display={'flex'} justifyContent={'center'}>
            <Typography>OR</Typography>
          </Grid>
          <Grid size={12} display={'flex'} justifyContent={'center'}>
            <Button color='secondary' variant='outlined' href={login_url} startIcon={<img src="/icons/discord-icon.png" width={'32px'} height={'32px'} style={{ margin: '5px' }} />}>Login Via Discord</Button>
          </Grid>
          <Grid size={12} display={'flex'} justifyContent={'center'}>
            <Link style={{ cursor: 'pointer' }} color='secondary.main' onClick={() => setType('signup')}>Don't have an account? Sign up</Link>
          </Grid>
        </Grid>
      ) : (
        <Grid container rowSpacing={'20px'}>
          <Grid size={12} display={'flex'} justifyContent={'center'}>
            <Typography variant='h5'>Signup</Typography>
          </Grid>
          <Grid size={12}>
            {alertMessage ? <Alert severity='warning'>{alertMessage}</Alert> : <></>}
          </Grid>
          <Grid size={12} display={'flex'} justifyContent={'center'}>
            <TextField color='secondary' fullWidth id="email" label="Email" variant="outlined" value={email} onChange={(e) => setEmail(e.target.value)} />
          </Grid>
          <Grid size={12} display={'flex'} justifyContent={'center'}>
            <TextField color='secondary' fullWidth id="password" label="Password" variant="outlined" type='password' value={password} onChange={(e) => setPassword(e.target.value)} />
          </Grid>
          <Grid size={12} display={'flex'} justifyContent={'center'}>
            <TextField color='secondary' fullWidth id="confirm-password" label="Confirm Password" variant="outlined" type='password' value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} />
          </Grid>
          <Grid size={12} display={'flex'} justifyContent={'center'}>
            <Button color='secondary' variant='contained' onClick={handleSignupSubmit}>{callingApi ? <CircularProgress /> : 'Signup'}</Button>
          </Grid>
          <Grid size={12} display={'flex'} justifyContent={'center'}>
            <Link style={{ cursor: 'pointer' }} color='secondary.main' onClick={() => setType('login')}>Already have an account? Log in</Link>
          </Grid>
        </Grid>
      )}
    </Dialog>
  );
};