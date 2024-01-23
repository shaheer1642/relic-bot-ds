/* eslint eqeqeq: "off", no-unused-vars: "off" */
import React from 'react';
import { Link, Outlet } from "react-router-dom";
import {Card, CardContent, Typography, Button, CardActions, CircularProgress, Grid} from '@mui/material';
import {DoneOutlined, CancelOutlined} from '@mui/icons-material'
import {socket,socketHasConnected} from '../../websocket/socket'
import { relicBotSquadToString } from '../../functions';
import { convertUpper } from '../../functions';
import {as_users_list} from '../../objects/as_users_list';
// import { this.props.user } from '../../objects/user_login';
import eventHandler from '../../event_handler/eventHandler';
import * as Colors from '@mui/material/colors';
import theme from '../../theme';
import ApiButton from '../../components/ApiButton';
import { getImageFromSquadString } from '../../image_handler';
import { withHooksHOC } from '../../withHooksHOC';

class SquadCard extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      showMembers: false
    }
  }

  componentDidMount() {
    console.log('[SquadCard] mounted')
  }

  componentWillUnmount() {
    console.log('[SquadCard] unmounted')
  }

  componentDidUpdate() {
  }


  render() {
    return (
        <Card
          onMouseEnter={() => this.setState({showMembers: true})}
          onMouseLeave={() => this.setState({showMembers: false})}
          sx={{
            ':hover': {
              boxShadow: 10, // theme.shadows[20]
            },
            padding: '10px', 
            backgroundColor: 'primary.dark', 
            minWidth: '15vw', 
            border: (this.props.squad.members.length >= this.props.squad.spots - 1) ? `2px solid ${theme.palette.secondary.main}` : '' 
          }} 
          elevation={3}
        >
          <CardContent> 
            <Grid container  direction={"row"} width={"100%"} justifyContent='start'>
              {/* Squad title */}
                <Grid item xs={"auto"} display={'flex'}>
                    {getImageFromSquadString(this.props.squad.squad_string) ? <img style={{marginRight: '10px'}} src={getImageFromSquadString(this.props.squad.squad_string)} height="36px"/> : <></>}
                </Grid>
                <Grid item xs={"auto"} style={{marginTop: '5px'}} alignItems='start'>
                  <Typography variant="h6">
                    {convertUpper(this.props.squad.squad_string)}
                  </Typography>
                  {/* Squad members */}
                  {this.state.usersListLoading ? <CircularProgress /> :
                  <Typography variant="body">
                    <pre>
                      { this.props.showMembers || this.state.showMembers ? this.props.squad.members.map(id => as_users_list[id]?.ingame_name).join('\n') : `${this.props.squad.members.length}/${this.props.squad.spots || 4}`}
                    </pre>
                  </Typography>
                  }
                </Grid>
            </Grid>
          </CardContent>
          <CardActions style={{justifyContent: 'center'}}>
            <ApiButton 
              size='small'
              onClick={(e,callback) => {
                socket.emit(`${this.props.squad.bot_type}/squads/addmember`,{
                  squad_id: this.props.squad.squad_id,
                  user_id: this.props.user.user_id,
                  channel_id: 'web-111',
                }, (res) => {
                    if (callback) callback(res)
                })
              }}
              variant="outlined" 
              color={this.props.squad.members.includes(this.props.user?.user_id) ? 'warning' : 'success'}
              startIcon={this.props.squad.members.includes(this.props.user?.user_id) ? <CancelOutlined /> : <DoneOutlined />}
              label={this.props.squad.members.includes(this.props.user?.user_id) ? 'Leave Squad' : 'Join Squad'}
              
            />
          </CardActions>
        </Card>
    );
  }
}

export default withHooksHOC(SquadCard);