import * as React from 'react';
import {Box, Toolbar, TableContainer, Table, TableHead, TableRow, TableCell, Paper, TableBody, 
    tableCellClasses, Button, Modal, Typography, Select, MenuItem, FormControl, InputLabel, TextField,
    FormGroup, FormLabel, FormControlLabel, Checkbox, CircularProgress, Alert, Radio, RadioGroup, IconButton, Grid } from '@mui/material';
import {Delete, Close, Edit} from '@mui/icons-material';
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
    width: '80vw',
    bgcolor: 'background.paper',
    border: '2px solid #000',
    boxShadow: 24,
    p: 4,
};

export default class AllSquadsFaqs extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            faqs: [],
            faqLanguage: 'en',

            modalShow: false,
            modalAlert: '',
            modalOrder: '',
            modalTitle: '',
            modalBody: '',
            modalImageUrl: '',
            modalFaqId: '',
            modalLanguage: 'en',
        }
    }

    componentDidMount() {
        this.fetchFaqs()
    }

    componentWillUnmount() {
    }

    fetchFaqs = () => {
        socket.emit('allsquads/faqs/fetch', {}, (res) => {
            if (res.code == 200) {
                this.setState({
                    faqs: [...res.data]
                })
            }
        })
    }

    radioBoxOnChange = (e) => {
        this.setState({
            modalLanguage: e.target.value
        })
    }

    destroyModal = () => {
        this.setState({
            modalShow: false,
            modalHeader: '',
            modalAlert: '',
            modalOrder: '',
            modalTitle: '',
            modalBody: '',
            modalImageUrl: '',
            modalFaqId: '',
        })
    }

    updateModalValues = (faq_id) => {
        console.log('[AllSquadsFaqs.updateModalValues] called. faq_id',faq_id)
        this.state.faqs.forEach(faq => {
            if (faq.faq_id == faq_id) {
                this.setState({
                    modalShow: true, 
                    modalHeader: 'Edit', 
                    modalOrder: faq.id, 
                    modalFaqId: faq.faq_id,
                    modalTitle: (faq.title?.[this.state.modalLanguage] || ''), 
                    modalBody: (faq.body?.[this.state.modalLanguage] || ''),
                    modalImageUrl: (faq.image_url?.[this.state.modalLanguage] || '')
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
            {this.state.faqs.length == 0 ? <div style={{display: 'flex', justifyContent: 'center'}}><CircularProgress /></div>:
            <Grid container style={{maxHeight: '80vh', overflow: 'auto'}}>
                <Grid item xs={12}>
                    <FormControl>
                        <FormLabel id="demo-row-radio-buttons-group-label">Language</FormLabel>
                        <RadioGroup
                            row
                            aria-labelledby="demo-row-radio-buttons-group-label"
                            name="row-radio-buttons-group"
                            onChange={(e) => this.setState({faqLanguage: e.target.value, modalLanguage: e.target.value})}
                            value={this.state.faqLanguage}
                        >
                            <FormControlLabel value="en" control={<Radio />} label="English" />
                            <FormControlLabel value="fr" control={<Radio />} label="French" />
                            <FormControlLabel value="it" control={<Radio />} label="Italian" />
                        </RadioGroup>
                    </FormControl>
                </Grid>

                {
                    this.state.faqs.map(faq => {
                        return (
                            <Grid container style={{ border: '5px solid #651fff', borderRadius: '20px', padding: '20px'}} xs={6}>
                                <Grid item xs={10}>
                                    <Typography sx={{mx:'10px',my:'20px'}} variant="h4" style={{color: '#651fff'}}>
                                        #{faq.id} {faq.title[this.state.faqLanguage]}
                                    </Typography>
                                </Grid>
                                <Grid item xs={1}>
                                    <Button size='large' onClick={() => this.updateModalValues(faq.faq_id)}><Edit fontSize='large' sx={{ color: Colors.blue[900] }} /></Button>
                                </Grid>
                                <Grid item xs={1}>
                                    <Button size='large' disabled = {faq.disable_delete} onClick={() => socket.emit('allsquads/faqs/delete', {faq_id: faq.faq_id},(res) => this.fetchFaqs())}><Delete fontSize='large' sx={{ color: Colors.red[900] }} /></Button>
                                </Grid>
                                <Grid item xs={12}>
                                    {faq.body[this.state.faqLanguage]?.split('\r\n').map(line => {
                                        return (
                                            <Typography>
                                                {!line ? '\u200b':line}
                                            </Typography>
                                        )
                                    })}
                                    {
                                        faq.image_url?.[this.state.faqLanguage] ? 
                                        <Grid item xs={12}>
                                            <img 
                                                width={"100%"}
                                                height={"100%"}
                                                src={faq.image_url?.[this.state.faqLanguage]}
                                                alt="Image"
                                            />
                                        </Grid>:<></>
                                    }
                                </Grid>
                            </Grid>
                        )
                    })
                }
            </Grid>
            }
            <Button variant="contained" style={{marginTop: '10px'}} onClick={() => this.setState({modalShow: true, modalHeader: 'Add New Question'})}>+ New Question</Button>

            <Modal
                open={this.state.modalShow}
            >
                <Box sx={modalStyle}>
                    <Grid container>
                        <Grid item xs={11} >
                            <Typography sx={{mx:'10px',my:'20px'}} variant="h6" component="h2">
                                {this.state.modalHeader}
                            </Typography>
                        </Grid>
                        <Grid item xs={1} style={{display: 'flex', justifyContent: 'flex-end'}}>
                            <IconButton onClick={() => this.destroyModal()} style={{borderRadius: 0}}>
                                <Close />
                            </IconButton>
                        </Grid>

                        <Grid item xs={12} >
                            {this.state.modalAlert != '' ? <Alert severity="info" sx={{m: '10px'}}>{this.state.modalAlert}</Alert>:<></>}
                        </Grid>

                        <FormControl>
                            <FormLabel id="demo-row-radio-buttons-group-label">Language</FormLabel>
                            <RadioGroup
                                row
                                aria-labelledby="demo-row-radio-buttons-group-label"
                                name="row-radio-buttons-group"
                                onChange={(e) => {
                                    this.setState({modalLanguage: e.target.value},() => this.updateModalValues(this.state.modalFaqId))
                                }}
                                value={this.state.modalLanguage}
                            >
                                <FormControlLabel value="en" control={<Radio />} label="English" />
                                <FormControlLabel value="fr" control={<Radio />} label="French" />
                                <FormControlLabel value="it" control={<Radio />} label="Italian" />
                            </RadioGroup>
                        </FormControl>

                        {
                            this.state.modalOrder ? 
                            <Grid item xs={12} >
                                <FormControl sx={{ m: '10px', width: '100%' }} size="small">
                                    <TextField required label="Order" variant="standard" onChange={(e) => this.setState({modalOrder: e.target.value})} value = {this.state.modalOrder}/>
                                </FormControl>
                            </Grid>:<></>
                        }
                        <Grid item xs={12} >
                            <FormControl sx={{ m: '10px', width: '100%' }} size="small">
                                <TextField required label="Title" variant="standard" onChange={(e) => this.setState({modalTitle: e.target.value})} value = {this.state.modalTitle}/>
                            </FormControl>
                        </Grid>
                        <Grid item xs={12} >
                            <FormControl sx={{ m: '10px', width: '100%' }} size="small">
                                <TextField required multiline minRows={2} maxRows={10} label="Body" variant="standard" onChange={(e) => this.setState({modalBody: e.target.value})} value = {this.state.modalBody}/>
                            </FormControl>
                        </Grid>
                        <Grid item xs={12} >
                            <FormControl sx={{ m: '10px', width: '100%' }} size="small">
                                <TextField label="Image Url (optional)" variant="standard" onChange={(e) => this.setState({modalImageUrl: e.target.value})} value = {this.state.modalImageUrl}/>
                            </FormControl>
                        </Grid>
                        
                        <Grid item xs={12} >
                            <Button variant="contained" sx={{ m: '10px'}} onClick={() => {
                                this.setState({
                                    modalAlert: 'Processing...'
                                })
                                socket.emit(`allsquads/faqs/${this.state.modalFaqId == '' ? 'create':'update'}`, {
                                    id: this.state.modalOrder,
                                    title: this.state.modalTitle,
                                    body: this.state.modalBody,
                                    image_url: this.state.modalImageUrl,
                                    faq_id: this.state.modalFaqId,
                                    language: this.state.modalLanguage
                                }, (res) => {
                                    this.fetchFaqs()
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