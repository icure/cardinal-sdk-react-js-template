import { useState } from 'react'
import { useAppDispatch } from '../../app/hooks'
import LoginForm from '../../components/LoginForm'
import { completeAuthentication, setEmail, setToken, startAuthentication } from '../../services/auth.api'
import FriendlyCaptcha from '../../components/FriendlyCaptcha'

export default function LoginPage() {
  const dispatch = useAppDispatch()
  const [captchaToken, setCaptchaToken] = useState<string|undefined>(undefined)

  const doneCallback = (solution: string) => {
    setCaptchaToken(solution)
  }

  const handleSubmitLogin = (email: string) => {
    dispatch(setEmail({email: email}))
    if (!!captchaToken) {
      dispatch(startAuthentication({captchaToken: captchaToken}))
    }
  }

  const handleSubmitValidation = (_email: string, validationCode: string) => {
    dispatch(setToken({token: validationCode}))
    dispatch(completeAuthentication())
  }

  return (
    <>
      <h1>Login</h1>
      <LoginForm
        callback={handleSubmitLogin}
        validationCallback={handleSubmitValidation} />
      <FriendlyCaptcha successCallback={doneCallback} />
    </>
  )
}

