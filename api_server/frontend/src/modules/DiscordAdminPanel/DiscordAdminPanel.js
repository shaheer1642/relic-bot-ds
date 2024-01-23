import * as React from 'react';
import Box from '@mui/material/Box';
import Drawer from '@mui/material/Drawer';
import CssBaseline from '@mui/material/CssBaseline';
import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import List from '@mui/material/List';
import Typography from '@mui/material/Typography';
import Divider from '@mui/material/Divider';
import ListItem from '@mui/material/ListItem';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import InboxIcon from '@mui/icons-material/MoveToInbox';
import MailIcon from '@mui/icons-material/Mail';
import DefaultHostingTable from './modules/DefaultHostingTable';
import SquadsBotKeywordsTable from './modules/SquadsBotKeywordsTable';
import ClanAffiliates from './modules/ClanAffiliates';
import AllSquadsFaqs from './modules/AllSquadsFaqs';
import SquadBotDefaultSquads from './modules/SquadBotDefaultSquads';
import { socket, socketHasConnected } from '../../websocket/socket';

const drawerWidth = 240;

export default class DiscordAdminPanel extends React.Component {
    constructor(props) {
        super(props);
        this.state= {
            socketConnecting: true,
            drawerIndex: 0
        }
    }

    componentDidMount() {
        console.log('[LoginLayout] componentDidMount')
        socketHasConnected().then(() => this.setState({socketConnecting: false})).catch(console.error)
        socket.on('connect', this.SocketConnectedListener)
        socket.on('disconnect', this.SocketDisconnectedListener)
    }
    
    componentWillUnmount() {
        console.log('[LoginLayout] componentWillUnmount')
        socket.removeListener(this.SocketConnectedListener)
        socket.removeListener(this.SocketDisconnectedListener)
    }

    SocketConnectedListener = () => this.setState({socketConnecting: false})
    SocketDisconnectedListener = () => this.setState({socketConnecting: true})

    render() {
        return (
            <Box sx={{ display: 'flex' }}>
            {this.state.socketConnecting ? <div style={{display: 'flex', alignContent: 'center', justifyContent: 'center'}}><h1>Establishing connection...</h1></div> :
            <React.Fragment>
                <CssBaseline />
                <AppBar
                position="fixed"
                sx={{ width: `calc(100% - ${drawerWidth}px)`, ml: `${drawerWidth}px` }}
                >
                <Toolbar>
                    <Typography variant="h6" noWrap component="div">
                        Bot Configuration
                    </Typography>
                </Toolbar>
                </AppBar>
                <Drawer
                sx={{
                    width: drawerWidth,
                    flexShrink: 0,
                    '& .MuiDrawer-paper': {
                    width: drawerWidth,
                    boxSizing: 'border-box',
                    },
                }}
                variant="permanent"
                anchor="left"
                >
                <Toolbar />
                <Divider />
                <List>
                    {['Default Hosting Table','Squad Bot Keywords','Clan Affiliates','FAQ Settings','Squad Bot Default Squads'].map((text, index) => (
                        <ListItem key={text} disablePadding>
                            <ListItemButton onClick={() => this.setState({drawerIndex: index})} style={{backgroundColor: this.state.drawerIndex == index ? '#651fff':'white', color: this.state.drawerIndex == index ? 'white':'black'}}>
                                <ListItemText primary={text} />
                            </ListItemButton>
                        </ListItem>
                    ))}
                </List>
                </Drawer>
                {
                this.state.drawerIndex == 0 ? <DefaultHostingTable />:
                this.state.drawerIndex == 1 ? <SquadsBotKeywordsTable />:
                this.state.drawerIndex == 2 ? <ClanAffiliates />:
                this.state.drawerIndex == 3 ? <AllSquadsFaqs />:
                this.state.drawerIndex == 4 ? <SquadBotDefaultSquads />:
                <></>
                }
            </React.Fragment>
            }
            </Box>
        );
    }
}