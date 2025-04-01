/* eslint eqeqeq: "off", no-unused-vars: "off" */
import React, { useState, useEffect } from 'react';
import { Typography, CircularProgress, Grid } from '@mui/material';
import terms_of_service from '../../terms-of-service.txt'

export default function TermsOfService() {
  const [termsOfService, setTermsOfService] = useState<string | null>(null);

  useEffect(() => {
    fetch(terms_of_service)
      .then(res => res.text())
      .then(text => setTermsOfService(text))
      .catch(console.error);
  }, []);

  const formatText = (text: string) => {
    if (!text) return;
    let headCounter = 1;
    return (
      <React.Fragment>
        {text.replace(/\r\n/g, '\n').split('\n').map((line: string) => {
          if (line.startsWith('##') && line.endsWith('##'))
            return <Typography variant='h5' color='secondary.main'>{`${headCounter++}. ${line.replace(/#/g, '')}`}</Typography>
          else
            return <Typography>{line || '\u200b'}</Typography>
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
        <Typography variant='h4'>Terms of Service</Typography>
      </Grid>
      <Grid size={12}>
        {termsOfService ? formatText(termsOfService) : <CircularProgress />}
      </Grid>
    </Grid>
  );
};