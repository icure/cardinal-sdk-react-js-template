import { useEffect } from 'react'
import { Outlet, useNavigate } from 'react-router-dom'
import { useAppDispatch, useAppSelector } from '../../app/hooks';
import { routes } from '../../navigation/Router';
import { login, setEmail, setToken } from '../../services/auth.api';
import logo from '/logo.svg';

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
        <a href="https://docs.icure.com" target="_blank">
          <img src={logo} className="logo" alt="iCure logo" />
        </a>
        <Outlet/>
    </div>
  )
}

export default Layout