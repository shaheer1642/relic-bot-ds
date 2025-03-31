import { Snackbar, Button, IconButton, Dialog, Grid, Typography } from '@mui/material';
import React, { Component } from 'react';
// import { this.props.user } from '../../objects/user_login';
import { getCookie } from '../../cookie_handler';
import eventHandler from '../../event_handler/eventHandler';
import theme from '../../theme';
import { socket } from '../../websocket/socket';
import { withHooksHOC } from '../../withHooksHOC';

class Verification extends Component {
    constructor(props) {
        super(props);
        this.state = {  
            snackBarOpen: false,
            verifyDialogOpen: false,
            instructionDialogOpen: false,
            verificationCode: null,
            updatedIgn: false
        }
    }

    componentDidMount() {
        eventHandler.addListener('user/login',this.checkVerification)
        eventHandler.addListener('user/updatedIGN',this.handleIgnUpdate)
        eventHandler.addListener('requestVerify',this.openVerifyDialog)
    }

    componentWillUnmount() {
        eventHandler.removeListener('user/login',this.checkVerification)
        eventHandler.removeListener('user/updatedIGN',this.handleIgnUpdate)
        eventHandler.removeListener('requestVerify',this.openVerifyDialog)
    }

    handleIgnUpdate = () => {
        console.log('handleIgnUpdate called')
        this.closeSnackBar()
        this.closeInstructionDialog()
        this.setState({updatedIgn: true})
    }

    checkVerification = () => {
        console.log('checkVerification called',this.props.user)
        if (this.props.user) {
            if (!this.props.user.ingame_name) {
                this.openSnackBar()
                this.openVerifyDialog()
            } else {
                this.closeSnackBar()
                this.closeVerifyDialog()
            }
        }
    }

    componentDidUpdate() {
    }

    openSnackBar = () => {
        this.setState({snackBarOpen: true})
    }
    closeSnackBar = () => {
        this.setState({snackBarOpen: false})
    }
    openVerifyDialog = () => {
        this.setState({verifyDialogOpen: true})
    }
    closeVerifyDialog = () => {
        this.setState({verifyDialogOpen: false})
    }
    openInstructionDialog = () => {
        this.fetchVerificationCode().then(() => this.setState({instructionDialogOpen: true}))
    }
    closeInstructionDialog = () => {
        this.setState({instructionDialogOpen: false})
    }

    fetchVerificationCode = () => {
        return new Promise((resolve, reject) => {
            if (this.state.verificationCode) return resolve()
            if (!getCookie('login_token')) return console.log('[fetchVerificationCode] login_token not found')
            fetch(`${process.env.REACT_APP_SOCKET_URL}api/allsquads/authorization/verification/ign/fetchCode?login_token=${getCookie('login_token')}`, {credentials: 'include'})
            .then((res) => res.json())
            .then((res) => {
                if (res.code == 200) {
                    this.setState({
                        verificationCode: res.verificationCode
                    }, () => resolve())
                }
            }).catch(console.error);
        })
    }

    action = (
        <React.Fragment>
            <Button variant='outlined' color="primary" size="small" onClick={this.openInstructionDialog}>
                Verify
            </Button>
        </React.Fragment>
    )

    render() { 
        return (  
            <React.Fragment>
                <Snackbar
                    open={this.state.instructionDialogOpen || this.state.verifyDialogOpen ? false : this.state.snackBarOpen}
                    message="Please verify your Warframe username in order to create/join squads"
                    action={this.action}
                    ContentProps={{
                      sx: {
                        background: theme.palette.secondary.main,
                        color: 'white',
                        fontSize: '16px'
                      }
                    }}
                />
                <Dialog onClose={this.closeInstructionDialog} open={this.state.instructionDialogOpen} sx={{ '& .MuiDialog-paper': { padding: '20px', backgroundColor: 'primary.dark' } }}>
                    <Grid container>
                        <Grid item xs={12}>
                                {`Please follow these steps to verify your Warframe account:
                                \u200b
                                1) First make sure you are signed-in on Warframe forums by visiting this link: --link https://forums.warframe.com/ --link
                                \u200b
                                2) Visit this page to compose a new message to the bot (TradeKeeper): --link https://forums.warframe.com/messenger/compose/?to=6931114 --link
                                \u200b
                                3) Write the message body as given below:
                                Subject: ${this.state.verificationCode}
                                Message: Hi
                                \u200b
                                4) Click 'Send' button
                                \u200b
                                5) Bot will check the inbox in next couple of seconds and verify your account`.split('\n').map((line,index) => {
                                    return (
                                    <Typography key={index}  style={{wordWrap: "break-word", width: '100%'}}>
                                        {line.replace(/--link.*--link/g,'').trim()} {line.match('--link') ? <a target='_bank' href={(line.split('--link ')[1]).replace(/--link/g,'').trim()}>{(line.split('--link ')[1]).replace(/--link/g,'').trim()}</a> : <></>}
                                    </Typography>
                                    )
                                })}
                        </Grid>
                    </Grid>
                </Dialog>
                <Dialog onClose={() => this.setState({updatedIgn: false})} open={this.state.updatedIgn} sx={{ '& .MuiDialog-paper': { padding: '20px' } }}>
                    <Typography>Your IGN has been updated to {this.props.user?.ingame_name}</Typography>
                </Dialog>
                <Dialog onClose={this.closeVerifyDialog} open={this.state.verifyDialogOpen} sx={{ '& .MuiDialog-paper': { padding: '20px', backgroundColor: 'secondary.main' } }}>
                    <Grid container rowSpacing={'20px'}>
                        <Grid item xs={12}>
                            <Typography variant='h5'>Please verify your Warframe username in order to join/create squads</Typography>
                        </Grid>
                        <Grid item xs={12} display={'flex'} justifyContent={'center'}>
                            <Button onClick={() => {this.closeVerifyDialog();this.openInstructionDialog()}} variant='contained' color='primary'>Verify</Button>
                        </Grid>
                    </Grid>
                </Dialog>
            </React.Fragment>
        );
    }
}
 
export default withHooksHOC(Verification);