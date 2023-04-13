import { useState } from 'react'
import { useAppDispatch } from '../../app/hooks'
import SignupForm from '../../components/SignupForm'
import { completeAuthentication, setRegistrationInformation, setToken, startAuthentication } from '../../services/auth.api'
import FriendlyCaptcha from '../../components/FriendlyCaptcha'

export default function RegisterPage() {
  const dispatch = useAppDispatch()
  const [captchaToken, setCaptchaToken] = useState<string | undefined>(undefined)

  const doneCallback = (solution: string) => {
    setCaptchaToken(solution)
  }

  const handleSubmitSignup = (firstName: string, lastName: string, email: string) => {
    dispatch(setRegistrationInformation({ email: email, firstName: firstName, lastName: lastName }))
    if (!!captchaToken) {
      dispatch(startAuthentication({ captchaToken: captchaToken }))
    }
  }

  const handleSubmitValidation = (_email: string, validationCode: string) => {
    dispatch(setToken({ token: validationCode }))
    dispatch(completeAuthentication())
  }

  return (
    <>
      <h1>Register</h1>
      <SignupForm
        callback={handleSubmitSignup}
        validationCallback={handleSubmitValidation} />
      <FriendlyCaptcha successCallback={doneCallback} />
    </>
  )
}
