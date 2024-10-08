import React, { useEffect } from 'react'
import { Outlet, useNavigate } from 'react-router-dom'

import { useAppSelector } from '../../core/hooks'
import { routes } from '../../navigation/Router'
import { createSelector } from '@reduxjs/toolkit'
import { CardinalApiState } from '../../core/services/auth.api'

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
      <Outlet />
    </div>
  )
}

export default AuthenticatedLayout
