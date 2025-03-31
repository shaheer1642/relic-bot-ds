/* eslint eqeqeq: "off", no-unused-vars: "off" */
import { useState } from 'react';
import { Dialog, DialogTitle, DialogActions, DialogContent, DialogContentText, Button } from '@mui/material';
// import { getCookie } from '../../cookie_handler'; TODO: implement localStorage

export default function CookieConsent() {
  // TODO: implement localStorage
  // const [open, setOpen] = useState(getCookie('allow_cookies') == undefined ? true : false);
  const [open, setOpen] = useState(true);

  return (
    <Dialog
      open={open}
      onClose={() => setOpen(false)}
      sx={{ '& .MuiDialog-paper': { padding: '20px' } }}
    >
      <DialogTitle>Cookies</DialogTitle>
      <DialogContent>
        <DialogContentText>
          This website uses cookies to enable some basic functions to help improve your browsing experience.
        </DialogContentText>
      </DialogContent>
      <DialogActions style={{ justifyContent: 'center' }}>
        <Button
          variant='contained'
          onClick={() => {
            document.cookie = `allow_cookies=true;path=/;max-age=31556952`;
            setOpen(false);
          }}
        >
          Accept Cookies
        </Button>
        <Button
          variant='outlined'
          onClick={() => {
            document.cookie = `allow_cookies=false;path=/;max-age=31556952`;
            setOpen(false);
          }}
        >
          Reject Cookies
        </Button>
      </DialogActions>
    </Dialog>
  );
}