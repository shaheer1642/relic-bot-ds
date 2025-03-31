import { ReactNode, useState } from 'react';
import { AuthContext } from '../contexts/AuthContext';
import { IAuthUser } from '../interfaces/IAuthUser';
// import { getCookie, putCookie } from '../cookie_handler'; TODO: rewrite to localStorage
// import eventHandler from '../event_handler/eventHandler'; TODO: implment app context

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<IAuthUser | null>(null);

    const login = (callback: () => void) => {
        console.log('[useAuth.login] login called')
        // if (!getCookie('login_token')) return console.log('login_token not found') TODO: rewrite to localStorage
        // TODO: original call: `${process.env.VITE_SERVER_URL}api/allsquads/authorization/authenticate?login_token=${getCookie('login_token')}`
        fetch(`${process.env.VITE_SERVER_URL}api/allsquads/authorization/authenticate`, { credentials: 'include' })
            .then((res) => res.json())
            .then((res) => {
                if (res.code == 200) {
                    // TODO: original code
                    // setUser(res.data, () => {
                    //     eventHandler.emit('user/login')
                    //     if (callback) callback()
                    // })
                    setUser(res.data)

                    console.log('[useAuth.login] logged in')
                } else {
                    console.log('[useAuth.login] error', res)
                    if (callback) callback()
                }
            }).catch(console.error);
    };

    const logout = (callback: () => void) => {
        console.log('[useAuth.logout] called')
        // TODO: original code
        // setUser(null, () => {
        //     eventHandler.emit('user/logout')
        //     if (callback) callback()
        //     putCookie('login_token', '')
        // })
        setUser(null)
    };

    return (
        <AuthContext.Provider value={{ user, login, logout }}>
            {children}
        </AuthContext.Provider>
    );

};