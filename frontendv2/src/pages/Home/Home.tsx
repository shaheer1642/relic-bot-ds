/* eslint eqeqeq: "off", no-unused-vars: "off" */
import React from 'react';
import { Link, Outlet } from "react-router-dom";
import { Grid, Typography } from '@mui/material';
import { socket, socketHasConnected } from '../websocket/socket'
import Squads from './Squads/Squads';

export default function Home() {
    return (
        <Grid2 container>
            <Grid2 item>
                <Squads />
            </Grid2>
        </Grid2>
    );
}