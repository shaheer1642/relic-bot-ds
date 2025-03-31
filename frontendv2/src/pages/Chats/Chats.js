/* eslint eqeqeq: "off", no-unused-vars: "off" */
import React from 'react';
import { Link, Outlet } from "react-router-dom";
import {Dialog, DialogTitle, DialogActions, DialogContent, DialogContentText, Button, Drawer, Grid, Typography, CircularProgress} from '@mui/material';
import {ArrowBack} from '@mui/icons-material'
import {socket,socketHasConnected} from '../../websocket/socket'
import { convertUpper } from '../../functions';
import {as_users_list, usersLoaded} from '../../objects/as_users_list';
import { getCookie } from '../../functions';
import eventHandler from '../../event_handler/eventHandler';
// import { this.props.user, authorizationCompleted } from '../../objects/user_login';
import ChatChannel from './ChatChannel';
import { relicBotSquadToString } from '../../functions';
import Squads from '../Squads/Squads';
import ChatChannelMessages from './ChatChannelMessages';
import theme from '../../theme';
import playSound from '../../sound_player';
import { withHooksHOC } from '../../withHooksHOC';

class Chats extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      open: false,

      filledSquads: [],
      loadingSquads: true,

      viewChat: null
    }
  }

  componentDidMount() {
    eventHandler.addListener('openChat', this.openChat)
    eventHandler.addListener('user/login', this.fetchFilledSquads)

    socket.addEventListener('relicbot/squads/opened', this.newSquadOpenedListener)
    socket.addEventListener('squadbot/squads/opened', this.newSquadOpenedListener)
    socket.addEventListener('squadbot/squadUpdate', this.squadUpdateListener)
    socket.addEventListener('squadUpdate', this.squadUpdateListener)
  }

  componentWillUnmount() {
    eventHandler.removeListener('openChat', this.openChat)
    eventHandler.removeListener('user/login', this.fetchFilledSquads)

    socket.removeEventListener('relicbot/squads/opened', this.newSquadOpenedListener)
    socket.removeEventListener('squadbot/squads/opened', this.newSquadOpenedListener)
    socket.removeEventListener('squadbot/squadUpdate', this.squadUpdateListener)
    socket.removeEventListener('squadUpdate', this.squadUpdateListener)
  }

  componentDidUpdate() {
  }

  openChat = (data) => {
    this.setState({open: true, viewChat: data?.squad?.squad_id})
  }

  newSquadOpenedListener = (data) => {
    if (data.members.includes(this.props.user?.user_id)) {
      this.fetchFilledSquads(() => {
        playSound.squadOpen()
        this.openChat({squad: data})
      })
    }
  }

  squadUpdateListener = (data) => {
    console.log('[Chats.squadUpdateListener] called')
    const updatedSquad = data[0]
    if (this.state.filledSquads.some(squad => squad.squad_id == updatedSquad.squad_id)) {
      return this.setState(state => {
          const filledSquads = state.filledSquads.map((squad, index) => {
            if (squad.squad_id === updatedSquad.squad_id) return updatedSquad.bot_type == 'relicbot' ? {...updatedSquad, squad_string: relicBotSquadToString(updatedSquad,true)} : updatedSquad;
            else return squad
          });
          return {
            filledSquads,
          }
      });
    }
  }

  fetchFilledSquads = async (callback) => {
    await usersLoaded()
    if (!this.props.user) return this.setState({filledSquads: [], loadingSquads: false})
    socket.emit('allsquads/user/filledSquads/fetch', {user_id: this.props.user.user_id},(res) => {
      if (res.code == 200) {
        const filledSquads = res.data.map(squad => squad.bot_type == 'relicbot' ? ({...squad, squad_string: relicBotSquadToString(squad,true)}) : squad)
        this.setState({
          filledSquads: [...filledSquads],
          loadingSquads: false
        }, () => {
          if (callback) callback()
        })
      } else console.log(res)
    })
  }

  render() {
    return (
      <Drawer
        keepMounted={false}
        anchor={'right'}
        open={this.state.open}
        onClose={() => this.setState({open: false})}
        PaperProps={{
          sx: { backgroundColor: 'primary.dark', 
            '@media (min-width: 0px)': {
              maxWidth: '80%'
            },
            '@media (min-width: 600px)': {
              maxWidth: '60%'
            },
            '@media (min-width: 960px)': {
              maxWidth: '50%'
            },
            '@media (min-width: 1280px)': {
              maxWidth: '40%'
            },
            '@media (min-width: 1920px)': {
              maxWidth: '30%'
            },
        },
        }}
      >
        <Grid container padding={"10px"} rowSpacing={'10px'}>
          {
            this.state.viewChat != null ?
            <Grid item xs={"auto"}>
              <Button color='secondary' onClick={() => this.setState({viewChat: null})}><ArrowBack /></Button>
            </Grid> : <></>
          }
          <Grid item xs={this.state.viewChat == null ? 12 : 'auto'} width="100%" style={{display: 'flex', justifyContent: 'center'}}>
            <Typography variant='h5'>{this.state.viewChat == null ? 'Squad Chats' : convertUpper(this.state.filledSquads.filter(squad => squad.squad_id == this.state.viewChat)?.[0]?.squad_string)}</Typography>
          </Grid>
          <Grid item xs={12}></Grid>
          {this.state.loadingSquads ? <CircularProgress color='secondary'/>
          :
            this.state.viewChat == null ?
              this.state.filledSquads.map((squad,index) => 
                (<Grid item xs={12} key={index}>
                  <ChatChannel squad={squad} onClick={() => this.setState({viewChat: squad.squad_id})}/>
                </Grid>)
              )
            : 
            <Grid item xs={12} maxHeight={'100%'}>
              <ChatChannelMessages squad={this.state.filledSquads.filter(squad => squad.squad_id == this.state.viewChat)?.[0]} />
            </Grid>
          }
        </Grid>
      </Drawer>
    );
  }
}

export default withHooksHOC(Chats);