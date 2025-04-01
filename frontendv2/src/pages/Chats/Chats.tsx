/* eslint eqeqeq: "off", no-unused-vars: "off" */
import { useState, useEffect } from 'react';
import { Button, Drawer, Grid, Typography, CircularProgress } from '@mui/material';
import { ArrowBack } from '@mui/icons-material'
import { socket } from '../../socket'
import { convertUpper } from '../../utils/functions';
// import { usersLoaded } from '../../objects/as_users_list'; TODO: implement app context
// import eventHandler from '../../event_handler/eventHandler'; TODO: implement app context
import ChatChannel from '../../components/cards/ChatChannel';
import { relicBotSquadToString } from '../../utils/functions';
import ChatChannelMessages from './ChatChannelMessages';
import playSound from '../../utils/sound_player';
import { ISocketResponse } from '../../interfaces/ISocketResponse';
import { ISquad } from '../../interfaces/ISquad';

interface ChatsProps {
  user: { user_id: string }
}

export default function Chats(props: ChatsProps) {
  const [open, setOpen] = useState(false);
  const [filledSquads, setFilledSquads] = useState<ISquad[]>([]);
  const [loadingSquads, setLoadingSquads] = useState(true);
  const [viewChat, setViewChat] = useState<string | null>(null);

  const openChat = (data: { squad: { squad_id: string } }) => {
    setOpen(true);
    setViewChat(data?.squad?.squad_id);
  };

  const newSquadOpenedListener = (data: { members: string[], squad_id: string }) => {
    if (data.members.includes(props.user?.user_id)) {
      fetchFilledSquads(() => {
        playSound.squadOpen();
        openChat({ squad: { squad_id: data.squad_id } });
      });
    }
  };

  const squadUpdateListener = (data: ISquad[]) => {
    console.log('[Chats.squadUpdateListener] called');
    const updatedSquad = data[0];
    if (filledSquads.some(squad => squad.squad_id == updatedSquad.squad_id)) {
      setFilledSquads(prevSquads =>
        prevSquads.map((squad) => {
          if (squad.squad_id === updatedSquad.squad_id) {
            return updatedSquad.bot_type == 'relicbot'
              ? { ...updatedSquad, squad_string: relicBotSquadToString(updatedSquad, true) }
              : updatedSquad;
          }
          return squad;
        })
      );
    }
  };

  const fetchFilledSquads = async (callback: () => void) => {
    // await usersLoaded(); TODO: implement app context
    if (!props.user) {
      setFilledSquads([]);
      setLoadingSquads(false);
      return;
    }
    socket.emit('allsquads/user/filledSquads/fetch', { user_id: props.user.user_id }, (res: ISocketResponse) => {
      if (res.code == 200) {
        const newFilledSquads = res.data.map((squad: ISquad) =>
          squad.bot_type == 'relicbot'
            ? ({ ...squad, squad_string: relicBotSquadToString(squad, true) })
            : squad
        );
        setFilledSquads([...newFilledSquads]);
        setLoadingSquads(false);
        if (callback) callback();
      } else console.log(res);
    });
  };

  useEffect(() => {
    // eventHandler.addListener('openChat', openChat); TODO: implement app context
    // eventHandler.addListener('user/login', fetchFilledSquads); TODO: implement app context 

    socket.on('relicbot/squads/opened', newSquadOpenedListener);
    socket.on('squadbot/squads/opened', newSquadOpenedListener);
    socket.on('squadbot/squadUpdate', squadUpdateListener);
    socket.on('squadUpdate', squadUpdateListener);

    return () => {
      // eventHandler.removeListener('openChat', openChat); TODO: implement app context
      // eventHandler.removeListener('user/login', fetchFilledSquads); TODO: implement app context

      socket.off('relicbot/squads/opened', newSquadOpenedListener);
      socket.off('squadbot/squads/opened', newSquadOpenedListener);
      socket.off('squadbot/squadUpdate', squadUpdateListener);
      socket.off('squadUpdate', squadUpdateListener);
    };
  }, []);

  return (
    <Drawer
      keepMounted={false}
      anchor={'right'}
      open={open}
      onClose={() => setOpen(false)}
      PaperProps={{
        sx: {
          backgroundColor: 'primary.dark',
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
        {viewChat != null && (
          <Grid>
            <Button color='secondary' onClick={() => setViewChat(null)}><ArrowBack /></Button>
          </Grid>
        )}
        <Grid size={viewChat == null ? 12 : 'auto'} width="100%" style={{ display: 'flex', justifyContent: 'center' }}>
          <Typography variant='h5'>
            {viewChat == null
              ? 'Squad Chats'
              : convertUpper(filledSquads.filter(squad => squad.squad_id == viewChat)?.[0]?.squad_string)}
          </Typography>
        </Grid>
        <Grid size={12}></Grid>
        {loadingSquads ? (
          <CircularProgress color='secondary' />
        ) : viewChat == null ? (
          filledSquads.map((squad, index) => (
            <Grid size={12} key={index}>
              <ChatChannel squad={squad} onClick={() => setViewChat(squad.squad_id)} />
            </Grid>
          ))
        ) : (
          <Grid size={12} maxHeight={'100%'}>
            <ChatChannelMessages squad={filledSquads.filter(squad => squad.squad_id == viewChat)?.[0]} />
          </Grid>
        )}
      </Grid>
    </Drawer>
  );
};