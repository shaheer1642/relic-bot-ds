/* eslint eqeqeq: "off", no-unused-vars: "off" */
import React from 'react';
import {Dialog, DialogTitle, DialogActions, DialogContent, DialogContentText, Button, Drawer, Grid, Typography, CircularProgress} from '@mui/material';
import {socket,socketHasConnected} from '../websocket/socket'
import eventHandler from '../event_handler/eventHandler';
import { withHooksHOC } from '../withHooksHOC';

class ApiButton extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      callingApi: false
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
        <Button 
            style={this.props.style}
            disabled={this.props.disabled || this.state.callingApi ? true : false}
            variant={this.props.variant}
            color={this.props.color}
            startIcon={this.state.callingApi ? null : this.props.startIcon}
            onClick={(e) => {
                if (!this.props.user) return eventHandler.emit('requestLogin', {})
                if (!this.props.user.ingame_name) return eventHandler.emit('requestVerify', {})
                this.setState({callingApi: true} , () => {
                    this.props.onClick(e, () => {
                        this.setState({callingApi: false})
                    })
                })
            }}
            size={this.props.size}
        >
            {this.state.callingApi ? <CircularProgress size='25px' color='secondary' /> : this.props.label}
        </Button>
    );
  }
}


export default withHooksHOC(ApiButton);