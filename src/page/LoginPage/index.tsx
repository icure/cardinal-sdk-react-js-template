import React from 'react'
import { useAppDispatch } from '../../app/hooks'
import LoginForm from '../../component/LoginForm'
import { completeAuthentication, setEmail, setToken, startAuthentication } from '../../services/auth.api'

export default function LoginPage() {

  const dispatch = useAppDispatch()

  const handleSubmitLogin = (email: string) => {
    dispatch(setEmail({email: email}))
    dispatch(startAuthentication())
  }

  const handleSubmitValidation = (email: string, validationCode: string) => {
    dispatch(setToken({token: validationCode}))
    dispatch(completeAuthentication())
  }

  return (
    <>
      <h1>Login</h1>
      <LoginForm
        callback={handleSubmitLogin}
        validationCallback={handleSubmitValidation} />
    </>
  )
}

