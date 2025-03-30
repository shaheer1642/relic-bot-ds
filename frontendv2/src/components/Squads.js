/* eslint eqeqeq: "off", no-unused-vars: "off" */
import React from 'react';
import { Link, Outlet } from "react-router-dom";
import {Grid, Typography, FormControlLabel, Checkbox, CircularProgress, Button} from '@mui/material';
import {ControlPoint, CancelOutlined} from '@mui/icons-material'
import {socket,socketHasConnected} from '../../websocket/socket'
import { dynamicSort, relicBotSquadToString } from '../../functions';
import SquadCard from './SquadCard';
import CreateSquad from './CreateSquad';
// import { this.props.user } from '../../objects/user_login';
import eventHandler from '../../event_handler/eventHandler';
import ApiButton from '../../components/ApiButton';
import { withHooksHOC } from '../../withHooksHOC';
import { usersLoaded } from '../../objects/as_users_list';


class Squads extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      squadsLoading: true,
      squadsRefreshing: true,
      squadsArr: [],
      createSquadOpen: false,

      filters: {
        showMembers: false,
        lithSquads: true,
        mesoSquads: true,
        neoSquads: true,
        axiSquads: true,
        otherSquads: true,
        joinedSquads: true,
        nonJoinedSquads: true,
        needsOneMore: true,
        needsTwoMore: true,
        needsThreeMore: true,
      }
    };
    this.fetchSquad = {
      timeSinceLastCall: new Date().getTime(),
      timeout: null
    }
    // this.insertionHold = false
    // this.updatationHold = false
    // this.deletionHold = false
  }

  componentDidMount() {
    console.log('[Squads] mounted')
    socketHasConnected().then(async () => {
      await usersLoaded()
      this.fetchSquads()
    })
    // refresh squads every 2m
    setInterval(() => {
      this.fetchSquads()
    }, 120000);

    socket.addEventListener('squadbot/squadCreate', this.squadsListenerInsert)
    socket.addEventListener('squadbot/squadUpdate', this.squadsListenerUpdate)
    socket.addEventListener('squadCreate', this.squadsListenerInsert)
    socket.addEventListener('squadUpdate', this.squadsListenerUpdate)
  }

  componentWillUnmount() {
    console.log('[Squads] unmounted')
    socket.removeEventListener('squadbot/squadCreate', this.squadsListenerInsert)
    socket.removeEventListener('squadbot/squadUpdate', this.squadsListenerUpdate)
    socket.removeEventListener('squadCreate', this.squadsListenerInsert)
    socket.removeEventListener('squadUpdate', this.squadsListenerUpdate)
  }

  componentDidUpdate() {
  }

  squadsListenerInsert = (data) => {
    console.log('[Squads.squadsListenerInsert] called')
    // if (this.insertionHold) return setTimeout(() => this.squadsListenerInsert(data), 10);
    // this.insertionHold = true

    const newSquad = data
    if (this.state.squadsArr.some(squad => squad.squad_id == newSquad.squad_id)) {
      return console.log('[Squads.squadsListenerInsert] duplicate squad')
    }
    this.setState((prevState) => {
      return {
        squadsArr: [newSquad.bot_type == 'relicbot' ? {...newSquad, squad_string: relicBotSquadToString(newSquad,true)} : newSquad, ...prevState.squadsArr]
      }
    })
  }

  squadsListenerUpdate = (data) => {
    console.log('[Squads.squadsListenerUpdate] called')
    // if (this.updatationHold) return setTimeout(() => this.squadsListenerUpdate(data), 10);
    // this.updatationHold = true
    
    const updatedSquad = data[0]
    if (updatedSquad.status != 'active') {
      this.updatationHold = false
      return this.squadsListenerDelete(updatedSquad)
    }

    this.setState(prevState => {
        const squadsArr = prevState.squadsArr.map((squad, index) => {
          if (squad.squad_id === updatedSquad.squad_id) return updatedSquad.bot_type == 'relicbot' ? {...updatedSquad, squad_string: relicBotSquadToString(updatedSquad,true)} : updatedSquad;
          else return squad
        });
        return {
          squadsArr,
        }
    });
  }
  
  squadsListenerDelete = (data) => {
    console.log('[Squads.squadsListenerDelete] called')
    // if (this.deletionHold) return setTimeout(() => this.squadsListenerDelete(data), 10);
    // this.deletionHold = true

    const deletedSquad = data
    
    this.setState((prevState) => {
      return {
        squadsArr: prevState.squadsArr.filter((squad) => squad.squad_id != deletedSquad.squad_id)
      }
    })
  }

  fetchSquads = () => {
    console.log('[Squads.fetchSquads] called')
    this.setState({
      squadsRefreshing: true
    }, () => {
      socket.emit('relicbot/squads/fetch', {}, (res1) => {
        // console.log('[Squads.fetchSquads] response1',res1.code)
        if (res1.code == 200) {
          socket.emit('squadbot/squads/fetch', {}, (res2) => {
            // console.log('[Squads.fetchSquads] response2',res2.code)
            if (res2.code == 200) {
              this.setState({
                squadsArr: [...res1.data.map(squad => ({...squad, squad_string: relicBotSquadToString(squad,true)})), ...res2.data],
                squadsLoading: false,
                squadsRefreshing: false
              })
            } else console.log(res2)
          })
        } else console.log(res1)
      })
    })
  }

  leaveAllSquads = (e, callback) => {
    socket.emit(`squadbot/squads/leaveall`,{
      user_id: this.props.user.user_id,
    }, (res) => {
      if (res.code != 200) console.log('[Squads.leaveAllSquads] query 1 error',res)
      socket.emit(`relicbot/squads/leave`,{
        user_id: this.props.user.user_id,
        tier: 'all',
      }, (res) => {
        if (res.code != 200) console.log('[Squads.leaveAllSquads] query 2 error',res)
        if (callback) callback()
      })
    })
  }

  filterSquads = (squad) => {
    if (!this.state.filters.lithSquads && squad.squad_string.match(/^lith /)) return false
    if (!this.state.filters.mesoSquads && squad.squad_string.match(/^meso /)) return false
    if (!this.state.filters.neoSquads && squad.squad_string.match(/^neo /)) return false
    if (!this.state.filters.axiSquads && squad.squad_string.match(/^axi /)) return false
    if (!this.state.filters.otherSquads && !squad.squad_string.match(/^lith /) && !squad.squad_string.match(/^meso /) && !squad.squad_string.match(/^neo /) && !squad.squad_string.match(/^axi /)) return false
    if (!this.state.filters.nonJoinedSquads && !squad.members.includes(this.props.user?.user_id)) return false
    if (!this.state.filters.joinedSquads && squad.members.includes(this.props.user?.user_id)) return false
    if (!this.state.filters.needsOneMore && squad.members.length == (squad.spots - 1)) return false
    if (!this.state.filters.needsTwoMore && squad.members.length == (squad.spots - 2)) return false
    if (!this.state.filters.needsThreeMore && squad.members.length == (squad.spots - 3)) return false
    return true
  }

  updateFilters = (key,value) => {
    this.setState(state => {
      const filters = state.filters
      filters[key] = value
      return {
        filters
      }
    })
  }

  render() {
    return (
      <Grid container spacing={1} style={{padding: '10px'}}>
        <Grid item xs={12}>
          <Grid container>
            <Grid item xs={12}>
              <Typography variant='h5'>Filters</Typography>
            </Grid>
            <Grid item xs={12} sx={{paddingLeft: 2}}>
              <Grid container>
                <Grid item xs={12}>
                  <Grid container>
                    <Grid item xs={"auto"}>
                      <FormControlLabel style={{userSelect: 'none'}} control={<Checkbox color='secondary' checked={this.state.filters.lithSquads} onChange={(e) => this.updateFilters('lithSquads',e.target.checked)}/>} label="Lith Squads" />
                    </Grid>
                    <Grid item xs={"auto"}>
                      <FormControlLabel style={{userSelect: 'none'}} control={<Checkbox color='secondary' checked={this.state.filters.mesoSquads} onChange={(e) => this.updateFilters('mesoSquads',e.target.checked)}/>} label="Meso Squads" />
                    </Grid>
                    <Grid item xs={"auto"}>
                      <FormControlLabel style={{userSelect: 'none'}} control={<Checkbox color='secondary' checked={this.state.filters.neoSquads} onChange={(e) => this.updateFilters('neoSquads',e.target.checked)}/>} label="Neo Squads" />
                    </Grid>
                    <Grid item xs={"auto"}>
                      <FormControlLabel style={{userSelect: 'none'}} control={<Checkbox color='secondary' checked={this.state.filters.axiSquads} onChange={(e) => this.updateFilters('axiSquads',e.target.checked)}/>} label="Axi Squads" />
                    </Grid>
                    <Grid item xs={"auto"}>
                      <FormControlLabel style={{userSelect: 'none'}} control={<Checkbox color='secondary' checked={this.state.filters.otherSquads} onChange={(e) => this.updateFilters('otherSquads',e.target.checked)}/>} label="Other Squads" />
                    </Grid>
                  </Grid>
                </Grid>
                <Grid item xs={12}>
                  <Grid container>
                    <Grid item xs={"auto"}>
                      <FormControlLabel style={{userSelect: 'none'}} control={<Checkbox color='secondary' checked={this.state.filters.joinedSquads} onChange={(e) => this.updateFilters('joinedSquads', e.target.checked)}/>} label="Joined Squads" />
                    </Grid>
                    <Grid item xs={"auto"}>
                      <FormControlLabel style={{userSelect: 'none'}} control={<Checkbox color='secondary' checked={this.state.filters.nonJoinedSquads} onChange={(e) => this.updateFilters('nonJoinedSquads', e.target.checked)}/>} label="Non-Joined Squads" />
                    </Grid>
                    <Grid item xs={"auto"}>
                      <FormControlLabel style={{userSelect: 'none'}} control={<Checkbox color='secondary' checked={this.state.filters.needsOneMore} onChange={(e) => this.updateFilters('needsOneMore', e.target.checked)}/>} label="Needs 1 more" />
                    </Grid>
                    <Grid item xs={"auto"}>
                      <FormControlLabel style={{userSelect: 'none'}} control={<Checkbox color='secondary' checked={this.state.filters.needsTwoMore} onChange={(e) => this.updateFilters('needsTwoMore', e.target.checked)}/>} label="Needs 2 more" />
                    </Grid>
                    <Grid item xs={"auto"}>
                      <FormControlLabel style={{userSelect: 'none'}} control={<Checkbox color='secondary' checked={this.state.filters.needsThreeMore} onChange={(e) => this.updateFilters('needsThreeMore', e.target.checked)}/>} label="Needs 3 more" />
                    </Grid>
                  </Grid>
                </Grid>
                <Grid item xs={12}>
                  <Grid container>
                    <Grid item xs={"auto"}>
                      <FormControlLabel style={{userSelect: 'none'}} control={<Checkbox color='secondary' checked={this.state.filters.showMembers} onChange={(e) => this.updateFilters('showMembers',e.target.checked)}/>} label="Show Members" />
                    </Grid>
                  </Grid>
                </Grid>
              </Grid>
            </Grid>
          </Grid>
        </Grid>

        {/* <Grid item xs={"auto"} style={{alignItems: 'center', display: 'flex', color:'red'}}>
          <Typography sx={{wordWrap: 'break-word'}}>
          Caution! The website is for testing only. Please do not open any squads from here as there is no chat system at the moment
          </Typography>
        </Grid>
        <Grid item xs={12}></Grid> */}
        <Grid item xs={12}></Grid>
        <Grid item xs={"auto"}>
          <Button 
            onClick={() => {
              if (!this.props.user) return eventHandler.emit('requestLogin')
              if (!this.props.user.ingame_name) return eventHandler.emit('requestVerify')
              this.setState({createSquadOpen: true})
            }}
            variant="outlined" 
            color='success'
            startIcon={<ControlPoint />}>
              Create Squad
          </Button>
        </Grid>
        {this.state.squadsArr.some(squad => squad.members.includes(this.props.user?.user_id)) ? 
          <Grid item xs={"auto"}>
          <ApiButton 
            onClick={this.leaveAllSquads}
            variant="outlined" 
            color='error'
            startIcon={<CancelOutlined />}
            label='Leave All'
          />
          </Grid> : <></>
        }
        <Grid item xs={12}></Grid>
        <Grid item xs={"auto"} style={{alignItems: 'center', display: 'flex'}}>
          {this.state.squadsRefreshing ? 'Refreshing Squads...':''}
        </Grid>
        <Grid item xs={12}></Grid>
        {this.state.squadsLoading ? <Grid item xs={12}><CircularProgress color='secondary'/></Grid>:
          this.state.squadsArr.filter(this.filterSquads).sort(dynamicSort('squad_string')).sort((a,b) => a.bot_type == 'squadbot' && b.bot_type != 'squadbot' ? -1 :  0 ).map((squad,index) => {
            return (
              <Grid item xs={"auto"} key={index}>
                <SquadCard squad={squad} showMembers={this.state.filters.showMembers} disableActions={false}/>
              </Grid>
            )
          })
        }
        <Grid item xs={12}>
        <CreateSquad onClose={() => this.setState({createSquadOpen: false})} open={this.state.createSquadOpen} />
        </Grid>
      </Grid>
    );
  }
}

export default withHooksHOC(Squads);