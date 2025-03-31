import * as React from 'react';
import {
    Box, Toolbar, TableContainer, Table, TableHead, TableRow, TableCell, Paper, TableBody,
    tableCellClasses, Button, Modal, Typography, Select, MenuItem, FormControl, InputLabel, TextField,
    FormGroup, FormControlLabel, Checkbox, CircularProgress, Alert, Radio, RadioGroup, IconButton, Grid
} from '@mui/material';
import { Delete, Close } from '@mui/icons-material';
import { styled } from '@mui/material/styles';
import { socket } from '../../../websocket/socket';
import * as Colors from '@mui/material/colors';
import { withHooksHOC } from '../../../withHooksHOC';

const StyledTableCell = styled(TableCell)(({ theme }) => ({
    [`&.${tableCellClasses.head}`]: {
        backgroundColor: '#651fff',
        color: theme.palette.common.white,
    },
    [`&.${tableCellClasses.body}`]: {
        fontSize: 14,
    },
}));

const StyledTableRow = styled(TableRow)(({ theme }) => ({
    '&:nth-of-type(odd)': {
        backgroundColor: theme.palette.action.hover,
    },
    // hide last border
    '&:last-child td, &:last-child th': {
        border: 0,
    },
}));

const modalStyle = {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    width: '80vw',
    bgcolor: 'background.paper',
    border: '2px solid #000',
    boxShadow: 24,
    p: 4,
};

class ClanAffiliates extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            clans: [],

            modalShow: false,
            modalAlert: '',
            modalClanName: '',
            modalDescription: '',
            modalRequirements: '',
            modalStats: '',
            modalLogoUrl: '',
        }
    }

    componentDidMount() {
        this.fetchClans()
    }

    componentWillUnmount() {
    }

    fetchClans = () => {
        socket.emit('allsquads/clans/fetch', {}, (res) => {
            if (res.code == 200) {
                this.setState({
                    clans: [...res.data]
                })
            }
        })
    }

    render() {
        return (
            <Box
                component="main"
                sx={{ flexGrow: 1, bgcolor: 'background.default', p: 3 }}
            >
                <Toolbar />
                {this.state.clans.length == 0 ? <div style={{ display: 'flex', justifyContent: 'center' }}><CircularProgress /></div> :
                    <Grid container style={{ maxHeight: '80vh', overflow: 'auto' }}>
                        {
                            this.state.clans.map(clan => {
                                return (
                                    <Grid container style={{ border: '5px solid #651fff', borderRadius: '20px', padding: '20px' }} xs={6}>
                                        <Grid item xs={10}>
                                            <Typography sx={{ mx: '10px', my: '20px' }} variant="h4" style={{ color: '#651fff' }}>
                                                {clan.clan_name}
                                            </Typography>
                                        </Grid>
                                        <Grid item xs={2}>
                                            <Button size='large' onClick={() => socket.emit('allsquads/clans/delete', { id: clan.id, user_id: this.props.user?.user_id }, (res) => this.fetchClans())}><Delete fontSize='large' sx={{ color: Colors.red[900] }} /></Button>
                                        </Grid>
                                        <Grid item xs={12}>
                                            {clan.description.split('\n').map(line => {
                                                return (
                                                    <Typography>
                                                        {line}
                                                    </Typography>
                                                )
                                            })}
                                        </Grid>
                                        <Grid item xs={6}>
                                            <Typography sx={{ mx: '10px', my: '20px' }} variant="h6">
                                                -- Requirements --
                                            </Typography>
                                            {clan.requirements.split('\n').map(line => {
                                                return (
                                                    <Typography>
                                                        {line}
                                                    </Typography>
                                                )
                                            })}
                                        </Grid>
                                        <Grid item xs={6}>
                                            <Typography sx={{ mx: '10px', my: '20px' }} variant="h6">
                                                -- Stats --
                                            </Typography>
                                            {clan.stats.split('\n').map(line => {
                                                return (
                                                    <Typography>
                                                        {line}
                                                    </Typography>
                                                )
                                            })}
                                        </Grid>
                                    </Grid>
                                )
                            })
                        }
                    </Grid>
                }
                <Button variant="contained" style={{ marginTop: '10px' }} onClick={() => this.setState({ modalShow: true })}>+ Add New</Button>

                <Modal
                    open={this.state.modalShow}
                >
                    <Box sx={modalStyle}>
                        <Grid container>
                            <Grid item xs={11} >
                                <Typography sx={{ mx: '10px', my: '20px' }} variant="h6" component="h2">
                                    Add new clan
                                </Typography>
                            </Grid>
                            <Grid item xs={1} style={{ display: 'flex', justifyContent: 'flex-end' }}>
                                <IconButton onClick={() => this.setState({ modalShow: false })} style={{ borderRadius: 0 }}>
                                    <Close />
                                </IconButton>
                            </Grid>

                            <Grid item xs={12} >
                                {this.state.modalAlert != '' ? <Alert severity="info" sx={{ m: '10px' }}>{this.state.modalAlert}</Alert> : <></>}
                            </Grid>

                            <Grid item xs={12} >
                                <FormControl sx={{ m: '10px', width: '100%' }} size="small">
                                    <TextField label="Clan Name" variant="standard" onChange={(e) => this.setState({ modalClanName: e.target.value })} />
                                </FormControl>
                            </Grid>
                            <Grid item xs={12} >
                                <FormControl sx={{ m: '10px', width: '100%' }} size="small">
                                    <TextField label="Logo Url" variant="standard" onChange={(e) => this.setState({ modalLogoUrl: e.target.value })} />
                                </FormControl>
                            </Grid>
                            <Grid item xs={12} >
                                <FormControl sx={{ m: '10px', width: '100%' }} size="small">
                                    <TextField multiline minRows={2} maxRows={5} label="Description" variant="standard" onChange={(e) => this.setState({ modalDescription: e.target.value })} />
                                </FormControl>
                            </Grid>
                            <Grid item xs={12} >
                                <FormControl sx={{ m: '10px', width: '100%' }} size="small">
                                    <TextField multiline minRows={2} maxRows={5} label="Requirements" variant="standard" onChange={(e) => this.setState({ modalRequirements: e.target.value })} />
                                </FormControl>
                            </Grid>
                            <Grid item xs={12} >
                                <FormControl sx={{ m: '10px', width: '100%' }} size="small">
                                    <TextField multiline minRows={2} maxRows={5} label="Stats" variant="standard" onChange={(e) => this.setState({ modalStats: e.target.value })} />
                                </FormControl>
                            </Grid>

                            <Grid item xs={12} >
                                <Button variant="contained" sx={{ m: '10px' }} onClick={() => {
                                    this.setState({
                                        modalAlert: 'Processing...'
                                    })
                                    socket.emit('allsquads/clans/create', {
                                        user_id: this.props.user?.user_id,
                                        clan_name: this.state.modalClanName,
                                        description: this.state.modalDescription,
                                        logo_url: this.state.modalLogoUrl,
                                        requirements: this.state.modalRequirements,
                                        stats: this.state.modalStats
                                    }, (res) => {
                                        this.fetchClans()
                                        console.log(res)
                                        this.setState({
                                            modalAlert: res.message
                                        }, () => setTimeout(() => this.setState({
                                            modalAlert: ''
                                        }), 3000))
                                    })
                                }}>Submit</Button>
                            </Grid>
                        </Grid>
                    </Box>
                </Modal>
            </Box>
        );
    }
}

export default withHooksHOC(ClanAffiliates)