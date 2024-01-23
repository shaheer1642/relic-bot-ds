/* eslint eqeqeq: "off", no-unused-vars: "off" */
import React from 'react';
import { Link, Outlet } from "react-router-dom";
import {Grid, Typography} from '@mui/material';
import {socket,socketHasConnected} from '../websocket/socket'
import Squads from './Squads/Squads';

class MainHome extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      squadsArr: []
    };
  }

  componentDidMount() {
  }

  componentWillUnmount() {
  }

  render() {
    return (
      <Grid container>
        <Squads />
      </Grid>
    );
  }
}

export default MainHome;