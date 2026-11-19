import { baseApi } from "@/store/api"

type Status = "PENDING" | "APPROVED" | "REJECTED"
export type Vehicle = { id: string; type: string; make: string; model: string; plateNumber: string; seatCapacity: number; verificationStatus: Status; rejectionReason: string | null }
export type Licence = { id: string; licenseNumber: string; verificationStatus: Status; rejectionReason: string | null }
type ContactBody = { name: string; phone: string; email?: string; yourName?: string; isPrimary: boolean }
type VehicleBody = { type: string; make: string; model: string; plateNumber: string; seatCapacity: number; rcNumber: string; rcUploadId: string }

export const onboardingApi = baseApi.injectEndpoints({
  endpoints: (b) => ({
    addContact: b.mutation<{ id: string }, ContactBody>({ query: (body) => ({ url: "/emergency-contact", method: "post", body }), invalidatesTags: ["Me"] }),
    listVehicles: b.query<Vehicle[], void>({ query: () => ({ url: "/vehicles" }), providesTags: ["Vehicle"] }),
    addVehicle: b.mutation<Vehicle, VehicleBody>({ query: (body) => ({ url: "/vehicles", method: "post", body }), invalidatesTags: ["Vehicle"] }),
    listLicences: b.query<Licence[], void>({ query: () => ({ url: "/documents" }), providesTags: ["Licence"] }),
    submitLicence: b.mutation<Licence, { licenseNumber: string; licenseUploadId: string }>({ query: (body) => ({ url: "/documents", method: "post", body }), invalidatesTags: ["Licence"] }),
  }),
})

export const { useAddContactMutation, useListVehiclesQuery, useAddVehicleMutation, useListLicencesQuery, useSubmitLicenceMutation } = onboardingApi
