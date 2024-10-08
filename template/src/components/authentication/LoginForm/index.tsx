import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { Input, Button, Form } from 'antd'

import { routes } from '../../../navigation/Router'
import FriendlyCaptcha from '../FriendlyCaptcha'

import '../index.css'
import { SpinLoader } from '../../SpinLoader'

interface LoginFormProps {
  state: 'initialised' | 'loading' | 'waitingForToken'
  submitEmailForTokenRequest: (email: string, captchaToken: string) => void
  submitEmailAndValidationTokenForAuthentication: (email: string, validationCode: string) => void
}

const LoginForm: React.FC<LoginFormProps> = ({ state, submitEmailForTokenRequest, submitEmailAndValidationTokenForAuthentication }) => {
  const [captchaToken, setCaptchaToken] = useState<string | undefined>(undefined)

  const doneCallback = (solution: string) => {
    setCaptchaToken(solution)
  }

  /**
   * This function is called each time we press on the submit button of the login form
   * Depending on the state of the api, it will either set the email to let redux start
   * the authentication ot try to log you in using the email and token
   *
   * @param values
   */
  const handleSubmit = (values: { email: string; validationCode: string }) => {
    const { email, validationCode } = values

    /** Some error management should be done here ? */
    if (email.length === 0) {
      return
    }

    if (state === 'waitingForToken') {
      /** Some error management should be done here ? */
      if (validationCode.length === 0) {
        return
      }
      submitEmailAndValidationTokenForAuthentication(email, validationCode)
    } else {
      if (!captchaToken) {
        return
      }
      submitEmailForTokenRequest(email, captchaToken)
    }
  }

  return (
    <>
      {state === 'loading' && <SpinLoader />}
      <Form onFinish={(values) => handleSubmit(values)} className="auth-form" layout="vertical">
        <div className="auth-form__title">
          <h2>Login</h2>
        </div>
        <div className="auth-form__inputs">
          <Form.Item name="email" label="Email" rules={[{ required: true, message: 'Email is required' }]}>
            <Input placeholder="Email" size="large" style={{ fontSize: 13 }} />
          </Form.Item>

          {state === 'waitingForToken' && (
            <Form.Item name="validationCode" label="Validation Code" rules={[{ required: true, message: 'Validation code is required' }]}>
              <Input placeholder="Validation Code" size="large" style={{ fontSize: 13 }} />
            </Form.Item>
          )}
        </div>
        <Button type="primary" size="large" htmlType="submit" disabled={(state === 'initialised' && !captchaToken) || state === 'loading'}>
          {state === 'waitingForToken' ? 'Log in' : 'Receive a one time code'}
        </Button>
        <div className="auth-form__textHelper">
          <p>
            Not registered yet?{' '}
            <Link className="link" to={routes.register}>
              Create an account
            </Link>
          </p>
        </div>

        <FriendlyCaptcha successCallback={doneCallback} />
      </Form>
    </>
  )
}

export default LoginForm
