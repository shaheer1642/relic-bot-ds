import { useState, useEffect } from 'react';
import { fetchToken, messaging } from './firebase';
import { onMessage, MessagePayload } from "firebase/messaging";
import { Snackbar } from '@mui/material';

interface NotificationState {
  show: boolean;
  notification: {
    title: string;
    body: string;
  };
  isTokenFound: boolean;
}

export default function FirebaseNotifications() {
  const [state, setState] = useState<NotificationState>({
    show: false,
    notification: { title: '', body: '' },
    isTokenFound: false,
  });

  useEffect(() => {
    fetchToken((value: boolean) => setState(prev => ({ ...prev, isTokenFound: value })));

    const unsubscribe = onMessage(messaging, (payload: MessagePayload) => {
      console.log('[Firebase FCM] New notification; Payload:', payload);
      setState(prev => ({
        ...prev,
        notification: {
          title: payload.notification?.title || '',
          body: payload.notification?.body || ''
        },
        show: true
      }));
    });

    return () => unsubscribe();
  }, []);

  return (
    <Snackbar
      open={state.show}
      autoHideDuration={6000}
      onClose={() => setState(prev => ({ ...prev, show: false }))}
      message={JSON.stringify(state.notification)}
    />
  );
};