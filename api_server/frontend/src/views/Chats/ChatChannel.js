/* eslint eqeqeq: "off", no-unused-vars: "off" */
import React from 'react';
import {Typography, Card, CardContent} from '@mui/material';
import { convertUpper } from '../../functions';
import { withHooksHOC } from '../../withHooksHOC';

class ChatChannel extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
    }
  }

  componentDidMount() {
  }

  componentWillUnmount() {
  }

  componentDidUpdate() {
  }

  render() {
    return (
      <Card elevation={3} onClick={this.props.onClick} sx={{backgroundColor: 'primary.dark',':hover':{cursor: 'pointer', backgroundColor: 'primary.light'}}}>
        <CardContent>
          <Typography variant='h5'>{convertUpper(this.props.squad.squad_string)}</Typography>
          <Typography style={{fontSize: '16px'}}></Typography>
        </CardContent>
      </Card>
    );
  }
}

export default withHooksHOC(ChatChannel);