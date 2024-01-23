import { useContext, useEffect, useState } from 'react';
import { getCookie, putCookie } from '../cookie_handler';
import eventHandler from '../event_handler/eventHandler';
import { AuthContext } from '../context/AuthContext';

export const useAuth = () => {
    const { setUser } = useContext(AuthContext);

    const login = (callback) => {
        console.log('[useAuth.login] login called')
        if (!getCookie('login_token')) return console.log('login_token not found')
        fetch(`${process.env.REACT_APP_SOCKET_URL}api/allsquads/authorization/authenticate?login_token=${getCookie('login_token')}`, { credentials: 'include' })
        .then((res) => res.json())
        .then((res) => {
            if (res.code == 200) {
                setUser(res.data, () => {
                    eventHandler.emit('user/login')
                    if (callback) callback()
                })
                console.log('[useAuth.login] logged in')
            } else {
                console.log('[useAuth.login] error', res)
                if (callback) callback()
            }
        }).catch(console.error);
    };

    const logout = (callback) => {
        console.log('[useAuth.logout] called')
        setUser(null, () => {
            eventHandler.emit('user/logout')
            if (callback) callback()
            putCookie('login_token','')
        })
    };

    return { login, logout };
};