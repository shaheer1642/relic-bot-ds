/* eslint eqeqeq: "off", no-unused-vars: "off" */
import React from 'react';
import { Typography, Grid, Link } from '@mui/material';
import { withHooksHOC } from '../withHooksHOC';
import theme from '../theme';

class MainFooter extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
    };

    this.special_thanks_members = [
      'Crive33', '--FL--MattHarrigan', 'tia1331', '-Isana_Yashiro-', 'JohnWickPrime', '--DR--XIII.XI.MMVIII', 'Ady88', 'Leopard33'
    ]
  }

  componentDidMount() {
  }

  componentWillUnmount() {
  }

  render() {
    return (
      <Grid container
        sx={{ backgroundColor: 'primary.main', borderTop: `2px solid ${theme.palette.secondary.main}`, padding: '10px' }}
        alignItems='center'
        justifyContent='center'
        rowSpacing={'10px'}
        columnSpacing='20px'
      >
        {/* <Grid item xs='auto'>
          <Typography variant='h4'>AllSquads</Typography>
        </Grid>
        <Grid item xs={12}></Grid> */}
        <Grid item xs={'auto'}>
          <Link style={{ cursor: 'pointer' }} color={'secondary.main'} onClick={() => { this.props.navigate('faq'); window.scrollTo({ top: 0, behavior: "smooth" }) }}>FAQ</Link>
        </Grid>
        <Grid item xs={'auto'}>|</Grid>
        <Grid item xs={'auto'}>
          <Link style={{ cursor: 'pointer' }} color={'secondary.main'} onClick={() => { this.props.navigate('terms-of-service'); window.scrollTo({ top: 0, behavior: "smooth" }) }}>Terms of Service</Link>
        </Grid>
        <Grid item xs={'auto'}>|</Grid>
        <Grid item xs={'auto'}>
          <Link style={{ cursor: 'pointer' }} color={'secondary.main'} onClick={() => { this.props.navigate('privacy-policy'); window.scrollTo({ top: 0, behavior: "smooth" }) }}>Privacy Policy</Link>
        </Grid>
        <Grid item xs={'auto'}>|</Grid>
        <Grid item xs={'auto'}>
          <Link style={{ cursor: 'pointer' }} color={'secondary.main'} onClick={() => { this.props.navigate('allsquads-review-2023'); window.scrollTo({ top: 0, behavior: "smooth" }) }}>AllSquads 2023 Review</Link>
        </Grid>
        <Grid item xs={12}></Grid>
        <Grid item xs={'auto'} alignItems='center' display='flex'>
          <img src="/icons/discord-icon.png" width={'32px'} height={'32px'} style={{ margin: '5px' }} />
          <Link href="https://discord.gg/invite/346ZthxCe8" color={'secondary.main'}>Join us on Discord</Link>
        </Grid>
        <Grid item xs={'auto'}>|</Grid>
        <Grid item xs={'auto'} alignItems='center' display='flex'>
          <img src="/icons/patreon-icon.png" width={'24px'} height={'24px'} style={{ margin: '5px' }} />
          <Link href="https://www.patreon.com/warframehub" color={'secondary.main'}>Support us on Patreon</Link>
        </Grid>
        <Grid item xs={12}></Grid>
        <Grid item xs={12} justifyContent='center' display={'flex'}>
          <Typography sx={{ wordWrap: 'break-word' }} color='secondary.dark'>
            DISCLAIMER: Digital Extremes and Warframe are registered trademarks. This website has no direct affiliation with Digital Extremes. All recognizable artwork is intellectual property of these trademarks.
          </Typography>
        </Grid>
        <Grid item xs={12} justifyContent='center' display={'flex'}>
          <Typography sx={{ wordWrap: 'break-word' }} color='primary.light'>
            {`Special thanks to the following members for helping development of this project: ${this.special_thanks_members.sort().join(', ')}`}
          </Typography>
        </Grid>
        <Grid item xs={12} justifyContent='center' display={'flex'}>
          <Typography sx={{ wordWrap: 'break-word' }} color='primary.light'>
            {`Sound effects are taken from `}
            <Link href="https://pixabay.com/" target='_blank' color='primary.light'>Pixaby</Link>
          </Typography>
        </Grid>
        <Grid item xs={12} justifyContent='center' display={'flex'}>
          <Typography>© AllSquads 2022-23</Typography>
        </Grid>
      </Grid>
    );
  }
}

export default withHooksHOC(MainFooter);