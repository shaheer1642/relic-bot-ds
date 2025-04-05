import { Snackbar, Button, Dialog, Grid, Typography, useTheme } from '@mui/material';
import React, { useState, useEffect } from 'react';
// import eventHandler from '../../event_handler/eventHandler'; TODO: implement app context

export default function Verification(props: { user: any }) {
    const theme = useTheme()

    const [snackBarOpen, setSnackBarOpen] = useState(false);
    const [verifyDialogOpen, setVerifyDialogOpen] = useState(false);
    const [instructionDialogOpen, setInstructionDialogOpen] = useState(false);
    const [verificationCode, setVerificationCode] = useState(null);
    const [updatedIgn, setUpdatedIgn] = useState(false);

    const handleIgnUpdate = () => {
        console.log('handleIgnUpdate called')
        closeSnackBar()
        closeInstructionDialog()
        setUpdatedIgn(true)
    }

    const checkVerification = () => {
        console.log('checkVerification called', props.user)
        if (props.user) {
            if (!props.user.ingame_name) {
                openSnackBar()
                openVerifyDialog()
            } else {
                closeSnackBar()
                closeVerifyDialog()
            }
        }
    }

    useEffect(() => {
        // eventHandler.addListener('user/login', checkVerification) TODO: implement app context
        // eventHandler.addListener('user/updatedIGN', handleIgnUpdate) TODO: implement app context
        // eventHandler.addListener('requestVerify', openVerifyDialog) TODO: implement app context

        return () => {
            // eventHandler.removeListener('user/login', checkVerification) TODO: implement app context
            // eventHandler.removeListener('user/updatedIGN', handleIgnUpdate) TODO: implement app context
            // eventHandler.removeListener('requestVerify', openVerifyDialog) TODO: implement app context
        }
    }, [])

    const openSnackBar = () => {
        setSnackBarOpen(true)
    }

    const closeSnackBar = () => {
        setSnackBarOpen(false)
    }

    const openVerifyDialog = () => {
        setVerifyDialogOpen(true)
    }

    const closeVerifyDialog = () => {
        setVerifyDialogOpen(false)
    }

    const openInstructionDialog = () => {
        fetchVerificationCode().then(() => setInstructionDialogOpen(true)).catch(console.error)
    }

    const closeInstructionDialog = () => {
        setInstructionDialogOpen(false)
    }

    const fetchVerificationCode = async () => {
        if (verificationCode) return;
        if (!localStorage.getItem('login_token')) return console.log('[fetchVerificationCode] login_token not found')
        const res = await (await fetch(`${process.env.VITE_SERVER_URL}api/allsquads/authorization/verification/ign/fetchCode?login_token=${localStorage.getItem('login_token')}`, { credentials: 'include' })).json()
        if (res.code == 200) {
            setVerificationCode(res.verificationCode)
        }
    }

    const action = (
        <React.Fragment>
            <Button variant='outlined' color="primary" size="small" onClick={openInstructionDialog}>
                Verify
            </Button>
        </React.Fragment>
    )

    return (
        <React.Fragment>
            <Snackbar
                open={instructionDialogOpen || verifyDialogOpen ? false : snackBarOpen}
                message="Please verify your Warframe username in order to create/join squads"
                action={action}
                ContentProps={{
                    sx: {
                        background: theme.palette.secondary.main,
                        color: 'white',
                        fontSize: '16px'
                    }
                }}
            />
            <Dialog onClose={closeInstructionDialog} open={instructionDialogOpen} sx={{ '& .MuiDialog-paper': { padding: '20px', backgroundColor: 'primary.dark' } }}>
                <Grid container>
                    <Grid size={12}>
                        {`Please follow these steps to verify your Warframe account:
                        \u200b
                        1) First make sure you are signed-in on Warframe forums by visiting this link: --link https://forums.warframe.com/ --link
                        \u200b
                        2) Visit this page to compose a new message to the bot (TradeKeeper): --link https://forums.warframe.com/messenger/compose/?to=6931114 --link
                        \u200b
                        3) Write the message body as given below:
                        Subject: ${verificationCode}
                        Message: Hi
                        \u200b
                        4) Click 'Send' button
                        \u200b
                        5) Bot will check the inbox in next couple of seconds and verify your account`.split('\n').map((line, index) => {
                            return (
                                <Typography key={index} style={{ wordWrap: "break-word", width: '100%' }}>
                                    {line.replace(/--link.*--link/g, '').trim()} {line.match('--link') ? <a target='_bank' href={(line.split('--link ')[1]).replace(/--link/g, '').trim()}>{(line.split('--link ')[1]).replace(/--link/g, '').trim()}</a> : <></>}
                                </Typography>
                            )
                        })}
                    </Grid>
                </Grid>
            </Dialog>
            <Dialog onClose={() => setUpdatedIgn(false)} open={updatedIgn} sx={{ '& .MuiDialog-paper': { padding: '20px' } }}>
                <Typography>Your IGN has been updated to {props.user?.ingame_name}</Typography>
            </Dialog>
            <Dialog onClose={closeVerifyDialog} open={verifyDialogOpen} sx={{ '& .MuiDialog-paper': { padding: '20px', backgroundColor: 'secondary.main' } }}>
                <Grid container rowSpacing={'20px'}>
                    <Grid size={12}>
                        <Typography variant='h5'>Please verify your Warframe username in order to join/create squads</Typography>
                    </Grid>
                    <Grid size={12} display={'flex'} justifyContent={'center'}>
                        <Button onClick={() => { closeVerifyDialog(); openInstructionDialog() }} variant='contained' color='primary'>Verify</Button>
                    </Grid>
                </Grid>
            </Dialog>
        </React.Fragment>
    );
}