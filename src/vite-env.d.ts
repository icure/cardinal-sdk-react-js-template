/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_APPLICATION_ID: string
  readonly VITE_EXTERNAL_SERVICES_SPEC_ID: string
  readonly VITE_EMAIL_AUTHENTICATION_PROCESS_ID: string
  readonly VITE_SMS_AUTHENTICATION_PROCESS_ID?: string
  readonly VITE_PARENT_ORGANISATION_ID: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
