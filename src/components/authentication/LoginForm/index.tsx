import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { Input, Button, Form } from 'antd'
import { Solution } from '@icure/cardinal-sdk'

import { routes } from '../../../navigation/Router'
import KerberusCaptcha from '../KerberusCaptcha'

import '../index.less'
import { SpinLoader } from '../../SpinLoader'

interface LoginFormProps {
  state: 'initialised' | 'loading' | 'waitingForToken'
  submitEmailForTokenRequest: (email: string, captchaSolution: Solution) => void
  submitEmailAndValidationTokenForAuthentication: (email: string, validationCode: string) => void
}

const LoginForm: React.FC<LoginFormProps> = ({ state, submitEmailForTokenRequest, submitEmailAndValidationTokenForAuthentication }) => {
  const [captchaSolution, setCaptchaSolution] = useState<Solution | undefined>(undefined)

  /**
   * Called whenever the login form is submitted. Depending on the SDK state we either
   * trigger a one-time-code email or complete the authentication with the entered code.
   */
  const handleSubmit = (values: { email: string; validationCode: string }) => {
    const { email, validationCode } = values

    if (email.length === 0) {
      return
    }

    if (state === 'waitingForToken') {
      if (validationCode.length === 0) {
        return
      }
      submitEmailAndValidationTokenForAuthentication(email, validationCode)
    } else {
      if (!captchaSolution) {
        return
      }
      submitEmailForTokenRequest(email, captchaSolution)
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
        {state !== 'waitingForToken' && <KerberusCaptcha successCallback={setCaptchaSolution} />}
        <Button type="primary" size="large" htmlType="submit" disabled={(state === 'initialised' && !captchaSolution) || state === 'loading'}>
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
      </Form>
    </>
  )
}

export default LoginForm
