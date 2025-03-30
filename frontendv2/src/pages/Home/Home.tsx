/* eslint eqeqeq: "off", no-unused-vars: "off" */
import Squads from '../../components/Squads';
import { Grid } from '@mui/material';

export default function Home() {
    return (
        <Grid container flexDirection="column">
            <Grid>
                <Squads />
            </Grid>
        </Grid>
    );
}