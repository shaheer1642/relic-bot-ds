/* eslint eqeqeq: "off", no-unused-vars: "off" */
import { useState } from 'react';
import { Card, CardContent, Typography, CardActions, Grid, useTheme } from '@mui/material';
import { DoneOutlined, CancelOutlined } from '@mui/icons-material'
import { socket } from '../../socket'
import { convertUpper } from '../../utils/functions';
// import { as_users_list } from '../../objects/as_users_list'; TODO: implement app context
import ApiButton from '../ui/ApiButton';
import { getImageFromSquadString } from '../../utils/image_handler';

interface SquadCardProps {
  squad: {
    squad_id: string;
    squad_string: string;
    members: string[];
    spots: number;
    bot_type: string;
  };
  showMembers: boolean; // do not remove, part of a commented code
  user?: {
    user_id: string;
  };
}

export default function SquadCard({ squad, showMembers, user }: SquadCardProps) {

  const theme = useTheme();
  const [hoverShowMembers, setHoverShowMembers] = useState(false); // do not remove, part of a commented code

  return (
    <Card
      onMouseEnter={() => setHoverShowMembers(true)}
      onMouseLeave={() => setHoverShowMembers(false)}
      sx={{
        ':hover': {
          boxShadow: 10,
        },
        padding: '10px',
        backgroundColor: 'primary.dark',
        minWidth: '15vw',
        border: (squad.members.length >= squad.spots - 1) ? `2px solid ${theme.palette.secondary.main}` : ''
      }}
      elevation={3}
    >
      <CardContent>
        <Grid container direction="row" width="100%" justifyContent='start'>
          {/* Squad title */}
          <Grid display='flex'>
            {getImageFromSquadString(squad.squad_string) ?
              <img style={{ marginRight: '10px' }} src={getImageFromSquadString(squad.squad_string)} height="36px" alt="squad" />
              : null}
          </Grid>
          <Grid style={{ marginTop: '5px' }} alignItems='start'>
            <Typography variant="h6">
              {convertUpper(squad.squad_string)}
            </Typography>
            {/* Squad members */}
            {/*TODO: implement app context <Typography variant="body1">
              <pre>
                {showMembers || hoverShowMembers
                  ? squad.members.map(id => as_users_list[id]?.ingame_name).join('\n')
                  : `${squad.members.length}/${squad.spots || 4}`}
              </pre>
            </Typography> */}
          </Grid>
        </Grid>
      </CardContent>
      <CardActions style={{ justifyContent: 'center' }}>
        <ApiButton
          size='small'
          onClick={(e, callback) => {
            socket.emit(`${squad.bot_type}/squads/addmember`, {
              squad_id: squad.squad_id,
              user_id: user?.user_id,
              channel_id: 'web-111',
            }, () => {
              callback && callback()
            })
          }}
          variant="outlined"
          color={squad.members.includes(user?.user_id || '') ? 'warning' : 'success'}
          startIcon={squad.members.includes(user?.user_id || '') ? <CancelOutlined /> : <DoneOutlined />}
          label={squad.members.includes(user?.user_id || '') ? 'Leave Squad' : 'Join Squad'}
        />
      </CardActions>
    </Card>
  );
}