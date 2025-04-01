/* eslint eqeqeq: "off", no-unused-vars: "off" */
import React, { useState, useEffect } from 'react';
import { Typography, CircularProgress, Grid } from '@mui/material';
import privacy_policy from '../../privacy-policy.txt'

export default function PrivacyPolicy() {
  const [privacyPolicy, setPrivacyPolicy] = useState<string | null>(null);

  useEffect(() => {
    fetch(privacy_policy)
      .then(res => res.text())
      .then(text => setPrivacyPolicy(text))
      .catch(console.error);
  }, []);

  const formatText = (text: string) => {
    if (!text) return;
    let headCounter = 1;
    return (
      <React.Fragment>
        {text.replace(/\r\n/g, '\n').split('\n').map((line: string) => {
          if (line.startsWith('##') && line.endsWith('##'))
            return <Typography key={headCounter} variant='h5' color='secondary.main'>{`${headCounter++}. ${line.replace(/#/g, '')}`}</Typography>
          else
            return <Typography key={line}>{line || '\u200b'}</Typography>
        })}
      </React.Fragment>
    );
  };

  return (
    <Grid container
      rowSpacing={'10px'}
      columnSpacing='20px'
      padding='20px'
    >
      <Grid size={12} justifyContent='center' display='flex'>
        <Typography variant='h4'>Privacy Policy</Typography>
      </Grid>
      <Grid size={12}>
        {privacyPolicy ? formatText(privacyPolicy) : <CircularProgress />}
      </Grid>
    </Grid>
  );
};