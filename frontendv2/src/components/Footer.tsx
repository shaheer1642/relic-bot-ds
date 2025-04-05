/* eslint eqeqeq: "off", no-unused-vars: "off" */
import { Typography, Grid, Link } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { useNavigate } from 'react-router-dom';

const special_thanks_members = [
  'Crive33', '--FL--MattHarrigan', 'tia1331', '-Isana_Yashiro-', 'JohnWickPrime', '--DR--XIII.XI.MMVIII', 'Ady88', 'Leopard33'
];

export default function Footer() {
  const theme = useTheme();
  const navigate = useNavigate()

  const handleNavigation = (path: string) => {
    navigate(path);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <Grid
      container
      sx={{
        backgroundColor: 'primary.main',
        borderTop: `2px solid ${theme.palette.secondary.main}`,
        padding: '10px'
      }}
      alignItems='center'
      justifyContent='center'
      rowSpacing={1}
      columnSpacing={2}
    >
      {/* <Grid xs='auto'>
        <Typography variant='h4'>AllSquads</Typography>
      </Grid>
      <Grid size={12}></Grid> */}
      <Grid>
        <Link
          sx={{ cursor: 'pointer' }}
          color='secondary.main'
          onClick={() => handleNavigation('faq')}
        >
          FAQ
        </Link>
      </Grid>
      <Grid>|</Grid>
      <Grid>
        <Link
          sx={{ cursor: 'pointer' }}
          color='secondary.main'
          onClick={() => handleNavigation('terms-of-service')}
        >
          Terms of Service
        </Link>
      </Grid>
      <Grid>|</Grid>
      <Grid>
        <Link
          sx={{ cursor: 'pointer' }}
          color='secondary.main'
          onClick={() => handleNavigation('privacy-policy')}
        >
          Privacy Policy
        </Link>
      </Grid>
      <Grid>|</Grid>
      <Grid>
        <Link
          sx={{ cursor: 'pointer' }}
          color='secondary.main'
          onClick={() => handleNavigation('allsquads-review-2023')}
        >
          AllSquads 2023 Review
        </Link>
      </Grid>
      <Grid size={12} />
      <Grid sx={{ display: 'flex', alignItems: 'center' }}>
        <img src="/icons/discord-icon.png" width={32} height={32} style={{ margin: '5px' }} alt="Discord" />
        <Link href="https://discord.gg/invite/346ZthxCe8" color='secondary.main'>Join us on Discord</Link>
      </Grid>
      <Grid>|</Grid>
      <Grid sx={{ display: 'flex', alignItems: 'center' }}>
        <img src="/icons/patreon-icon.png" width={24} height={24} style={{ margin: '5px' }} alt="Patreon" />
        <Link href="https://www.patreon.com/warframehub" color='secondary.main'>Support us on Patreon</Link>
      </Grid>
      <Grid size={12} />
      <Grid size={12} sx={{ display: 'flex', justifyContent: 'center' }}>
        <Typography sx={{ wordWrap: 'break-word' }} color='secondary.dark'>
          DISCLAIMER: Digital Extremes and Warframe are registered trademarks. This website has no direct affiliation with Digital Extremes. All recognizable artwork is intellectual property of these trademarks.
        </Typography>
      </Grid>
      <Grid size={12} sx={{ display: 'flex', justifyContent: 'center' }}>
        <Typography sx={{ wordWrap: 'break-word' }} color='primary.light'>
          {`Special thanks to the following members for helping development of this project: ${special_thanks_members.sort().join(', ')}`}
        </Typography>
      </Grid>
      <Grid size={12} sx={{ display: 'flex', justifyContent: 'center' }}>
        <Typography sx={{ wordWrap: 'break-word' }} color='primary.light'>
          {`Sound effects are taken from `}
          <Link href="https://pixabay.com/" target='_blank' color='primary.light'>Pixaby</Link>
        </Typography>
      </Grid>
      <Grid size={12} sx={{ display: 'flex', justifyContent: 'center' }}>
        <Typography>© AllSquads 2022-23</Typography>
      </Grid>
    </Grid>
  );
};