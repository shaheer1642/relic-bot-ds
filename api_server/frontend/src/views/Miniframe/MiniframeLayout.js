/* eslint eqeqeq: "off", no-unused-vars: "off" */
import React from 'react';
import { Outlet } from "react-router-dom";
import { Grid } from '@mui/material';
import { withHooksHOC } from '../../withHooksHOC';

class MiniframeLayout extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
    };
  }

  componentDidMount() {
  }

  componentWillUnmount() {
  }

  componentDidUpdate() {
  }

  render() {
    return (
      <Grid container>
        <Grid item xs={12}>
          < Outlet />
        </Grid>
      </Grid>
    );
  }
}

export default withHooksHOC(MiniframeLayout);