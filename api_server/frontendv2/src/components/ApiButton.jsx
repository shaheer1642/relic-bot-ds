/* eslint eqeqeq: "off", no-unused-vars: "off" */
import React from 'react';
import { Dialog, DialogTitle, DialogActions, DialogContent, DialogContentText, Button, Drawer, Grid, Typography, CircularProgress } from '@mui/material';
import { socket, socketHasConnected } from '../websocket/socket'
import eventHandler from '../event_handler/eventHandler';
import { withHooksHOC } from '../withHooksHOC';
import { useState } from 'react';
import { useEffect } from 'react';

export default function ApiButton({ style, disabled, variant, color, startIcon, user, onClick, size, label }) {

  const [callingApi, setCallingApi] = useState(false)

  useEffect(() => {
    onClick(e, () => {
      setCallingApi(false)
    })
  }, [callingApi])

  return (
    <Button
      style={style}
      disabled={disabled || callingApi ? true : false}
      variant={variant}
      color={color}
      startIcon={callingApi ? null : startIcon}
      onClick={(e) => {
        if (!user) return eventHandler.emit('requestLogin', {})
        if (!user.ingame_name) return eventHandler.emit('requestVerify', {})
        setCallingApi(true)
      }}
      size={size}
    >
      {callingApi ? <CircularProgress size='25px' color='secondary' /> : label}
    </Button>
  )
}