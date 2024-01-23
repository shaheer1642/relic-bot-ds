/* eslint eqeqeq: "off", no-unused-vars: "off" */
import React from 'react';
import {Dialog, DialogTitle, DialogActions, DialogContent, DialogContentText, Button, Typography, TextField, Grid, Alert, CircularProgress, Link} from '@mui/material';
import {socket,socketHasConnected} from '../../websocket/socket'
import { convertUpper, isEmailValid } from '../../functions';
import eventHandler from '../../event_handler/eventHandler';
import { withHooksHOC } from '../../withHooksHOC';
import { putCookie } from '../../cookie_handler';

const login_url = 'https://discord.com/api/oauth2/authorize?' + new URLSearchParams({
    client_id: process.env.REACT_APP_ENVIRONMENT == 'dev' ? '878017655028723803' : '832682369831141417',
    redirect_uri: process.env.REACT_APP_SOCKET_URL+'api/allsquads/authorization/discordOAuth2',
    response_type: 'code',
    scope:'identify email guilds',
    state: `${process.env.REACT_APP_SERVER_ADDRESS}`
}).toString();

class LoginScreen extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      open: false,
      type: 'login',
      email: '',
      password: '',
      confirm_password: '',
      alertMessage: '',
      callingApi: false
    }
    this.alertTimeout = null
  }

  componentDidMount() {
    eventHandler.addListener('requestLogin', this.openLogin)
    eventHandler.addListener('userLogin/loggedIn', this.closeLogin)
  }

  componentWillUnmount() {
    eventHandler.removeListener('requestLogin', this.openLogin)
    eventHandler.removeListener('userLogin/loggedIn', this.closeLogin)
  }

  componentDidUpdate(prevProps, prevState, snapshot) {
    if (!prevState.alertMessage && !this.state.alertMessage) return
    clearTimeout(this.alertTimeout)
    this.alertTimeout = setTimeout(() => {
      this.setState({alertMessage: ''})
    }, 3000);
  }

  openLogin = () => {
    console.log('opening login page')
    this.setState({open: true})
  }

  closeLogin = () => {
    console.log('closing login page')
    this.setState({open: false})
  }

  LoginSubmit = (e) => {
    if (!this.state.email || !this.state.password) return this.setState({alertMessage: 'Fields cannot be empty'})
    if (!isEmailValid(this.state.email)) return this.setState({alertMessage: 'Please enter a valid email address'})
    this.setState({callingApi: true})
    fetch(`${process.env.REACT_APP_SOCKET_URL}api/allsquads/authorization/login/email?email=${this.state.email}&password=${this.state.password}`, {credentials: 'include'}).then((res) => res.json())
    .then((res) => {
        this.setState({callingApi: false})
        if (res.code == 200) {
          putCookie('login_token',res.data.login_token)
          this.props.login(() => this.closeLogin()) 
        } else {
          return this.setState({alertMessage: res.message || 'Error occured'})
        }
    }).catch(console.error);
  }

  SignupSubmit = (e) => {
    if (!this.state.email || !this.state.password || !this.state.confirm_password) return this.setState({alertMessage: 'Fields cannot be empty'})
    if (this.state.password != this.state.confirm_password) return this.setState({alertMessage: 'Passwords Mismatch'})
    if (!isEmailValid(this.state.email)) return this.setState({alertMessage: 'Please enter a valid email address'})
    this.setState({callingApi: true})
    fetch(`${process.env.REACT_APP_SOCKET_URL}api/allsquads/authorization/signup/email?email=${this.state.email}&password=${this.state.password}`, {credentials: 'include'})
    .then((res) => res.json())
    .then((res) => {
        this.setState({callingApi: false})
        console.log(res)
        if (res.code == 200) {
          putCookie('login_token',res.data.login_token)
          this.props.login()
        } else {
          return this.setState({alertMessage: res.message || 'Error occured'})
        }
    }).catch(console.error);
  }


  render() {
    return (
      <Dialog onClose={this.closeLogin} open={this.props.user? false : this.state.open} sx={{ '& .MuiDialog-paper': { padding: '20px', backgroundColor: 'primary.dark' } }}>
        {this.state.type == 'login' ? 
          <Grid container rowSpacing={'20px'}>
              <Grid item xs={12} display={'flex'} justifyContent={'center'}>
                <Typography variant='h5'>Login</Typography>
              </Grid>
              <Grid item xs={12} display={'flex'} justifyContent={'center'}>
                <Typography>You will need to login in order to use features on this website</Typography>
              </Grid>
              <Grid item xs={12}>
                {this.state.alertMessage ? <Alert severity='warning'>{this.state.alertMessage}</Alert>:<></>}
              </Grid>
              <Grid item xs={12} display={'flex'} justifyContent={'center'}>
                <TextField color='secondary' fullWidth id="email" label="Email" variant="outlined" value={this.state.email} onChange={(e) => this.setState({email: e.target.value})}/>
              </Grid>
              <Grid item xs={12} display={'flex'} justifyContent={'center'}>
                <TextField color='secondary' fullWidth id="password" label="Password" type='password' value={this.state.password} variant="outlined" onChange={(e) => this.setState({password: e.target.value})}/>
              </Grid>
              <Grid item xs={12} display={'flex'} justifyContent={'center'}>
                <Button color='secondary' variant='contained' onClick={this.LoginSubmit}>{this.state.callingApi ? <CircularProgress/> : 'Login'}</Button>
              </Grid>
              <Grid item xs={12} display={'flex'} justifyContent={'center'}>
                <Typography>OR</Typography>
              </Grid>
              <Grid item xs={12} display={'flex'} justifyContent={'center'}>
                <Button color='secondary' variant='outlined' href={login_url} startIcon={<img src="/icons/discord-icon.png" width={'32px'} height={'32px'} style={{margin: '5px'}}/>}>Login Via Discord</Button>
              </Grid>
              <Grid item xs={12} display={'flex'} justifyContent={'center'}>
                <Link style={{ cursor: 'pointer' }} color='secondary.main' onClick={() => this.setState({type: 'signup'})}>Don't have an account? Sign up</Link>
              </Grid>
          </Grid>
          : 
          <Grid container rowSpacing={'20px'}>
              <Grid item xs={12} display={'flex'} justifyContent={'center'}>
                <Typography variant='h5'>Signup</Typography>
              </Grid>
              <Grid item xs={12}>
                {this.state.alertMessage ? <Alert severity='warning'>{this.state.alertMessage}</Alert>:<></>}
              </Grid>
              <Grid item xs={12} display={'flex'} justifyContent={'center'}>
                <TextField color='secondary' fullWidth id="email" label="Email" variant="outlined" value={this.state.email} onChange={(e) => this.setState({email: e.target.value})}/>
              </Grid>
              <Grid item xs={12} display={'flex'} justifyContent={'center'}>
                <TextField color='secondary' fullWidth id="password" label="Password" variant="outlined" type='password' value={this.state.password} onChange={(e) => this.setState({password: e.target.value})}/>
              </Grid>
              <Grid item xs={12} display={'flex'} justifyContent={'center'}>
                <TextField color='secondary' fullWidth id="confirm-password" label="Confirm Password" variant="outlined" type='password' value={this.state.confirm_password} onChange={(e) => this.setState({confirm_password: e.target.value})}/>
              </Grid>
              <Grid item xs={12} display={'flex'} justifyContent={'center'}>
                <Button color='secondary' variant='contained' onClick={this.SignupSubmit}>{this.state.callingApi ? <CircularProgress/> : 'Signup'}</Button>
              </Grid>
              <Grid item xs={12} display={'flex'} justifyContent={'center'}>
                <Link style={{ cursor: 'pointer' }} color='secondary.main' onClick={() => this.setState({type: 'login'})}>Already have an account? Log in</Link>
              </Grid>
          </Grid>
        }
      </Dialog>
    );
  }
}

export default withHooksHOC(LoginScreen);