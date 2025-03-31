/* eslint eqeqeq: "off", no-unused-vars: "off" */
import { Typography, Card, CardContent } from '@mui/material';
import { convertUpper } from '../../utils/functions';

export default function ChatChannel({ squad, onClick }: { squad: { squad_string: string }, onClick: () => void }) {
  return (
    <Card elevation={3} onClick={onClick} sx={{ backgroundColor: 'primary.dark', ':hover': { cursor: 'pointer', backgroundColor: 'primary.light' } }}>
      <CardContent>
        <Typography variant='h5'>{convertUpper(squad.squad_string)}</Typography>
        <Typography style={{ fontSize: '16px' }}></Typography>
      </CardContent>
    </Card>
  );
};