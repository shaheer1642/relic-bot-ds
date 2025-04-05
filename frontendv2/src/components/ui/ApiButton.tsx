/* eslint eqeqeq: "off", no-unused-vars: "off" */
import React, { useState } from 'react';
import { Button, CircularProgress } from '@mui/material';
// import eventHandler from '../../event_handler/eventHandler'; TODO: implement app context

interface ApiButtonProps {
  style?: React.CSSProperties; // TODO: update type
  disabled?: boolean;
  variant?: 'text' | 'contained' | 'outlined';
  color?: 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning';
  startIcon?: React.ReactNode;
  onClick: (event: React.MouseEvent, callback: () => void) => void; // TODO: verify type
  size?: 'small' | 'medium' | 'large';
  label: string;
  user?: {
    ingame_name?: string;
  };
}

export default function ApiButton({
  style,
  disabled = false,
  variant,
  color,
  startIcon,
  onClick,
  size,
  label,
  user
}: ApiButtonProps) {
  const [callingApi, setCallingApi] = useState(false);

  const handleClick = (e: React.MouseEvent) => {
    if (!user) {
      // eventHandler.emit('requestLogin', {}); TODO: implement app context
      return;
    }
    if (!user.ingame_name) {
      // eventHandler.emit('requestVerify', {}); TODO: implement app context
      return;
    }

    setCallingApi(true);
    onClick(e, () => {
      setCallingApi(false);
    });
  };

  return (
    <Button
      style={style}
      disabled={disabled || callingApi}
      variant={variant}
      color={color}
      startIcon={callingApi ? null : startIcon}
      onClick={handleClick}
      size={size}
    >
      {callingApi ? <CircularProgress size='25px' color='secondary' /> : label}
    </Button>
  );
};