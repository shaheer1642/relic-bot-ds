/* eslint eqeqeq: "off", no-unused-vars: "off" */
import React, { useState, useEffect } from 'react';
import { Button, Grid, CircularProgress, TextField } from '@mui/material';
import { Send } from '@mui/icons-material'
import { socket } from '../../socket'
import { sortCaseInsensitive } from '../../utils/functions';
import * as uuid from 'uuid';
import * as Colors from '@mui/material/colors';
import theme from '../../theme';
import ApiButton from '../../components/ui/ApiButton';
import playSound from '../../utils/sound_player';
import { ISocketResponse } from '../../interfaces/ISocketResponse';
import { IChatMessage } from '../../interfaces/IChatMessage';
import { useAuth } from '../../hooks/useAuth';
import { ISquad } from '../../interfaces/ISquad';
import { useStore } from '../../hooks/useStore';
function enquote(username: string) {
  return username.match(' ') ? `"${username}"` : username
}

function getTimestamp(timestamp: number) {
  return timestamp > new Date(new Date().setHours(0, 0, 0, 0)).getTime() ?
    `[${new Date(timestamp).toLocaleTimeString()}]` :
    `[${new Date(timestamp).toLocaleDateString()} ${new Date(timestamp).toLocaleTimeString()}]`
}

interface ChatChannelMessagesProps {
  squad: ISquad
}

export default function ChatChannelMessages(props: ChatChannelMessagesProps) {
  const { user } = useAuth()
  const { usersList } = useStore()

  const [newMessage, setNewMessage] = useState('');
  const [chatsArr, setChatsArr] = useState<IChatMessage[]>([]);
  const [loadingChats, setLoadingChats] = useState(true);

  const squadMessageListenerInsert = (data: IChatMessage) => {
    if (data.squad_id != props.squad.squad_id) return;
    if (data.user_id != user?.user_id) playSound.newMessage();
    setChatsArr(prev => [...prev, data]);
  };

  const fetchSquadChats = () => {
    socket.emit(`${props.squad.bot_type}/squads/messagesFetch`, { squad_id: props.squad.squad_id }, (res: ISocketResponse) => {
      console.log('chatfetch res', res);
      if (res.code == 200) {
        setChatsArr([...res.data]);
        setLoadingChats(false);
      }
    });
  };

  const sendNewMessage = () => {
    if (!newMessage) return;
    socket.emit(`${props.squad.bot_type}/squads/messageCreate`, {
      message_id: uuid.v4(),
      squad_id: props.squad.squad_id,
      thread_id: 'web-111',
      message: newMessage,
      user_id: user?.user_id
    }, (res: ISocketResponse) => {
      setNewMessage('');
      if (res.code != 200) {
        console.log('[ChatChannelMessages.sendNewMessage] error:', res);
      }
    });
  };

  const onBecomeHostClick = () => {
    socket.emit(`${props.squad.bot_type}/squads/selecthost`, { squad_id: props.squad.squad_id, user_id: user?.user_id }, (res: ISocketResponse) => {
      if (res.code != 200) {
        console.log('[ChatChannelMessages.onBecomeHostClick] error', res);
      }
      // if (callback) callback(); TODO: verify
    });
  };

  useEffect(() => {
    console.log('mounting chatchannel messages');
    fetchSquadChats();
    socket.on('squadbot/squadMessageCreate', squadMessageListenerInsert);
    socket.on('squadMessageCreate', squadMessageListenerInsert);

    return () => {
      console.log('unmounting chatchannel messages');
      socket.off('squadbot/squadMessageCreate', squadMessageListenerInsert);
      socket.off('squadMessageCreate', squadMessageListenerInsert);
    };
  }, []);

  var hosts = props.squad.host_recommendation;
  var host_selection;
  if (hosts?.[0].considered_ping == null) {
    host_selection = `Please decide a host and invite each other in the game`;
  } else {
    host_selection = `Recommended Host: ${usersList[hosts[0]?.user_id]?.ingame_name} with avg squad ping of ${hosts[0]?.avg_squad_ping}`;
  }
  const invite_list = `/invite ${sortCaseInsensitive(props.squad.members.map(id => enquote(usersList[id]?.ingame_name))).join('\n/invite ')}`;
  const squad_status_message = props.squad.status != 'opened' ? `This squad has been ${props.squad.status}` : '';
  const squad_host = props.squad.squad_host ? `${usersList[props.squad.squad_host]?.ingame_name} is hosting this squad\n- Please invite everyone, and make sure the squad is set to "invite-only"\n- Only the host should initiate the mission\n- If host migrates, same rules apply` : '';
  console.log('squad host', squad_host, props.squad.squad_host);

  return (
    <Grid container rowSpacing={"10px"}>
      <Grid size={12}>
        <Grid container spacing={1}>
          {
            loadingChats ? <Grid size={12} style={{ display: 'flex', justifyContent: 'center' }}><CircularProgress color='secondary' /></Grid> :
              <React.Fragment>
                <Grid size={12} key='squad-fill-message'><pre style={{ overflowX: 'auto', whiteSpace: 'pre-line', wordWrap: 'break-word', color: theme.palette.secondary.main }}>{`Squad Filled\n\n${host_selection}\n\n${invite_list}\n\nStart chatting with your teammates below`}</pre></Grid>
                <Grid size={12} key='squad-host'>
                  {props.squad.squad_host ? <pre style={{ overflowX: 'auto', whiteSpace: 'pre-line', wordWrap: 'break-word', color: theme.palette.secondary.dark }}>{squad_host}</pre> :
                    <ApiButton disabled={props.squad.status != 'opened' ? true : false} color='secondary' variant='outlined' onClick={onBecomeHostClick} label="Become Host" />
                  }
                </Grid>
                <Grid size={12} key='squad-messages' >
                  {chatsArr.map((chat, index) =>
                  (<Grid size={12} key={`squad-message-${index}`} style={{ wordWrap: 'break-word' }}>
                    {`${getTimestamp(Number(chat.creation_timestamp))} ${usersList[chat.user_id]?.ingame_name}: ${chat.message}`}
                  </Grid>)
                  )}
                </Grid>
                {squad_status_message ? <Grid size={12} key='squad-status'><pre style={{ overflowX: 'auto', whiteSpace: 'pre-line', wordWrap: 'break-word', color: Colors.orange[900] }}>{squad_status_message}</pre></Grid> : <></>}
              </React.Fragment>
          }
        </Grid>
      </Grid>
      <Grid size={10}>
        <TextField
          fullWidth
          size="small"
          color='secondary'
          disabled={props.squad.status != 'opened' ? true : false}
          placeholder={props.squad.status != 'opened' ? 'Squad has been closed' : 'Type new message'}
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          onKeyDown={(e) => {
            if (e.key == 'Enter') sendNewMessage();
          }}
        />
      </Grid>
      <Grid size={2}>
        <Button color='secondary' onClick={() => sendNewMessage()}><Send /></Button>
      </Grid>
    </Grid>
  );
}