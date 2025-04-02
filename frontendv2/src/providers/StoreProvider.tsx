import { ReactNode, useEffect, useState } from 'react';
import { StoreContext } from '../contexts/StoreContext';
import { IUser } from '../interfaces/IUser';
import { socket, socketHasConnected } from '../socket';
import { ISocketResponse } from '../interfaces/ISocketResponse';

export const StoreProvider = ({ children }: { children: ReactNode }) => {
    const [usersList, setUsersList] = useState<Record<string, IUser>>({});

    useEffect(() => {
        socketHasConnected().then(() => {
            console.log('socket connected, emitting users list')
            socket.emit('allsquads/users/fetch', {}, (res: ISocketResponse) => {
                if (res.code == 200) {
                    res.data.forEach((row: IUser) => {
                        usersList[row.user_id] = row
                    })
                    // eventHandler.emit('usersList/loaded') TODO: implement app context
                }
            })
            socket.on('allsquads/users/update', updateUsersList)
        }).catch(console.error)

        return () => {
            socket.off('allsquads/users/update', updateUsersList)
        }
    }, []);

    const updateUsersList = (data: IUser) => {
        if (!data.user_id || typeof data.user_id !== 'string')
            return console.warn('[StoreProvider.updateUsersList] user_id is not a string')

        setUsersList(usersList => {
            usersList[data.user_id] = data
            return usersList
        })
    }

    return (
        <StoreContext.Provider value={{ usersList }}>
            {children}
        </StoreContext.Provider>
    );

};