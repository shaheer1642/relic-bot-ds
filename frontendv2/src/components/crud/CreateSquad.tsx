/* eslint eqeqeq: "off", no-unused-vars: "off" */
import React, { useState, useEffect, useRef } from 'react';
import { CircularProgress, Button, Dialog, DialogTitle, DialogContent, DialogActions, DialogContentText, TextField, Alert, useTheme, } from '@mui/material';
import { socket } from '../../socket'
// import eventHandler from '../../event_handler/eventHandler'; TODO: implement app context
// import { withHooksHOC } from '../../withHooksHOC';

interface CreateSquadProps {
    user?: {
        user_id: string;
        ingame_name?: string;
    };
    open: boolean;
    onClose: () => void;
}

export default function CreateSquad({ user, open, onClose }: CreateSquadProps) {
    const theme = useTheme()

    const [loading, setLoading] = useState(false);
    const [squadName, setSquadName] = useState('');
    const [alertMessage, setAlertMessage] = useState('');
    const [alertSeverity, setAlertSeverity] = useState<'success' | 'warning'>('success');
    const clearAlertTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
        console.log('[CreateSquad] mounted');
        return () => {
            console.log('[CreateSquad] unmounted');
        };
    }, []);

    const clearAlert = () => {
        if (clearAlertTimeoutRef.current) {
            clearTimeout(clearAlertTimeoutRef.current);
        }
        clearAlertTimeoutRef.current = setTimeout(() => {
            setAlertMessage('');
        }, 3000);
    };

    const createNewSquad = () => {
        if (!user) return; // temp return
        // if (!user) return eventHandler.emit('requestLogin'); TODO: implement app context
        // if (!user.ingame_name) return eventHandler.emit('requestVerify'); TODO: implement app context

        setLoading(true);
        const bot_type = ['lith', 'meso', 'neo', 'axi'].some(value => squadName.toLowerCase().match(value)) ? 'relicbot' : 'squadbot';

        socket.emit(`${bot_type}/squads/create`, {
            user_id: user.user_id,
            message: squadName,
            channel_id: 'web-111',
            merge_squad: false
        }, (responses: any[]) => {
            let msg = '';
            responses.forEach(res => {
                if (res.code != 200)
                    msg += (res.message || res.err || res.error || 'Something went wrong. Please try again') + '\n';
            });

            if (msg === '') {
                setAlertMessage('Squad created!');
                setAlertSeverity('success');
                setSquadName('');
                setLoading(false);
                clearAlert();
            } else {
                setAlertMessage(msg);
                setAlertSeverity('warning');
                setLoading(false);
                clearAlert();
            }
        });
    };

    return (
        <Dialog onClose={onClose} open={open} sx={{ '& .MuiDialog-paper': { padding: '20px', backgroundColor: theme.palette.primary.main } }}>
            <DialogTitle>
                Create Squad
            </DialogTitle>
            <DialogContent>
                {alertMessage ? <Alert style={{ marginBottom: '10px' }} severity={alertSeverity}>{alertMessage}</Alert> : <></>}
                <DialogContentText>
                    Type below name of the new squad(s) seperated by new line
                </DialogContentText>
                <TextField
                    color='secondary'
                    fullWidth
                    style={{ marginTop: '20px' }}
                    placeholder={`aya farm\nlith v2`}
                    multiline
                    minRows={3}
                    maxRows={5}
                    label="Squad Name"
                    value={squadName}
                    onChange={(e) => setSquadName(e.target.value)}
                />
            </DialogContent>
            <DialogActions style={{ justifyContent: 'start', marginLeft: '15px' }}>
                <Button
                    color='secondary'
                    variant='contained'
                    onClick={createNewSquad}
                >
                    {loading ? <CircularProgress style={{ color: 'white' }} size={"20px"} /> : 'Create'}
                </Button>
            </DialogActions>
        </Dialog>
    );
};