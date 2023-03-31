import React, { useEffect } from 'react'
import { Outlet, useLocation, useNavigate } from 'react-router-dom'
import { useAppSelector } from '../../app/hooks';
import { AuthenticatedNavigation } from '../../component/AuthenticatedNavigation';
import { Navigation } from '../../component/Navigation'
import { routes } from '../../navigation/Router';

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
        <AuthenticatedNavigation/>
        <Outlet/>
    </div>
  )
}

export default AuthenticatedLayout