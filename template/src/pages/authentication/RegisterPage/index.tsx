import React, { useEffect, useState } from 'react'
import { useAppDispatch, useAppSelector } from '../../../core/hooks'
import SignupForm from '../../../components/authentication/SignupForm'
import { completeAuthentication, EHRLiteApiState, setRegistrationInformation, setToken, setWaitingForToken, startAuthentication } from '../../../core/services/auth.api'
import logo from '../../../assets/logo_horizontal.svg'
import '../index.css'
import { createSelector } from '@reduxjs/toolkit'

const reduxSelector = createSelector(
  (state: { ehrLiteApi: EHRLiteApiState }) => state.ehrLiteApi,
  (ehrLiteApi: EHRLiteApiState) => ({
    waitingForToken: ehrLiteApi.waitingForToken,
    loginProcessStarted: ehrLiteApi.loginProcessStarted,
  }),
)
export default function RegisterPage() {
  const dispatch = useAppDispatch()
  const { waitingForToken, loginProcessStarted } = useAppSelector(reduxSelector)

  const startAuthenticationProcessWithEmailAndCaptchaToken = (firstName: string, lastName: string, email: string, captchaToken: string) => {
    dispatch(setRegistrationInformation({ email: email, firstName: firstName, lastName: lastName }))
    dispatch(startAuthentication({ captchaToken: captchaToken }))
  }

  const completeAuthenticationProcessWithEmailAndValidationCode = (_email: string, validationCode: string) => {
    dispatch(setToken({ token: validationCode }))
    dispatch(completeAuthentication())
  }

  useEffect(() => {
    return () => {
      dispatch(setWaitingForToken(false))
    }
  }, [])

  return (
    <div className="auth-page">
      <div className="auth-page__logo">
        <img src={logo} alt="petra-care logo" />
      </div>
      <SignupForm
        state={loginProcessStarted ? 'loading' : waitingForToken ? 'waitingForToken' : 'initialised'}
        submitEmailForTokenRequest={(firstName: string, lastName: string, email: string, captchaToken: string) =>
          startAuthenticationProcessWithEmailAndCaptchaToken(firstName, lastName, email, captchaToken)
        }
        submitEmailAndValidationTokenForAuthentication={(_email: string, validationCode: string) => completeAuthenticationProcessWithEmailAndValidationCode(_email, validationCode)}
      />
    </div>
  )
}
