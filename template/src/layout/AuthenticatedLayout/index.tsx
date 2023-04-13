import { useEffect } from 'react'
import { Outlet, useNavigate } from 'react-router-dom'
import { useAppSelector } from '../../app/hooks';
import { AuthenticatedNavigation } from '../../components/AuthenticatedNavigation';
import { routes } from '../../navigation/Router';
import logo from '../../logo.svg';

function AuthenticatedLayout() {

    const navigate = useNavigate()

    const { online } = useAppSelector(state => ({
        ...state.auth,
    }));

    useEffect(() => {
        if(!online) {
            navigate(routes.login)
        }
    }, [online])

  return (
    <div>
        <a href="https://docs.icure.com" target="_blank">
          <img src={logo} className="logo" alt="iCure logo" />
        </a>
        <Outlet/>
        <AuthenticatedNavigation/>
    </div>
  )
}

export default AuthenticatedLayout