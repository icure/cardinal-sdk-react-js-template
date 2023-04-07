import { useState } from 'react'
import { useAppDispatch } from '../../app/hooks'
import SignupForm from '../../component/SignupForm'
import { completeAuthentication, setRegistrationInformation, setToken, startAuthentication } from '../../services/auth.api'
import FriendlyCaptcha from '../../component/FriendlyCaptcha'

export default function RegisterPage() {
  const dispatch = useAppDispatch()
  const [recaptchaToken, setRecaptchaToken] = useState<string | undefined>(undefined)

  const doneCallback = (solution: string) => {
    setRecaptchaToken(solution)
  }

  const handleSubmitSignup = (firstName: string, lastName: string, email: string) => {
    dispatch(setRegistrationInformation({ email: email, firstName: firstName, lastName: lastName }))
    if (!!recaptchaToken) {
      dispatch(startAuthentication({ recaptchaToken: recaptchaToken }))
    }
  }

  const handleSubmitValidation = (email: string, validationCode: string) => {
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
