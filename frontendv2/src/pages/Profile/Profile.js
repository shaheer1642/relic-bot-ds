/* eslint eqeqeq: "off", no-unused-vars: "off" */
import React from 'react';
import {Dialog, DialogTitle, DialogActions, DialogContent, DialogContentText, Button, Drawer, Grid, Typography, CircularProgress, FormControlLabel, Checkbox} from '@mui/material';
import {ArrowBack} from '@mui/icons-material'
import { withHooksHOC } from '../../withHooksHOC';
import {config, updateConfig} from '../../config';
import { socket } from '../../websocket/socket';
import { convertUpper } from '../../functions';
// import { this.props.user } from '../../objects/user_login';

class Profile extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      statistics: {},
      loadingProfile: true,
    }
    this.username = this.props.params.username
  }

  componentDidMount() {
    console.log(this.username)
    socket.emit('allsquads/user/statistics/fetch', {identifier: this.username, user_id: this.props.user?.user_id}, (res) => {
      console.log(res)
      if (res.code == 200) {
        this.setState({
          statistics: res.data,
          loadingProfile: false
        })
      }
    })
  }

  componentWillUnmount() {
  }

  componentDidUpdate() {
  }

  render() {
    return (
      <Grid container direction={'row'} padding="20px" spacing={1} justifyContent='space-around'> 
        {
          this.state.loadingProfile ? <Grid item xs='auto'><CircularProgress color='secondary'/></Grid> : 
          <React.Fragment>
            <Grid item xs={12} key='1' display='flex' justifyContent={'center'}>
              <Typography variant='h4'>{this.state.statistics.user.ingame_name}'s Profile</Typography>
            </Grid>

            <Grid item xs='auto' key='3'>
              <Grid container direction='column'>
                <Grid item xs='auto'>
                  <Typography variant='h4'>Current RP</Typography>
                </Grid>
                <Grid item xs='auto'>
                  <Typography variant='h6'>{`${this.state.statistics.account_balance}`}</Typography>
                </Grid>
              </Grid>
            </Grid>

            <Grid item xs='auto' key='4'>
              <Grid container direction='column'>
              <Grid item xs='auto'>
                <Typography variant='h4'>Squads Rating {`(${this.state.statistics.ratings.rating || 0})`}</Typography>
              </Grid>
              <Grid item xs='auto'>
                <Typography variant='h6'>{`${this.state.statistics.ratings[3]} Excellent`}</Typography>
              </Grid>
              <Grid item xs='auto'>
                <Typography variant='h6'>{`${this.state.statistics.ratings[2]} Good`}</Typography>
              </Grid>
              <Grid item xs='auto'>
                <Typography variant='h6'>{`${this.state.statistics.ratings[1]} Horrible`}</Typography>
              </Grid>
              </Grid>
            </Grid>

            <Grid item xs='auto' key='5'>
              <Grid container direction='column'>
              <Grid item xs='auto'>
                <Typography variant='h4'>Giveaways</Typography>
              </Grid>
              <Grid item xs='auto'>
                <Typography variant='h6'>{`${this.state.statistics.giveaways.hosted} Hosted`}</Typography>
              </Grid>
              <Grid item xs='auto'>
                <Typography variant='h6'>{`${this.state.statistics.giveaways.won} Won`}</Typography>
              </Grid>
              </Grid>
            </Grid>

            <Grid item xs='auto' key='6'>
              <Grid container direction='column'>
              <Grid item xs='auto'>
                <Typography variant='h4'>Blessings</Typography>
              </Grid>
              <Grid item xs='auto'>
                <Typography variant='h6'>{`${this.state.statistics.blessings.hosted} Hosted`}</Typography>
              </Grid>
              </Grid>
            </Grid>

            <Grid item xs='auto' key='7'>
              <Grid container direction='column'>
              <Grid item xs='auto'>
                <Typography variant='h4'>Daywave Challenges</Typography>
              </Grid>
              <Grid item xs='auto'>
                <Typography variant='h6'>{`${this.state.statistics.challenges.total_completed} Completed`}</Typography>
              </Grid>
              </Grid>
            </Grid>

            <Grid item xs={12} key='8'></Grid>

            <Grid item xs='auto' key='9'>
              <Grid container direction='column'>
              <Grid item xs='auto'>
                <Typography variant='h4'>Top Squads</Typography>
              </Grid>
              {this.state.statistics.squads.top_squads.filter((o,index) => index < 10).map(squad => 
                  (
                    <Grid item xs='auto'>
                      <Typography variant='body1'>{`${convertUpper(squad.squad_string)} (${squad.hosts})`}</Typography>
                    </Grid>
                  )
              )}
              </Grid>
            </Grid>
            
            <Grid item xs='auto' key='10'>
              <Grid container direction='column'>
              <Grid item xs='auto'>
                <Typography variant='h4'>Total Squads</Typography>
              </Grid>
              <Grid item xs='auto'>
                <Typography variant='h6'>{`All-time: ${this.state.statistics.squads.total_squads.all_time}`}</Typography>
              </Grid>
              <Grid item xs='auto'>
                <Typography variant='h6'>{`This Month: ${this.state.statistics.squads.total_squads.this_month}`}</Typography>
              </Grid>
              <Grid item xs='auto'>
                <Typography variant='h6'>{`This Week: ${this.state.statistics.squads.total_squads.this_week}`}</Typography>
              </Grid>
              <Grid item xs='auto'>
                <Typography variant='h6'>{`Today: ${this.state.statistics.squads.total_squads.today}`}</Typography>
              </Grid>
              </Grid>
            </Grid>

            <Grid item xs='auto' key='11'>
              <Grid container direction='column'>
              <Grid item xs='auto'>
                <Typography variant='h4'>Relic Squads</Typography>
              </Grid>
              <Grid item xs='auto'>
                <Typography variant='h6'>{`All-time: ${this.state.statistics.squads.total_relic_squads.all_time}`}</Typography>
              </Grid>
              <Grid item xs='auto'>
                <Typography variant='h6'>{`This Month: ${this.state.statistics.squads.total_relic_squads.this_month}`}</Typography>
              </Grid>
              <Grid item xs='auto'>
                <Typography variant='h6'>{`This Week: ${this.state.statistics.squads.total_relic_squads.this_week}`}</Typography>
              </Grid>
              <Grid item xs='auto'>
                <Typography variant='h6'>{`Today: ${this.state.statistics.squads.total_relic_squads.today}`}</Typography>
              </Grid>
              </Grid>
            </Grid>

            <Grid item xs='auto' key='12'>
              <Grid container direction='column'>
              <Grid item xs='auto'>
                <Typography variant='h4'>Reputation Gain</Typography>
              </Grid>
              <Grid item xs='auto'>
                <Typography variant='h6'>{`Total: ${this.state.statistics.reputation.total}`}</Typography>
              </Grid>
              <Grid item xs='auto'>
                <Typography variant='h6'>{`Squads: +${this.state.statistics.reputation.squads}`}</Typography>
              </Grid>
              <Grid item xs='auto'>
                <Typography variant='h6'>{`Challenges: +${this.state.statistics.reputation.daywave_challenges}`}</Typography>
              </Grid>
              <Grid item xs='auto'>
                <Typography variant='h6'>{`Giveaways: +${this.state.statistics.reputation.giveaways}`}</Typography>
              </Grid>
              <Grid item xs='auto'>
                <Typography variant='h6'>{`Blessings: +${this.state.statistics.reputation.blessings}`}</Typography>
              </Grid>
              <Grid item xs='auto'>
                <Typography variant='h6'>{`User ratings: +${this.state.statistics.reputation.user_ratings}`}</Typography>
              </Grid>
              </Grid>
            </Grid>
            
          </React.Fragment>
        }
      </Grid>
    );
  }
}

export default withHooksHOC(Profile);