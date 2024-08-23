import React, { useMemo, useState } from 'react'
import type { MenuProps } from 'antd'
import { Dropdown } from 'antd'
import Icon from '@ant-design/icons'
import { createSelector } from '@reduxjs/toolkit'
import { Practitioner } from '@icure/ehr-lite-sdk'

import './index.css'
import logo_horizontal from '../../assets/logo_horizontal.svg'
import { arrowDownIcn, logOutIcn, userIcn } from '../../assets/CustomIcons'
import { useAppDispatch, useAppSelector } from '../../core/hooks'
import { EHRLiteApiState, logout } from '../../core/services/auth.api'
import { useGetPractitionerQuery } from '../../core/api/practitionerApi'

const reduxSelector = createSelector(
  (state: { ehrLiteApi: EHRLiteApiState }) => state.ehrLiteApi,
  (ehrLiteApi: EHRLiteApiState) => ({
    healthcarePartyId: ehrLiteApi.user?.healthcarePartyId,
  }),
)
export const Header = () => {
  const [isUserDropdownOpen, setUserDropdownOpen] = useState(false)
  const dispatch = useAppDispatch()

  const { healthcarePartyId } = useAppSelector(reduxSelector)
  const { data: practitioner, error: getPractitionerError, isFetching: isPractitionarFetching } = useGetPractitionerQuery(healthcarePartyId ?? '', { skip: !healthcarePartyId })

  const practitionerFromJSON = useMemo(() => {
    if (!!practitioner) {
      return new Practitioner(practitioner)
    }
    return undefined
  }, [practitioner])

  const handleLogout = () => {
    dispatch(logout())
  }

  const items: MenuProps['items'] = [
    {
      key: 'logout',
      danger: true,
      label: (
        <div className="header__userDrowdown__item">
          <Icon component={logOutIcn} />
          <span>Log out</span>
        </div>
      ),
    },
  ]
  const onClick: MenuProps['onClick'] = ({ key }) => {
    switch (key) {
      case 'logout': {
        handleLogout()
        break
      }
    }
  }

  return (
    <div className="header">
      <div className="header__logoHolder">
        <img src={logo_horizontal} alt="petraCare logo" />
      </div>
      {!isPractitionarFetching && (
        <Dropdown menu={{ items, onClick }} placement="bottomRight" arrow onOpenChange={(open: boolean) => setUserDropdownOpen(open)}>
          <div className={`header__userDrowdown ${isUserDropdownOpen && 'header__userDrowdown--active'}`}>
            <div className="header__userDrowdown__heading">
              <p className="header__userDrowdown__heading__name">{practitionerFromJSON?.firstName + ' ' + practitionerFromJSON?.lastName}</p>
            </div>

            <div className="header__userDrowdown__userAvatarPlaceholder">
              <Icon component={userIcn} />
            </div>

            <div className="header__userDrowdown__arrow">
              <Icon component={arrowDownIcn} />
            </div>
          </div>
        </Dropdown>
      )}
    </div>
  )
}
