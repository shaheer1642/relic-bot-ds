import { ReactNode, useState } from 'react';
import { AuthContext } from '../contexts/AuthContext';
import { IAuthUser } from '../interfaces/IAuthUser';
// import eventHandler from '../event_handler/eventHandler'; TODO: implment app context

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<IAuthUser | null>(null);

    const login = (callback?: () => void) => {
        console.log('[useAuth.login] login called')
        const login_token = localStorage.getItem('login_token')
        if (!login_token) return console.log('login_token not found')
        fetch(`${process.env.VITE_SERVER_URL}api/allsquads/authorization/authenticate?login_token=${login_token}`, { credentials: 'include' })
            .then((res) => res.json())
            .then((res) => {
                if (res.code == 200) {
                    // TODO: implement app context
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

    const logout = (callback?: () => void) => {
        console.log('[useAuth.logout] called')
        localStorage.removeItem('login_token')
        // TODO: implement app context
        // setUser(null, () => {
        //     eventHandler.emit('user/logout')
        //     if (callback) callback()
        // })
        setUser(null)
    };

    return (
        <AuthContext.Provider value={{ user, login, logout }}>
            {children}
        </AuthContext.Provider>
    );

};