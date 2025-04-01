/* eslint eqeqeq: "off", no-unused-vars: "off" */
import React from 'react';
import { Outlet } from "react-router-dom";
import { Grid } from '@mui/material';
import { withHooksHOC } from '../../withHooksHOC';

export default function MiniframeLayout() {
  return (
    <Grid container>
      <Grid size={12}>
        <Outlet />
      </Grid>
    </Grid>
  );
};