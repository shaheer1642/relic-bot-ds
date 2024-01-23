import * as React from 'react';
import {Box, Toolbar, TableContainer, Table, TableHead, TableRow, TableCell, Paper, TableBody, 
    tableCellClasses, Button, Modal, Typography, Select, MenuItem, FormControl, InputLabel, TextField,
    FormGroup, FormControlLabel, Checkbox, CircularProgress, Alert, Radio, RadioGroup, IconButton, Grid } from '@mui/material';
import {Delete, Close} from '@mui/icons-material';
import { styled } from '@mui/material/styles';
import { socket } from '../../../websocket/socket';
import * as Colors from '@mui/material/colors';

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

export default class SquadsBotKeywordsTable extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            keywords: [],

            modalShow: false,
            modalKeyword: '',
            modalInclude: true,
            modalAlert: ''
        }
    }

    componentDidMount() {
        socket.emit('squadbot/keywords/fetch', {}, (res) => {
            if (res.code == 200) {
                this.setState({
                    keywords: [...res.data]
                })
            }
        })
        socket.addEventListener('squadKeywordsUpdate', this.squadKeywordsUpdateListener)
    }

    componentWillUnmount() {
        socket.removeEventListener('squadKeywordsUpdate', this.squadKeywordsUpdateListener)
    }

    squadKeywordsUpdateListener = () => {
        socket.emit('squadbot/keywords/fetch', {}, (res) => {
            if (res.code == 200) {
                this.setState({
                    keywords: [...res.data]
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
            {this.state.keywords.length == 0 ? <div style={{display: 'flex', justifyContent: 'center'}}><CircularProgress /></div>:
                <TableContainer component={Paper} sx={{backgroundColor: 'primary', minWidth: 400, maxHeight: '80vh'}}>
                    <Table stickyHeader>
                        <TableHead>
                        <StyledTableRow>
                            <StyledTableCell>Keywords</StyledTableCell>
                            <StyledTableCell></StyledTableCell>
                            <StyledTableCell></StyledTableCell>
                        </StyledTableRow>
                        </TableHead>
                        <TableBody>
                        {this.state.keywords.map((keyword,index) => (
                            <StyledTableRow
                                key={index}
                                sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
                            >
                                <StyledTableCell>{keyword.name}</StyledTableCell>
                                <StyledTableCell>{keyword.include ? 'should include':'should not include'}</StyledTableCell>
                                <StyledTableCell>
                                    <Button onClick={() => socket.emit('squadbot/keywords/delete', {id: keyword.id})}><Delete sx={{ color: Colors.red[900] }} /></Button>
                                </StyledTableCell>
                            </StyledTableRow>
                        ))}
                        </TableBody>
                    </Table>
                </TableContainer>
            }
            <Button variant="contained" style={{marginTop: '10px'}} onClick={() => this.setState({modalShow: true})}>+ Add New</Button>

            <Modal disableEnforceFocus
                open={this.state.modalShow}
            >
                <Box sx={modalStyle}>
                    <Grid container>
                        <Grid item xs={11} >
                            <Typography sx={{mx:'10px',my:'20px'}} variant="h6" component="h2">
                                Add new keyword
                            </Typography>
                        </Grid>
                        <Grid item xs={1} style={{display: 'flex', justifyContent: 'flex-end'}}>
                            <IconButton onClick={() => this.setState({modalShow: false})} style={{borderRadius: 0}}>
                                <Close />
                            </IconButton>
                        </Grid>
                        <Grid item xs={12} >
                            {this.state.modalAlert != '' ? <Alert severity="info" sx={{m: '10px'}}>{this.state.modalAlert}</Alert>:<></>}
                        </Grid>
                        <Grid item xs={12} >
                        <FormControl sx={{ m: '10px', minWidth: 120 }} size="small">
                            <TextField label="Keyword" variant="standard" onChange={(e) => this.setState({modalKeyword: e.target.value})}/>
                        </FormControl>
                        </Grid>
                        <Grid item xs={12} >
                            <FormControl sx={{m: '10px'}}>
                                <RadioGroup
                                    value={this.state.modalInclude}
                                    onChange={(e) => this.setState({modalInclude: e.target.value})}
                                >
                                    <FormControlLabel value={true} control={<Radio />} label="Should include" />
                                    <FormControlLabel value={false} control={<Radio />} label="Should not include"/>
                                </RadioGroup>
                            </FormControl>
                        </Grid>
                        <Grid item xs={12} >
                        <Button variant="contained" onClick={() => {
                            this.setState({
                                modalAlert: 'Processing...'
                            })
                            socket.emit('squadbot/keywords/create', {
                                name: this.state.modalKeyword,
                                include: this.state.modalInclude
                            }, (res) => {
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