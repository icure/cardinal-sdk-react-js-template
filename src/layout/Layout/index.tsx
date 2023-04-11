import React, { useEffect } from 'react'
import { Outlet, useNavigate } from 'react-router-dom'
import { useAppDispatch, useAppSelector } from '../../app/hooks';
import { Navigation } from '../../components/Navigation'
import { routes } from '../../navigation/Router';
import { login, setEmail, setToken } from '../../services/auth.api';

function Layout() {

  const navigate = useNavigate()
  const dispatch = useAppDispatch();

  const { online, lsUsername, lsToken } = useAppSelector(state => ({
      ...state.auth,
      lsUsername: state.app?.savedCredentials?.login,
      lsToken: state.app?.savedCredentials?.token,
  }));

  useEffect(() => {
     if (!!lsUsername && !!lsToken && !!dispatch) {
      dispatch(setEmail({email: lsUsername}));
      dispatch(setToken({token: lsToken}));
      dispatch(login());
    }
  }, [navigate, lsUsername, lsToken, dispatch]);

  useEffect(() => {
      if(online) {
          navigate(routes.home)
      }
  }, [online])

  return (
    <div>
        <Navigation/>
        <Outlet/>
    </div>
  )
}

export default Layout