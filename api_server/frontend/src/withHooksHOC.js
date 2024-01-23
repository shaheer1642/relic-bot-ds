import React from 'react';
import {useLocation, useNavigate, useParams, useSearchParams} from 'react-router-dom';
import { useAuth } from './hooks/useAuth';
import { AuthContext } from './context/AuthContext';

export const withHooksHOC = (Component) => {
  function ComponentwithHooksHOCProp(props) {
    let location = useLocation();
    let navigate = useNavigate();
    let params = useParams();
    const [searchParams, setSearchParams] = useSearchParams();
    const {login, logout} = useAuth()
    const { user } = React.useContext(AuthContext)


    return <Component {...props} {...{
      location, 
      navigate: navigate, 
      params: params,
      searchParams: searchParams, 
      setSearchParams: setSearchParams,
      login: login, 
      logout: logout, 
      user: user
    }} />;
  }

  return ComponentwithHooksHOCProp;
}

// export const withHooksHOC = (Component) => {

//   return (props) => {
//     console.log('withHooksHOC called')
//     let location = useLocation();
//     let navigate = useNavigate();
//     let params = useParams();
//     const {login, logout} = useAuth()
//     const { user } = React.useContext(AuthContext)

//     return <Component location={location} navigate={navigate} params={params} login={login} logout={logout} user={user} {...props} />;
//   };
// };