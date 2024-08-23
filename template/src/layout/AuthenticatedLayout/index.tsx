import React, { useEffect } from 'react'
import { Outlet, useNavigate } from 'react-router-dom'

import { useAppSelector } from '../../core/hooks'
import { routes } from '../../navigation/Router'
import { createSelector } from '@reduxjs/toolkit'
import { EHRLiteApiState } from '../../core/services/auth.api'

const reduxSelector = createSelector(
  (state: { ehrLiteApi: EHRLiteApiState }) => state.ehrLiteApi,
  (ehrLiteApi: EHRLiteApiState) => ({
    online: ehrLiteApi.online,
  }),
)
function AuthenticatedLayout() {
  const navigate = useNavigate()

  const { online } = useAppSelector(reduxSelector)

  useEffect(() => {
    if (!online) {
      navigate(routes.login)
    }
  }, [online])

  return (
    <div>
      <Outlet />
    </div>
  )
}

export default AuthenticatedLayout
