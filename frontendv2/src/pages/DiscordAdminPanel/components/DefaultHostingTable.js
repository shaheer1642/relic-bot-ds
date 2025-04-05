import * as React from 'react';
import {
    Box, Toolbar, TableContainer, Table, TableHead, TableRow, TableCell, Paper, TableBody,
    tableCellClasses, Button, Modal, Typography, Select, MenuItem, FormControl, InputLabel, TextField,
    FormGroup, FormControlLabel, Checkbox, CircularProgress, Alert
} from '@mui/material';
import { Delete } from '@mui/icons-material';
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
    width: 400,
    bgcolor: 'background.paper',
    border: '2px solid #000',
    boxShadow: 24,
    p: 4,
};

class DefaultHostingTable extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            defaultHosts: [],

            modalShow: false,
            modalTier: 'Lith',
            modalRelics: '',
            modalSquadType: '4b4',
            modalRefinements: '',
            modalInt: false,
            modalFlaw: false,
            modalRad: true,
            modalAlert: ''
        }
    }

    componentDidMount() {
        socket.emit('relicbot/defaultHostingTable/fetch', {}, (res) => {
            if (res.code == 200) {
                this.setState({
                    defaultHosts: [...res.data]
                })
            }
        })
        socket.addEventListener('defaultHostingTableUpdate', this.defaultHostingTableUpdateListener)
    }

    componentWillUnmount() {
        socket.removeEventListener('defaultHostingTableUpdate', this.defaultHostingTableUpdateListener)
    }

    defaultHostingTableUpdateListener = () => {
        socket.emit('relicbot/defaultHostingTable/fetch', {}, (res) => {
            if (res.code == 200) {
                this.setState({
                    defaultHosts: [...res.data]
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
                {this.state.defaultHosts.length == 0 ? <div style={{ display: 'flex', justifyContent: 'center', width: '100%' }}><CircularProgress /></div> :
                    <TableContainer component={Paper} sx={{ backgroundColor: 'primary', minWidth: 400, maxHeight: '80vh' }}>
                        <Table stickyHeader>
                            <TableHead>
                                <StyledTableRow>
                                    <StyledTableCell>Relics</StyledTableCell>
                                    <StyledTableCell>Squad Type</StyledTableCell>
                                    <StyledTableCell>Refinement(s)</StyledTableCell>
                                    <StyledTableCell></StyledTableCell>
                                </StyledTableRow>
                            </TableHead>
                            <TableBody>
                                {this.state.defaultHosts.map((host, index) => (
                                    <StyledTableRow
                                        key={index}
                                        sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
                                    >
                                        <StyledTableCell>{`${host.tier} ${host.main_relics.join(' ')}`}</StyledTableCell>
                                        <StyledTableCell>{host.squad_type}</StyledTableCell>
                                        <StyledTableCell>{host.main_refinements.join(' ')}</StyledTableCell>
                                        <StyledTableCell>
                                            <Button onClick={() => socket.emit('relicbot/defaultHostingTable/delete', { id: host.id, user_id: this.props.user?.user_id, })}><Delete sx={{ color: Colors.red[900] }} /></Button>
                                        </StyledTableCell>
                                    </StyledTableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </TableContainer>
                }
                <Button variant="contained" style={{ marginTop: '10px' }} onClick={() => this.setState({ modalShow: true })}>+ Add New</Button>

                <Modal
                    open={this.state.modalShow}
                    onClose={() => this.setState({ modalShow: false })}
                >
                    <Box sx={modalStyle}>
                        <Typography sx={{ mx: '10px', my: '20px' }} variant="h6" component="h2">
                            Add new default host
                        </Typography>

                        {this.state.modalAlert != '' ? <Alert severity="info" sx={{ m: '10px' }}>{this.state.modalAlert}</Alert> : <></>}

                        <FormControl sx={{ m: '10px', minWidth: 120 }} size="small">
                            <InputLabel id="demo-select-small">Tier</InputLabel>
                            <Select
                                value={this.state.modalTier}
                                label="Tier"
                                onChange={(e) => this.setState({ modalTier: e.target.value })}
                            >
                                <MenuItem value={"Lith"}>Lith</MenuItem>
                                <MenuItem value={"Meso"}>Meso</MenuItem>
                                <MenuItem value={"Neo"}>Neo</MenuItem>
                                <MenuItem value={"Axi"}>Axi</MenuItem>
                            </Select>
                        </FormControl>

                        <FormControl sx={{ m: '10px', minWidth: 120 }} size="small">
                            <InputLabel id="demo-select-small">Squad Type</InputLabel>
                            <Select
                                value={this.state.modalSquadType}
                                label="Squad Type"
                                onChange={(e) => this.setState({ modalSquadType: e.target.value })}
                            >
                                <MenuItem value={"2b2"}>2b2</MenuItem>
                                <MenuItem value={"4b4"}>4b4</MenuItem>
                            </Select>
                        </FormControl>

                        <TextField sx={{ m: '10px' }} label="Relics" variant="standard" onChange={(e) => this.setState({ modalRelics: e.target.value })} />

                        <FormGroup sx={{ m: '10px' }}>
                            <FormControlLabel control={<Checkbox checked={this.state.modalInt} onChange={(e) => this.setState({ modalInt: e.target.checked })} />} label="Intact" />
                            <FormControlLabel control={<Checkbox checked={this.state.modalFlaw} onChange={(e) => this.setState({ modalFlaw: e.target.checked })} />} label="Flawless" />
                            <FormControlLabel control={<Checkbox checked={this.state.modalRad} onChange={(e) => this.setState({ modalRad: e.target.checked })} />} label="Radiant" />
                        </FormGroup>

                        <Button variant="contained" sx={{ m: '10px' }} onClick={() => {
                            this.setState({
                                modalAlert: 'Processing...'
                            })
                            socket.emit('relicbot/defaultHostingTable/create', {
                                user_id: this.props.user?.user_id,
                                tier: this.state.modalTier,
                                squad_type: this.state.modalSquadType,
                                main_relics: this.state.modalRelics == '' ? null : this.state.modalRelics.replace(/lith/g, '').replace(/meso/g, '').replace(/neo/g, '').replace(/axi/g, '').trim().replace(/,/g, ' ').replace(/\s+/g, ' ').split(' '),
                                main_refinements: [this.state.modalInt ? 'int' : null, this.state.modalFlaw ? 'flaw' : null, this.state.modalRad ? 'rad' : null].filter(e => e !== null),
                            }, (res) => {
                                console.log(res)
                                this.setState({
                                    modalAlert: res.message
                                }, () => setTimeout(() => this.setState({
                                    modalAlert: ''
                                }), 3000))
                            })
                        }}>Submit</Button>
                    </Box>
                </Modal>
            </Box>
        );
    }
}

export default withHooksHOC(DefaultHostingTable)