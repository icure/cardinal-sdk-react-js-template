import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { Input, Button, Form, Checkbox } from 'antd'

import { routes } from '../../../navigation/Router'
import FriendlyCaptcha from '../FriendlyCaptcha'
import { SpinLoader } from '../../SpinLoader'

interface SignupFormProps {
  state: 'initialised' | 'loading' | 'waitingForToken'
  submitEmailForTokenRequest: (firstName: string, lastName: string, email: string, captchaToken: string) => void
  submitEmailAndValidationTokenForAuthentication: (email: string, validationCode: string) => void
}

const SignupForm: React.FC<SignupFormProps> = ({ state, submitEmailForTokenRequest, submitEmailAndValidationTokenForAuthentication }) => {
  const [captchaToken, setCaptchaToken] = useState<string | undefined>(undefined)

  const doneCallback = (solution: string) => {
    setCaptchaToken(solution)
  }

  const handleSubmit = (values: { firstName: string; lastName: string; email: string; validationCode: string }) => {
    const { firstName, lastName, email, validationCode } = values
    if (state === 'waitingForToken') {
      if (validationCode.length === 0) {
        return
      }
      submitEmailAndValidationTokenForAuthentication(email, validationCode)
    } else {
      if (!captchaToken) {
        return
      }

      submitEmailForTokenRequest(firstName, lastName, email, captchaToken)
    }
  }

  return (
    <>
      {state === 'loading' && <SpinLoader />}
      <Form onFinish={(values) => handleSubmit(values)} className="auth-form" layout="vertical">
        <div className="auth-form__title">
          <h2>Registration</h2>
        </div>
        <div className="auth-form__inputs">
          <Form.Item name="firstName" label="First Name" rules={[{ required: true, message: 'First Name is required' }]}>
            <Input placeholder="First Name" size="large" style={{ fontSize: 13 }} />
          </Form.Item>
          <Form.Item name="lastName" label="Last Name" rules={[{ required: true, message: 'Last Name is required' }]}>
            <Input placeholder="Last Name" size="large" style={{ fontSize: 13 }} />
          </Form.Item>
          <Form.Item name="email" label="Email" rules={[{ required: true, message: 'Email is required' }]}>
            <Input placeholder="Email" size="large" style={{ fontSize: 13 }} />
          </Form.Item>
          {state === 'waitingForToken' && (
            <Form.Item name="validationCode" label="Validation Code" rules={[{ required: true, message: 'Validation Code is required' }]}>
              <Input placeholder="Validation Code" size="large" style={{ fontSize: 13 }} />
            </Form.Item>
          )}
        </div>
        <Form.Item
          name="termsOfUse"
          valuePropName="checked"
          key="termsOfUse"
          className="w-100 checkbox-item"
          rules={[
            {
              required: true,
              validator: (_, value) => (value ? Promise.resolve() : Promise.reject(new Error('Before registering, please read and accept our terms of use and privacy policy'))),
            },
          ]}
        >
          <Checkbox>
            <div className="auth-form__textHelper">
              <p>
                I have read and agree with{' '}
                <Link className="link" to="#">
                  Terms of use
                </Link>{' '}
                &{' '}
                <Link className="link" to="#">
                  Privacy Policy
                </Link>
              </p>
            </div>
          </Checkbox>
        </Form.Item>
        <Button type="primary" size="large" htmlType="submit" disabled={(state === 'initialised' && !captchaToken) || state === 'loading'}>
          {state === 'waitingForToken' ? 'Register' : 'Receive a one time code'}
        </Button>
        <div className="auth-form__textHelper">
          <p>
            Already have an account?{' '}
            <Link className="link" to={routes.login}>
              Log in
            </Link>
          </p>
        </div>
        <FriendlyCaptcha successCallback={doneCallback} />
      </Form>
    </>
  )
}

export default SignupForm
