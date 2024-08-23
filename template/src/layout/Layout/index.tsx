import React, { useEffect } from 'react'
import { Outlet, useNavigate } from 'react-router-dom'
import { useAppDispatch, useAppSelector } from '../../core/hooks'
import { routes } from '../../navigation/Router'
import { EHRLiteApiState, login, setEmail, setToken } from '../../core/services/auth.api'
import { createSelector } from '@reduxjs/toolkit'
import { AppState } from '../../core/app'

const selectRestApiData = (state: { ehrLiteApi: EHRLiteApiState }) => state.ehrLiteApi
const selectAppData = (state: { app: AppState }) => state.app

const combinedSelector = createSelector([selectRestApiData, selectAppData], (ehrLiteApi: EHRLiteApiState, app: AppState) => ({
  online: ehrLiteApi.online,
  lsUsername: app?.savedCredentials?.login,
  lsToken: app?.savedCredentials?.token,
}))

function Layout() {
  const navigate = useNavigate()
  const dispatch = useAppDispatch()

  const { online, lsUsername, lsToken } = useAppSelector(combinedSelector)

  useEffect(() => {
    if (!!lsUsername && !!lsToken && !!dispatch) {
      console.log(lsUsername)
      dispatch(setEmail({ email: lsUsername }))
      dispatch(setToken({ token: lsToken }))
      dispatch(login())
    }
  }, [navigate, lsUsername, lsToken, dispatch])

  useEffect(() => {
    if (online) {
      navigate(routes.home)
    }
  }, [online])

  return (
    <div>
      <Outlet />
    </div>
  )
}

export default Layout
