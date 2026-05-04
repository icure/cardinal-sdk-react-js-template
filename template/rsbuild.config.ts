import { defineConfig } from '@rsbuild/core'
import { pluginReact } from '@rsbuild/plugin-react'
import { pluginLess } from '@rsbuild/plugin-less'

export default defineConfig({
  html: {
    template: './public/index.html',
  },
  plugins: [
    pluginReact(),
    pluginLess({
      lessLoaderOptions: {
        sourceMap: true,
        lessOptions: {
          javascriptEnabled: true,
        },
      },
    }),
  ],
  source: {
    define: {
      'process.env.REACT_APP_APPLICATION_ID': JSON.stringify(process.env.REACT_APP_APPLICATION_ID),
      'process.env.REACT_APP_EXTERNAL_SERVICES_SPEC_ID': JSON.stringify(process.env.REACT_APP_EXTERNAL_SERVICES_SPEC_ID),
      'process.env.REACT_APP_EMAIL_AUTHENTICATION_PROCESS_ID': JSON.stringify(process.env.REACT_APP_EMAIL_AUTHENTICATION_PROCESS_ID),
      'process.env.REACT_APP_SMS_AUTHENTICATION_PROCESS_ID': JSON.stringify(process.env.REACT_APP_SMS_AUTHENTICATION_PROCESS_ID),
      'process.env.REACT_APP_PARENT_ORGANISATION_ID': JSON.stringify(process.env.REACT_APP_PARENT_ORGANISATION_ID),
    },
    decorators: {
      version: 'legacy',
    },
  },
  output: {
    distPath: {
      root: 'build',
    },
    minify: {
      js: false,
    },
    sourceMap: {
      js: 'source-map',
    },
  },
})