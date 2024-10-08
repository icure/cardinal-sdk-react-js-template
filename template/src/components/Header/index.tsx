import React, { useState } from 'react'
import type { MenuProps } from 'antd'
import { Dropdown } from 'antd'
import Icon from '@ant-design/icons'
import { createSelector } from '@reduxjs/toolkit'

import './index.css'
import logo_horizontal from '../../assets/logo_horizontal.svg'
import { arrowDownIcn, logOutIcn, userIcn } from '../../assets/CustomIcons'
import { useAppDispatch, useAppSelector } from '../../core/hooks'
import { CardinalApiState, logout } from '../../core/services/auth.api'
import { useGetPractitionerQuery } from '../../core/api/practitionerApi'

const reduxSelector = createSelector(
  (state: { cardinalApi: CardinalApiState }) => state.cardinalApi,
  (cardinalApi: CardinalApiState) => ({
    healthcarePartyId: cardinalApi.user?.healthcarePartyId,
  }),
)
export const Header = () => {
  const [isUserDropdownOpen, setUserDropdownOpen] = useState(false)
  const dispatch = useAppDispatch()

  const { healthcarePartyId } = useAppSelector(reduxSelector)
  const { data: practitioner, isFetching: isPractitionerFetching } = useGetPractitionerQuery(healthcarePartyId ?? '', { skip: !healthcarePartyId })

  const handleLogout = () => {
    dispatch(logout())
  }

  const items: MenuProps['items'] = [
    {
      key: 'logout',
      danger: true,
      label: (
        <div className="header__userDropdown__item">
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
        <img src={logo_horizontal} alt="cardinal logo" />
      </div>
      {!isPractitionerFetching && (
        <Dropdown menu={{ items, onClick }} placement="bottomRight" arrow onOpenChange={(open: boolean) => setUserDropdownOpen(open)}>
          <div className={`header__userDropdown ${isUserDropdownOpen && 'header__userDropdown--active'}`}>
            <div className="header__userDropdown__heading">
              <p className="header__userDropdown__heading__name">{practitioner?.firstName + ' ' + practitioner?.lastName}</p>
            </div>

            <div className="header__userDropdown__userAvatarPlaceholder">
              <Icon component={userIcn} />
            </div>

            <div className="header__userDropdown__arrow">
              <Icon component={arrowDownIcn} />
            </div>
          </div>
        </Dropdown>
      )}
    </div>
  )
}
