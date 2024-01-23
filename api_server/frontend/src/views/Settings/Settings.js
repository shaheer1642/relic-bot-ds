/* eslint eqeqeq: "off", no-unused-vars: "off" */
import React from 'react';
import {Dialog, DialogTitle, DialogActions, DialogContent, 
  DialogContentText, Button, Drawer, Grid, Typography, 
  CircularProgress, FormControlLabel, Checkbox, List, ListItem, ListItemButton, ListItemIcon, ListItemText, MenuList, MenuItem, Paper, TextField, Alert
} from '@mui/material';
import {ArrowBack,} from '@mui/icons-material'
import { withHooksHOC } from '../../withHooksHOC';
import {config, updateConfig} from '../../config';
// import { attemptAuthenticate, this.props.user } from '../../objects/user_login';
import { getCookie } from '../../cookie_handler';
import { isEmailValid } from '../../functions';

class Settings extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      activeMenu: 0,
      alertMessage: '',
      callingApi: false,

      email: '',
      password: '',
      confirm_password: ''
    }
    this.alertTimeout = null
  }

  componentDidMount() {
  }

  componentWillUnmount() {
  }

  componentDidUpdate(prevProps, prevState, snapshot) {
    if (!prevState.alertMessage && !this.state.alertMessage) return
    clearTimeout(this.alertTimeout)
    this.alertTimeout = setTimeout(() => {
      this.setState({alertMessage: ''})
    }, 3000);

    // if (this.props.user?.email != prevState.email) {
    //   this.setState({email: this.props.user.email})
    // }
  }

  updateEmailPassword = () => {
    if (!this.state.email || !this.state.password || !this.state.confirm_password) return this.setState({alertMessage: 'Fields cannot be empty'})
    if (!isEmailValid(this.state.email)) return this.setState({alertMessage: 'Please enter a valid email address'})
    if (this.state.password != this.state.confirm_password) return this.setState({alertMessage: 'Passwords mismatch'})
    this.setState({callingApi: true})
    fetch(`${process.env.REACT_APP_SOCKET_URL}api/allsquads/authorization/login/email?email=${this.state.email}&password=${this.state.password}&link_account=true&login_token=${getCookie('login_token')}`,{credentials: 'include'})
    .then((res) => res.json())
    .then((res) => {
        this.setState({callingApi: false})
        if (res.code == 200) {
          this.props.login()
        } else {
          return this.setState({alertMessage: res.message || 'Error occured'})
        }
    }).catch(console.error);
  }
  

  render() {
    const PanelAlertsAndSounds = (
      <React.Fragment>
        <Grid item xs={'auto'}>
          <FormControlLabel style={{userSelect: 'none'}} control={<Checkbox color='secondary' checked={config.play_sounds.new_message} onChange={(e) => updateConfig.play_sounds.new_message(e.target.checked, () => this.forceUpdate())}/>} label="New Message" />
        </Grid>
        <Grid item xs={'auto'}>
          <FormControlLabel style={{userSelect: 'none'}} control={<Checkbox color='secondary' checked={config.play_sounds.squad_open} disabled />} label="Squad Open" />
        </Grid>
      </React.Fragment>
    )

    const PanelAccountManagement = (
      <React.Fragment>
        <Grid item xs={'auto'}>
          <TextField disabled = {this.props.user?.email ? true : false}  color='secondary' label={this.props.user?.email ? 'Email' : 'Set account email'} value={this.props.user?.email ? this.props.user?.email:this.state.email} onChange={(e) => this.setState({email: e.target.value})}/>
        </Grid>
        <Grid item xs={'auto'}>
          <TextField disabled color='secondary' label='IGN' defaultValue={this.props.user?.ingame_name}/>
        </Grid>
        <Grid item xs={12}></Grid>
        <Grid item xs={'auto'}>
          {this.props.user?.password ? <></> : <TextField color='secondary' label='Set account password' onChange={(e) => this.setState({password: e.target.value})} value={this.state.password}/>}
        </Grid>
        <Grid item xs={'auto'}>
          {this.props.user?.password ? <></> : <TextField color='secondary' label='Confirm password' onChange={(e) => this.setState({confirm_password: e.target.value})} value={this.state.confirm_password}/>}
        </Grid>
        <Grid item xs={12}>
          <Button 
            disabled = {this.props.user?.discord_id ? true : false} 
            color='secondary' variant='outlined' 
            startIcon={<img src="/icons/discord-icon.png" width={'32px'} height={'32px'} style={{margin: '5px'}}/>}
            href={this.props.user?.discord_id ? null : 'https://discord.com/api/oauth2/authorize?' + new URLSearchParams({
              client_id: process.env.REACT_APP_ENVIRONMENT == 'dev' ? '878017655028723803' : '832682369831141417',
              redirect_uri: process.env.REACT_APP_SOCKET_URL+'api/allsquads/authorization/discordOAuth2',
              response_type: 'code',
              scope:'identify email guilds',
              state: `${process.env.REACT_APP_SERVER_ADDRESS}settings_true_${getCookie('login_token')}`
          }).toString()}
          >
            {this.props.user?.discord_id ? `Connected as ${this.props.user?.discord_profile?.username}#${this.props.user?.discord_profile?.discriminator}` : `Link Discord Account`}
          </Button>
        </Grid>
        {!this.props.user?.email ?
          <Grid item xs={12}>
            <Button color='secondary' variant='contained' onClick={() => this.updateEmailPassword()}>
              {this.state?.callingApi ? <CircularProgress /> : 'Save Changes'}
            </Button>
          </Grid>:<></>
        }
      </React.Fragment>
    )
    
    const PanelsList = [{
      title: 'Account Management',
      element: PanelAccountManagement
    },{
      title: 'Alerts & Sounds',
      element: PanelAlertsAndSounds
    }]

    return (
      <Grid container padding="20px" display={'flex'} alignItems={'center'} justifyContent={'center'} height={'100%'}> 
        <Grid item xs={12} justifyContent="center" display={"flex"}>
          <Typography variant='h3'>Settings</Typography>
        </Grid>
        <Grid item xs={3} xl={2} sx={{ backgroundColor: 'primary.light', boxShadow: '20px', minHeight: '50vh', paddingTop: '20px'}}>
          <MenuList disablePadding>
            {PanelsList.map((panel, index) => (
              <MenuItem key={panel.title} onClick={() => this.setState({activeMenu: index})}>
                <Typography variant="h6" sx={{color: this.state.activeMenu == index ? 'secondary.dark' : 'text.secondary'}}>
                  {panel.title}
                </Typography>
              </MenuItem>
            ))}
            <MenuItem key={'logout'} onClick={() => this.props.logout()}>
              <Typography variant="h6" sx={{color: 'red'}}>Logout</Typography>
            </MenuItem>
          </MenuList>
        </Grid>
        <Grid item xs={9} xl={10} sx={{backgroundColor: 'primary.main', minHeight: '50vh', padding: '20px'}}>
          <Grid container rowSpacing={'10px'} columnSpacing={'10px'}>
            <Grid item xs={12}>
              <Typography variant="h4" color="text.secondary">
                {PanelsList[this.state.activeMenu]?.title}
              </Typography>
            </Grid>
            <Grid item xs={12}>
              {this.state.alertMessage ? <Alert severity='warning'>{this.state.alertMessage}</Alert>:<></>}
            </Grid>
            {PanelsList[this.state.activeMenu]?.element}
          </Grid>
        </Grid>
      </Grid>
    );
  }
}


{/* <Typography variant='h4'></Typography>
 */}

export default withHooksHOC(Settings);