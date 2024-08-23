import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'
import { Practitioner } from '@icure/ehr-lite-sdk'
import { guard, ehrLiteApi } from '../services/auth.api'

export const practitionerApiRtk = createApi({
  reducerPath: 'practitionerApi',
  tagTypes: ['Practitioner'],
  baseQuery: fetchBaseQuery({
    baseUrl: '',
  }),
  endpoints: (builder) => ({
    getPractitioner: builder.query<Practitioner | undefined, string>({
      async queryFn(id, { getState }) {
        const practitionerApi = (await ehrLiteApi(getState))?.practitionerApi
        return guard([practitionerApi], async (): Promise<Practitioner> => {
          const practitioner = await practitionerApi?.get(id)
          if (!practitioner) {
            throw new Error('Practitioner does not exist')
          }
          return new Practitioner(practitioner)
        })
      },
      providesTags: (res) => (res ? [{ type: 'Practitioner', id: res.id }] : []),
    }),
  }),
})

export const { useGetPractitionerQuery } = practitionerApiRtk
