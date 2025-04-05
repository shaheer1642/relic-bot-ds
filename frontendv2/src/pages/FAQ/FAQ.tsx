/* eslint eqeqeq: "off", no-unused-vars: "off" */
import React, { useState, useEffect } from 'react';
import { Typography, CircularProgress, Grid } from '@mui/material';
import { socket } from '../../socket';
import { ISocketResponse } from '../../interfaces/ISocketResponse';
import { IFaq } from '../../interfaces/IFaq';

export default function FAQ() {
  const [faqs, setFaqs] = useState<IFaq[] | undefined>(undefined);

  useEffect(() => {
    socket.emit('allsquads/faqs/fetch', {}, (res: ISocketResponse) => {
      console.log(res)
      if (res.code == 200) {
        setFaqs(res.data)
      }
    })
  }, []);

  if (!faqs) return <CircularProgress />

  const formatText = () => {
    var headCounter = 1
    return (
      <React.Fragment>
        {faqs.map(faq => (
          <React.Fragment key={headCounter}>
            <Typography>{'\u200b'}</Typography>
            <Typography variant='h5' color='secondary.main'>{`${headCounter++}. ${faq.title.en}`}</Typography>
            <Typography>{'\u200b'}</Typography>
            {faq.body.en.split('\r\n').map((line: string, index: number) => (
              <Typography key={index}>{line?.replace(/\*/g, '') || '\u200b'}</Typography>
            ))}
            {faq.image_url?.en ? <img src={faq.image_url.en} style={{ maxWidth: '100%' }} alt={faq.title.en} /> : null}
          </React.Fragment>
        ))}
      </React.Fragment>
    )
  }

  return (
    <Grid container
      rowSpacing={'10px'}
      columnSpacing='20px'
      padding='20px'
    >
      <Grid size={12} justifyContent='center' display='flex'>
        <Typography variant='h4'>Frequency Asked Questions (FAQ)</Typography>
      </Grid>
      <Grid size={12}>
        {formatText() || <CircularProgress />}
      </Grid>
    </Grid>
  );
}