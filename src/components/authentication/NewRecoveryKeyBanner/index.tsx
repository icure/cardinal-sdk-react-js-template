import React from 'react'
import { Alert, Button, Space, Typography } from 'antd'

import { useAppDispatch, useAppSelector } from '../../../core/hooks'
import { CardinalApiState, setNewlyCreatedRecoveryKey } from '../../../core/services/auth.api'

const { Text } = Typography

const NewRecoveryKeyBanner: React.FC = () => {
  const dispatch = useAppDispatch()
  const recoveryKey = useAppSelector((s: { cardinalApi: CardinalApiState }) => s.cardinalApi.newlyCreatedRecoveryKey)

  if (!recoveryKey) {
    return null
  }

  const handleCopy = () => {
    navigator.clipboard?.writeText(recoveryKey).catch((e) => console.warn('Could not copy recovery key', e))
  }

  const handleDismiss = () => {
    dispatch(setNewlyCreatedRecoveryKey({ recoveryKey: undefined }))
  }

  return (
    <Alert
      type="warning"
      showIcon
      style={{ margin: 16 }}
      message="Save your recovery key"
      description={
        <Space direction="vertical" style={{ width: '100%' }}>
          <Text>
            We just created an encryption key for your account. Store this recovery key somewhere safe — without it you will not be able to access your encrypted data from another
            device.
          </Text>
          <Text code copyable={{ text: recoveryKey }} style={{ fontSize: 14 }}>
            {recoveryKey}
          </Text>
          <Space>
            <Button onClick={handleCopy}>Copy</Button>
            <Button type="primary" onClick={handleDismiss}>
              I&apos;ve saved it
            </Button>
          </Space>
        </Space>
      }
    />
  )
}

export default NewRecoveryKeyBanner
