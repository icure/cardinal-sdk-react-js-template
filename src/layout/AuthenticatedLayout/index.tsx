import React, { useEffect } from 'react'
import { Outlet, useNavigate } from 'react-router-dom'

import { useAppSelector } from '../../core/hooks'
import { routes } from '../../navigation/Router'
import { createSelector } from '@reduxjs/toolkit'
import { CardinalApiState } from '../../core/services/auth.api'
import RecoveryKeyPrompt from '../../components/authentication/RecoveryKeyPrompt'
import NewRecoveryKeyBanner from '../../components/authentication/NewRecoveryKeyBanner'

const reduxSelector = createSelector(
  (state: { cardinalApi: CardinalApiState }) => state.cardinalApi,
  (cardinalApi: CardinalApiState) => ({
    online: cardinalApi.online,
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
      <NewRecoveryKeyBanner />
      <Outlet />
      <RecoveryKeyPrompt />
    </div>
  )
}

export default AuthenticatedLayout
