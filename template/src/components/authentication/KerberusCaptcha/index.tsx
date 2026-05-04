import React, { useEffect, useRef, useState } from 'react'
import { Progress } from 'antd'
import { Challenge, resolveChallenge, Solution } from '@icure/cardinal-sdk'

const MSG_GW_URL = 'https://msg-gw.icure.cloud'
const SPEC_ID = process.env.REACT_APP_EXTERNAL_SERVICES_SPEC_ID

type KerberusCaptchaProps = {
  successCallback: (solution: Solution) => void
  refreshCounter?: number
}

const KerberusCaptcha = ({ successCallback, refreshCounter = 0 }: KerberusCaptchaProps) => {
  const requestIdRef = useRef(0)
  const [progress, setProgress] = useState<number | undefined>(undefined)

  useEffect(() => {
    if (!SPEC_ID) {
      console.error('REACT_APP_EXTERNAL_SERVICES_SPEC_ID is not set; cannot resolve Kerberus challenge.')
      return
    }
    const requestId = ++requestIdRef.current
    let running = true

    fetch(`${MSG_GW_URL}/${SPEC_ID}/challenge`)
      .then((x) => x.json())
      .then((challenge: Challenge) => {
        if (!running) throw new Error('Cancelled Kerberus challenge')
        return resolveChallenge(challenge, SPEC_ID, undefined, (p) => {
          if (!running || requestId !== requestIdRef.current) return
          setProgress(p * 100)
        })
      })
      .then((solution) => {
        if (!running || requestId !== requestIdRef.current) return
        setProgress(undefined)
        successCallback(solution)
      })
      .catch((e) => {
        if (!running || requestId !== requestIdRef.current) return
        setProgress(undefined)
        console.warn('Kerberus challenge failed:', e)
      })

    return () => {
      running = false
    }
  }, [refreshCounter, successCallback])

  if (progress === undefined) {
    return null
  }
  return <Progress percent={Math.round(progress)} status="active" />
}

export default KerberusCaptcha
