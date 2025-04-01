/* eslint eqeqeq: "off", no-unused-vars: "off" */
import React, { useState, useEffect } from 'react';
import { Grid, Typography, CircularProgress } from '@mui/material';
import { socket } from '../../socket';
import { convertUpper } from '../../utils/functions';
import { useAuth } from '../../hooks/useAuth';
import { useParams } from 'react-router-dom';
import { ISocketResponse } from '../../interfaces/ISocketResponse';
import { IUserStatistics } from '../../interfaces/IUserStatistics';

export default function Profile(props: { user: { user_id: string } }) {
  const { user } = useAuth();

  const [statistics, setStatistics] = useState<IUserStatistics>();
  const [loadingProfile, setLoadingProfile] = useState(true);
  const { username } = useParams(); // TODO: verify implementation

  useEffect(() => {
    console.log(username);
    socket.emit('allsquads/user/statistics/fetch', { identifier: username, user_id: user?.user_id }, (res: ISocketResponse) => {
      console.log(res);
      if (res.code == 200) {
        setStatistics(res.data);
        setLoadingProfile(false);
      }
    });
  }, [username, props.user?.user_id]);

  if (statistics == null) {
    return <CircularProgress />;
  }

  return (
    <Grid container direction={'row'} padding="20px" spacing={1} justifyContent='space-around'>
      {
        loadingProfile ? <Grid size='auto'><CircularProgress color='secondary' /></Grid> :
          <React.Fragment>
            <Grid size={12} key='1' display='flex' justifyContent={'center'}>
              <Typography variant='h4'>{statistics.user?.ingame_name}'s Profile</Typography>
            </Grid>

            <Grid size='auto' key='3'>
              <Grid container direction='column'>
                <Grid size='auto'>
                  <Typography variant='h4'>Current RP</Typography>
                </Grid>
                <Grid size='auto'>
                  <Typography variant='h6'>{`${statistics.account_balance}`}</Typography>
                </Grid>
              </Grid>
            </Grid>

            <Grid size='auto' key='4'>
              <Grid container direction='column'>
                {/* TODO: fix implementation and types
                <Grid size='auto'>
                  <Typography variant='h4'>Squads Rating {`(${statistics.ratings?.rating || 0})`}</Typography>
                </Grid> */}
                <Grid size='auto'>
                  <Typography variant='h6'>{`${statistics.ratings?.[3]} Excellent`}</Typography>
                </Grid>
                <Grid size='auto'>
                  <Typography variant='h6'>{`${statistics.ratings?.[2]} Good`}</Typography>
                </Grid>
                <Grid size='auto'>
                  <Typography variant='h6'>{`${statistics.ratings?.[1]} Horrible`}</Typography>
                </Grid>
              </Grid>
            </Grid>

            <Grid size='auto' key='5'>
              <Grid container direction='column'>
                <Grid size='auto'>
                  <Typography variant='h4'>Giveaways</Typography>
                </Grid>
                <Grid size='auto'>
                  <Typography variant='h6'>{`${statistics.giveaways?.hosted} Hosted`}</Typography>
                </Grid>
                <Grid size='auto'>
                  <Typography variant='h6'>{`${statistics.giveaways?.won} Won`}</Typography>
                </Grid>
              </Grid>
            </Grid>

            <Grid size='auto' key='6'>
              <Grid container direction='column'>
                <Grid size='auto'>
                  <Typography variant='h4'>Blessings</Typography>
                </Grid>
                <Grid size='auto'>
                  <Typography variant='h6'>{`${statistics.blessings?.hosted} Hosted`}</Typography>
                </Grid>
              </Grid>
            </Grid>

            <Grid size='auto' key='7'>
              <Grid container direction='column'>
                <Grid size='auto'>
                  <Typography variant='h4'>Daywave Challenges</Typography>
                </Grid>
                <Grid size='auto'>
                  <Typography variant='h6'>{`${statistics.challenges?.total_completed} Completed`}</Typography>
                </Grid>
              </Grid>
            </Grid>

            <Grid size={12} key='8'></Grid>

            <Grid size='auto' key='9'>
              <Grid container direction='column'>
                <Grid size='auto'>
                  <Typography variant='h4'>Top Squads</Typography>
                </Grid>
                {statistics.squads?.top_squads?.filter((o, index) => index < 10).map(squad =>
                (
                  <Grid size='auto'>
                    <Typography variant='body1'>{`${convertUpper(squad.squad_string)} (${squad.hosts})`}</Typography>
                  </Grid>
                )
                )}
              </Grid>
            </Grid>

            <Grid size='auto' key='10'>
              <Grid container direction='column'>
                <Grid size='auto'>
                  <Typography variant='h4'>Total Squads</Typography>
                </Grid>
                <Grid size='auto'>
                  <Typography variant='h6'>{`All-time: ${statistics.squads?.total_squads?.all_time}`}</Typography>
                </Grid>
                <Grid size='auto'>
                  <Typography variant='h6'>{`This Month: ${statistics.squads?.total_squads?.this_month}`}</Typography>
                </Grid>
                <Grid size='auto'>
                  <Typography variant='h6'>{`This Week: ${statistics.squads?.total_squads?.this_week}`}</Typography>
                </Grid>
                <Grid size='auto'>
                  <Typography variant='h6'>{`Today: ${statistics.squads?.total_squads?.today}`}</Typography>
                </Grid>
              </Grid>
            </Grid>

            <Grid size='auto' key='11'>
              <Grid container direction='column'>
                <Grid size='auto'>
                  <Typography variant='h4'>Relic Squads</Typography>
                </Grid>
                <Grid size='auto'>
                  <Typography variant='h6'>{`All-time: ${statistics.squads?.total_relic_squads?.all_time}`}</Typography>
                </Grid>
                <Grid size='auto'>
                  <Typography variant='h6'>{`This Month: ${statistics.squads?.total_relic_squads?.this_month}`}</Typography>
                </Grid>
                <Grid size='auto'>
                  <Typography variant='h6'>{`This Week: ${statistics.squads?.total_relic_squads?.this_week}`}</Typography>
                </Grid>
                <Grid size='auto'>
                  <Typography variant='h6'>{`Today: ${statistics.squads?.total_relic_squads?.today}`}</Typography>
                </Grid>
              </Grid>
            </Grid>

            <Grid size='auto' key='12'>
              <Grid container direction='column'>
                <Grid size='auto'>
                  <Typography variant='h4'>Reputation Gain</Typography>
                </Grid>
                <Grid size='auto'>
                  <Typography variant='h6'>{`Total: ${statistics.reputation?.total}`}</Typography>
                </Grid>
                <Grid size='auto'>
                  <Typography variant='h6'>{`Squads: +${statistics.reputation?.squads}`}</Typography>
                </Grid>
                <Grid size='auto'>
                  <Typography variant='h6'>{`Challenges: +${statistics.reputation?.daywave_challenges}`}</Typography>
                </Grid>
                <Grid size='auto'>
                  <Typography variant='h6'>{`Giveaways: +${statistics.reputation?.giveaways}`}</Typography>
                </Grid>
                <Grid size='auto'>
                  <Typography variant='h6'>{`Blessings: +${statistics.reputation?.blessings}`}</Typography>
                </Grid>
                <Grid size='auto'>
                  <Typography variant='h6'>{`User ratings: +${statistics.reputation?.user_ratings}`}</Typography>
                </Grid>
              </Grid>
            </Grid>
          </React.Fragment>
      }
    </Grid>
  );
}