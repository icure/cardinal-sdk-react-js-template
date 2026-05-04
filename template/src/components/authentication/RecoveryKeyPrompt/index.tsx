import React, { useState } from 'react'
import { Button, Input, Modal, Space, Typography } from 'antd'

import { useAppDispatch, useAppSelector } from '../../../core/hooks'
import { CardinalApiState, clearRecoveryKeyRequest, setRecoveryKeys } from '../../../core/services/auth.api'

const { Paragraph } = Typography

const RecoveryKeyPrompt: React.FC = () => {
  const dispatch = useAppDispatch()
  const recoveryKeyRequest = useAppSelector((s: { cardinalApi: CardinalApiState }) => s.cardinalApi.recoveryKeyRequest)
  const [value, setValue] = useState('')

  const open = !!recoveryKeyRequest

  const handleSubmit = () => {
    const keys = value
      .split(/\r?\n/)
      .map((k) => k.trim())
      .filter((k) => k.length > 0)
    if (keys.length === 0) {
      return
    }
    setValue('')
    dispatch(setRecoveryKeys({ recoveryKeys: keys }))
  }

  const handleSkip = () => {
    setValue('')
    dispatch(clearRecoveryKeyRequest())
  }

  return (
    <Modal
      open={open}
      title="Recover your encryption keys"
      onCancel={handleSkip}
      footer={[
        <Button key="skip" onClick={handleSkip}>
          Skip
        </Button>,
        <Button key="submit" type="primary" onClick={handleSubmit} disabled={value.trim().length === 0}>
          Recover
        </Button>,
      ]}
    >
      <Space direction="vertical" style={{ width: '100%' }}>
        <Paragraph>
          We could not find some of your encryption keys on this device. Paste the recovery key you saved when you first signed up to restore access to your encrypted data. You can
          paste several keys, one per line. Skip if you don&apos;t have one — you will still be logged in but cannot decrypt previously stored data.
        </Paragraph>
        <Input.TextArea rows={4} value={value} onChange={(e) => setValue(e.target.value)} placeholder="xxxx-xxxx-xxxx-xxxx-..." autoFocus />
      </Space>
    </Modal>
  )
}

export default RecoveryKeyPrompt
