/* eslint eqeqeq: "off", no-unused-vars: "off" */
import { useState, useEffect, useCallback } from 'react';
import { Grid, Typography, FormControlLabel, Checkbox, CircularProgress, Button } from '@mui/material';
import { ControlPoint, CancelOutlined } from '@mui/icons-material'
import { socket, socketHasConnected } from '../socket';
import { dynamicSort, relicBotSquadToString } from '../utils/functions';
import SquadCard from './cards/SquadCard';
import CreateSquad from './crud/CreateSquad';
// import eventHandler from '../../event_handler/eventHandler'; TODO: implement app context
import ApiButton from './ui/ApiButton';
// import { usersLoaded } from '../objects/as_users_list'; TODO: implement to app context
import { ISocketResponse } from '../interfaces/ISocketResponse';

export default function Squads({ user }: { user: { user_id: string; ingame_name?: string; } }) {
  const [squadsLoading, setSquadsLoading] = useState(true);
  const [squadsRefreshing, setSquadsRefreshing] = useState(true);
  const [squadsArr, setSquadsArr] = useState<any[]>([]); // TODO: update type
  const [createSquadOpen, setCreateSquadOpen] = useState(false);
  const [filters, setFilters] = useState({
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
  });

  const fetchSquads = useCallback(() => {
    console.log('[Squads.fetchSquads] called')
    setSquadsRefreshing(true);

    socket.emit('relicbot/squads/fetch', {}, (res1: ISocketResponse) => {
      if (res1.code == 200) {
        socket.emit('squadbot/squads/fetch', {}, (res2: ISocketResponse) => {
          if (res2.code == 200) {
            setSquadsArr([...res1.data.map((squad: any) => ({ ...squad, squad_string: relicBotSquadToString(squad, true) })), ...res2.data]);
            setSquadsLoading(false);
            setSquadsRefreshing(false);
          } else console.log(res2)
        })
      } else console.log(res1)
    });
  }, []);

  useEffect(() => {
    console.log('[Squads] mounted')
    socketHasConnected().then(async () => {
      // await usersLoaded() TODO: implement app context
      fetchSquads()
    })

    // refresh squads every 2m
    const interval = setInterval(() => {
      fetchSquads()
    }, 120000);

    socket.on('squadbot/squadCreate', squadsListenerInsert)
    socket.on('squadbot/squadUpdate', squadsListenerUpdate)
    socket.on('squadCreate', squadsListenerInsert)
    socket.on('squadUpdate', squadsListenerUpdate)

    return () => {
      console.log('[Squads] unmounted')
      clearInterval(interval);
      socket.off('squadbot/squadCreate', squadsListenerInsert)
      socket.off('squadbot/squadUpdate', squadsListenerUpdate)
      socket.off('squadCreate', squadsListenerInsert)
      socket.off('squadUpdate', squadsListenerUpdate)
    }
  }, [fetchSquads]);

  const squadsListenerInsert = useCallback((data: any) => {
    console.log('[Squads.squadsListenerInsert] called')
    const newSquad = data
    if (squadsArr.some(squad => squad.squad_id == newSquad.squad_id)) {
      return console.log('[Squads.squadsListenerInsert] duplicate squad')
    }
    setSquadsArr(prev => [
      newSquad.bot_type == 'relicbot' ? { ...newSquad, squad_string: relicBotSquadToString(newSquad, true) } : newSquad,
      ...prev
    ]);
  }, [squadsArr]);

  const squadsListenerUpdate = useCallback((data: any) => {
    console.log('[Squads.squadsListenerUpdate] called')
    const updatedSquad = data[0]
    if (updatedSquad.status != 'active') {
      return squadsListenerDelete(updatedSquad)
    }

    setSquadsArr(prev => prev.map(squad =>
      squad.squad_id === updatedSquad.squad_id
        ? updatedSquad.bot_type == 'relicbot'
          ? { ...updatedSquad, squad_string: relicBotSquadToString(updatedSquad, true) }
          : updatedSquad
        : squad
    ));
  }, []);

  const squadsListenerDelete = useCallback((data: any) => {
    console.log('[Squads.squadsListenerDelete] called')
    const deletedSquad = data
    setSquadsArr(prev => prev.filter(squad => squad.squad_id != deletedSquad.squad_id));
  }, []);

  const leaveAllSquads = useCallback((_: any, callback?: () => void) => {
    socket.emit(`squadbot/squads/leaveall`, {
      user_id: user?.user_id,
    }, (res: ISocketResponse) => {
      if (res.code != 200) console.log('[Squads.leaveAllSquads] query 1 error', res)
      socket.emit(`relicbot/squads/leave`, {
        user_id: user?.user_id,
        tier: 'all',
      }, (res: ISocketResponse) => {
        if (res.code != 200) console.log('[Squads.leaveAllSquads] query 2 error', res)
        if (callback) callback()
      })
    })
  }, [user]);

  const filterSquads = useCallback((squad: any) => {
    if (!filters.lithSquads && squad.squad_string.match(/^lith /)) return false
    if (!filters.mesoSquads && squad.squad_string.match(/^meso /)) return false
    if (!filters.neoSquads && squad.squad_string.match(/^neo /)) return false
    if (!filters.axiSquads && squad.squad_string.match(/^axi /)) return false
    if (!filters.otherSquads && !squad.squad_string.match(/^lith /) && !squad.squad_string.match(/^meso /) && !squad.squad_string.match(/^neo /) && !squad.squad_string.match(/^axi /)) return false
    if (!filters.nonJoinedSquads && !squad.members.includes(user?.user_id)) return false
    if (!filters.joinedSquads && squad.members.includes(user?.user_id)) return false
    if (!filters.needsOneMore && squad.members.length == (squad.spots - 1)) return false
    if (!filters.needsTwoMore && squad.members.length == (squad.spots - 2)) return false
    if (!filters.needsThreeMore && squad.members.length == (squad.spots - 3)) return false
    return true
  }, [filters, user]);

  const updateFilters = useCallback((key: string, value: boolean) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
  }, []);

  return (
    <Grid container spacing={1} style={{ padding: '10px' }}>
      <Grid size={12}>
        <Grid container>
          <Grid size={12}>
            <Typography variant='h5'>Filters</Typography>
          </Grid>
          <Grid size={12} sx={{ paddingLeft: 2 }}>
            <Grid container>
              <Grid size={12}>
                <Grid container>
                  <Grid >
                    <FormControlLabel style={{ userSelect: 'none' }} control={<Checkbox color='secondary' checked={filters.lithSquads} onChange={(e) => updateFilters('lithSquads', e.target.checked)} />} label="Lith Squads" />
                  </Grid>
                  <Grid >
                    <FormControlLabel style={{ userSelect: 'none' }} control={<Checkbox color='secondary' checked={filters.mesoSquads} onChange={(e) => updateFilters('mesoSquads', e.target.checked)} />} label="Meso Squads" />
                  </Grid>
                  <Grid >
                    <FormControlLabel style={{ userSelect: 'none' }} control={<Checkbox color='secondary' checked={filters.neoSquads} onChange={(e) => updateFilters('neoSquads', e.target.checked)} />} label="Neo Squads" />
                  </Grid>
                  <Grid >
                    <FormControlLabel style={{ userSelect: 'none' }} control={<Checkbox color='secondary' checked={filters.axiSquads} onChange={(e) => updateFilters('axiSquads', e.target.checked)} />} label="Axi Squads" />
                  </Grid>
                  <Grid >
                    <FormControlLabel style={{ userSelect: 'none' }} control={<Checkbox color='secondary' checked={filters.otherSquads} onChange={(e) => updateFilters('otherSquads', e.target.checked)} />} label="Other Squads" />
                  </Grid>
                </Grid>
              </Grid>
              <Grid size={12}>
                <Grid container>
                  <Grid >
                    <FormControlLabel style={{ userSelect: 'none' }} control={<Checkbox color='secondary' checked={filters.joinedSquads} onChange={(e) => updateFilters('joinedSquads', e.target.checked)} />} label="Joined Squads" />
                  </Grid>
                  <Grid >
                    <FormControlLabel style={{ userSelect: 'none' }} control={<Checkbox color='secondary' checked={filters.nonJoinedSquads} onChange={(e) => updateFilters('nonJoinedSquads', e.target.checked)} />} label="Non-Joined Squads" />
                  </Grid>
                  <Grid >
                    <FormControlLabel style={{ userSelect: 'none' }} control={<Checkbox color='secondary' checked={filters.needsOneMore} onChange={(e) => updateFilters('needsOneMore', e.target.checked)} />} label="Needs 1 more" />
                  </Grid>
                  <Grid >
                    <FormControlLabel style={{ userSelect: 'none' }} control={<Checkbox color='secondary' checked={filters.needsTwoMore} onChange={(e) => updateFilters('needsTwoMore', e.target.checked)} />} label="Needs 2 more" />
                  </Grid>
                  <Grid >
                    <FormControlLabel style={{ userSelect: 'none' }} control={<Checkbox color='secondary' checked={filters.needsThreeMore} onChange={(e) => updateFilters('needsThreeMore', e.target.checked)} />} label="Needs 3 more" />
                  </Grid>
                </Grid>
              </Grid>
              <Grid size={12}>
                <Grid container>
                  <Grid >
                    <FormControlLabel style={{ userSelect: 'none' }} control={<Checkbox color='secondary' checked={filters.showMembers} onChange={(e) => updateFilters('showMembers', e.target.checked)} />} label="Show Members" />
                  </Grid>
                </Grid>
              </Grid>
            </Grid>
          </Grid>
        </Grid>
      </Grid>
      <Grid size={12}></Grid>
      <Grid >
        <Button
          onClick={() => {
            // if (!user) return eventHandler.emit('requestLogin') TODO: implement app context
            // if (!user.ingame_name) return eventHandler.emit('requestVerify') TODO: implement app context
            setCreateSquadOpen(true)
          }}
          variant="outlined"
          color='success'
          startIcon={<ControlPoint />}>
          Create Squad
        </Button>
      </Grid>
      {squadsArr.some(squad => squad.members.includes(user?.user_id)) ?
        <Grid >
          <ApiButton
            onClick={leaveAllSquads}
            variant="outlined"
            color='error'
            startIcon={<CancelOutlined />}
            label='Leave All'
          />
        </Grid> : <></>
      }
      <Grid size={12}></Grid>
      <Grid style={{ alignItems: 'center', display: 'flex' }}>
        {squadsRefreshing ? 'Refreshing Squads...' : ''}
      </Grid>
      <Grid size={12}></Grid>
      {squadsLoading ? <Grid size={12}><CircularProgress color='secondary' /></Grid> :
        squadsArr.filter(filterSquads).sort(dynamicSort('squad_string')).sort((a, b) => a.bot_type == 'squadbot' && b.bot_type != 'squadbot' ? -1 : 0).map((squad, index) => {
          return (
            <Grid key={index}>
              <SquadCard squad={squad} showMembers={filters.showMembers} />
            </Grid>
          )
        })
      }
      <Grid size={12}>
        <CreateSquad onClose={() => setCreateSquadOpen(false)} open={createSquadOpen} />
      </Grid>
    </Grid>
  );
}