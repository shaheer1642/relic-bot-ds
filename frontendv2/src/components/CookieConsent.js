/* eslint eqeqeq: "off", no-unused-vars: "off" */
import React from 'react';
import { Link, Outlet } from "react-router-dom";
import {Dialog, DialogTitle, DialogActions, DialogContent, DialogContentText, Button} from '@mui/material';
import {socket,socketHasConnected} from '../../websocket/socket'
import { convertUpper } from '../../functions';
import eventHandler from '../../event_handler/eventHandler';
import { getCookie, putCookie } from '../../cookie_handler';
import { withHooksHOC } from '../../withHooksHOC';

class CookieConsent extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
        open : getCookie('allow_cookies') == undefined ? true : false
    }
  }

  componentDidMount() {
  }

  componentWillUnmount() {
  }

  componentDidUpdate() {
  }

  render() {
    return (
      <Dialog open={this.state.open} onClose={() => this.setState({open: false})}
      sx={{ '& .MuiDialog-paper': { padding: '20px' } }}
      >
        <DialogTitle>Cookies</DialogTitle>
        <DialogContent>
          <DialogContentText>
            This website uses cookies to enable some basic functions to help improve your browsing experience.
          </DialogContentText>
        </DialogContent>
        <DialogActions style={{justifyContent: 'center'}}>
            <Button variant='contained' onClick={() => {
                document.cookie = `allow_cookies=true;path=/;max-age=31556952`;
                this.setState({open: false})
            }}>Accept Cookies</Button>
            <Button variant='outlined' onClick={() => {
                document.cookie = `allow_cookies=false;path=/;max-age=31556952`;
                this.setState({open: false})
            }}>Reject Cookies</Button>
        </DialogActions>
      </Dialog>
    );
  }
}

export default withHooksHOC(CookieConsent);