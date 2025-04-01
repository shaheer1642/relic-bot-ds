/* eslint eqeqeq: "off", no-unused-vars: "off" */
import React, { useState, useEffect, useRef } from 'react';
import { Button, Grid, Typography, CircularProgress, FormControlLabel, Checkbox, MenuList, MenuItem, TextField, Alert } from '@mui/material';
import { config, updateConfig } from '../../utils/config';
import { isEmailValid } from '../../utils/functions';
import { useAuth } from '../../hooks/useAuth';

export default function Settings() {
  const { user, login, logout } = useAuth();

  const [activeMenu, setActiveMenu] = useState(0);
  const [alertMessage, setAlertMessage] = useState('');
  const [callingApi, setCallingApi] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm_password, setConfirmPassword] = useState('');
  const alertTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!alertMessage) return;

    if (alertTimeoutRef.current) {
      clearTimeout(alertTimeoutRef.current);
    }

    alertTimeoutRef.current = setTimeout(() => {
      setAlertMessage('');
    }, 3000);
  }, [alertMessage]);

  const updateEmailPassword = () => {
    if (!email || !password || !confirm_password) return setAlertMessage('Fields cannot be empty');
    if (!isEmailValid(email)) return setAlertMessage('Please enter a valid email address');
    if (password != confirm_password) return setAlertMessage('Passwords mismatch');

    setCallingApi(true);
    fetch(`${process.env.REACT_APP_SOCKET_URL}api/allsquads/authorization/login/email?email=${email}&password=${password}&link_account=true&login_token=${localStorage.getItem('login_token')}`, { credentials: 'include' })
      .then((res) => res.json())
      .then((res) => {
        setCallingApi(false);
        if (res.code == 200) {
          login();
        } else {
          return setAlertMessage(res.message || 'Error occured');
        }
      }).catch(console.error);
  }

  const PanelAlertsAndSounds = (
    <React.Fragment>
      <Grid size={'auto'}>
        <FormControlLabel style={{ userSelect: 'none' }} control={<Checkbox color='secondary' checked={config.play_sounds.new_message} onChange={(e) => updateConfig.play_sounds.new_message(e.target.checked, () => { })} />} label="New Message" />
      </Grid>
      <Grid size={'auto'}>
        <FormControlLabel style={{ userSelect: 'none' }} control={<Checkbox color='secondary' checked={config.play_sounds.squad_open} disabled />} label="Squad Open" />
      </Grid>
    </React.Fragment>
  );

  const PanelAccountManagement = (
    <React.Fragment>
      <Grid size={'auto'}>
        <TextField disabled={user?.email ? true : false} color='secondary' label={user?.email ? 'Email' : 'Set account email'} value={user?.email ? user?.email : email} onChange={(e) => setEmail(e.target.value)} />
      </Grid>
      <Grid size={'auto'}>
        <TextField disabled color='secondary' label='IGN' defaultValue={user?.ingame_name} />
      </Grid>
      <Grid size={12}></Grid>
      <Grid size={'auto'}>
        {user?.password ? <></> : <TextField color='secondary' label='Set account password' onChange={(e) => setPassword(e.target.value)} value={password} />}
      </Grid>
      <Grid size={'auto'}>
        {user?.password ? <></> : <TextField color='secondary' label='Confirm password' onChange={(e) => setConfirmPassword(e.target.value)} value={confirm_password} />}
      </Grid>
      <Grid size={12}>
        <Button
          disabled={user?.discord_id ? true : false}
          color='secondary' variant='outlined'
          startIcon={<img src="/icons/discord-icon.png" width={'32px'} height={'32px'} style={{ margin: '5px' }} />}
          href={user?.discord_id ? undefined : 'https://discord.com/api/oauth2/authorize?' + new URLSearchParams({
            client_id: process.env.REACT_APP_ENVIRONMENT == 'dev' ? '878017655028723803' : '832682369831141417',
            redirect_uri: process.env.REACT_APP_SOCKET_URL + 'api/allsquads/authorization/discordOAuth2',
            response_type: 'code',
            scope: 'identify email guilds',
            state: `${process.env.REACT_APP_SERVER_ADDRESS}settings_true_${localStorage.getItem('login_token')}`
          }).toString()}
        >
          {user?.discord_id ? `Connected as ${user?.discord_profile?.username}#${user?.discord_profile?.discriminator}` : `Link Discord Account`}
        </Button>
      </Grid>
      {!user?.email ?
        <Grid size={12}>
          <Button color='secondary' variant='contained' onClick={() => updateEmailPassword()}>
            {callingApi ? <CircularProgress /> : 'Save Changes'}
          </Button>
        </Grid> : <></>
      }
    </React.Fragment>
  );

  const PanelsList = [{
    title: 'Account Management',
    element: PanelAccountManagement
  }, {
    title: 'Alerts & Sounds',
    element: PanelAlertsAndSounds
  }];

  return (
    <Grid container padding="20px" display={'flex'} alignItems={'center'} justifyContent={'center'} height={'100%'}>
      <Grid size={12} justifyContent="center" display={"flex"}>
        <Typography variant='h3'>Settings</Typography>
      </Grid>
      <Grid size={{ xs: 3, xl: 2 }} sx={{ backgroundColor: 'primary.light', boxShadow: '20px', minHeight: '50vh', paddingTop: '20px' }}>
        <MenuList disablePadding>
          {PanelsList.map((panel, index) => (
            <MenuItem key={panel.title} onClick={() => setActiveMenu(index)}>
              <Typography variant="h6" sx={{ color: activeMenu == index ? 'secondary.dark' : 'text.secondary' }}>
                {panel.title}
              </Typography>
            </MenuItem>
          ))}
          <MenuItem key={'logout'} onClick={() => logout()}>
            <Typography variant="h6" sx={{ color: 'red' }}>Logout</Typography>
          </MenuItem>
        </MenuList>
      </Grid>
      <Grid size={{ xs: 9, xl: 10 }} sx={{ backgroundColor: 'primary.main', minHeight: '50vh', padding: '20px' }}>
        <Grid container rowSpacing={'10px'} columnSpacing={'10px'}>
          <Grid size={12}>
            <Typography variant="h4" color="text.secondary">
              {PanelsList[activeMenu]?.title}
            </Typography>
          </Grid>
          <Grid size={12}>
            {alertMessage ? <Alert severity='warning'>{alertMessage}</Alert> : <></>}
          </Grid>
          {PanelsList[activeMenu]?.element}
        </Grid>
      </Grid>
    </Grid>
  );
}