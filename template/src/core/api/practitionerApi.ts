import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'
import { cardinalApi, guard } from '../services/auth.api'
import { HealthcareParty } from '@icure/cardinal-sdk'

export const practitionerApiRtk = createApi({
  reducerPath: 'practitionerApi',
  tagTypes: ['Practitioner'],
  baseQuery: fetchBaseQuery({
    baseUrl: '',
  }),
  endpoints: (builder) => ({
    getPractitioner: builder.query<HealthcareParty | undefined, string>({
      async queryFn(id, { getState }) {
        const practitionerApi = (await cardinalApi(getState))?.healthcareParty
        return guard([practitionerApi], async (): Promise<HealthcareParty> => {
          const practitioner = await practitionerApi?.getHealthcareParty(id)
          if (!practitioner) {
            throw new Error('Practitioner does not exist')
          }
          return practitioner
        })
      },
      providesTags: (res) => (res ? [{ type: 'Practitioner', id: res.id }] : []),
    }),
  }),
})

export const { useGetPractitionerQuery } = practitionerApiRtk
