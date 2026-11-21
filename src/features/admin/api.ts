import { baseApi } from "@/store/api"

export type Stats = { users: number; trips: Record<string, number>; payments: { count: number; total: number }; pendingVerifications: { vehicles: number; documents: number } }
export type Analytics = { days: number; tripsByDay: { day: string; count: number }[]; emergenciesByDay: { day: string; count: number }[]; totalTrips: number; cancellationRate: number; moneySaved: number; activeDrivers: number; coinRedemptions: { count: number; coins: number } }
export type Status3 = "PENDING" | "APPROVED" | "REJECTED"
export type AdminVehicle = { id: string; type: string; make: string; model: string; plateNumber: string; rcNumber: string; rcUploadId: string | null; verificationStatus: Status3; rejectionReason: string | null; owner: { id: string; email: string } }
export type AdminDoc = { id: string; licenseNumber: string; licenseUploadId: string | null; verificationStatus: Status3; rejectionReason: string | null; user: { id: string; email: string } }
export type Emergency = { id: string; userId: string; tripId: string | null; lat: number; lng: number; status: string; createdAt: string; user: { id: string; email: string; name: string | null } }
export type ComplaintStatus = "OPEN" | "IN_REVIEW" | "RESOLVED" | "REJECTED"
export type AdminComplaint = { id: string; tripId: string; type: string; text: string; status: ComplaintStatus; adminNote: string | null; createdAt: string; filedBy: { id: string; email: string } }
export type AdminAppeal = { id: string; kind: "WARNING" | "ACCOUNT"; text: string; status: "OPEN" | "APPROVED" | "REJECTED"; decisionNote: string | null; createdAt: string; user: { id: string; email: string } }
export type Zone = { id: string; name: string; minLat: number; maxLat: number; minLng: number; maxLng: number; multiplier: number }
export type Fare = { id: string; vehicleType: string; perKm: number }
export type AdminUser = { id: string; email: string; name: string | null; activeRole: string; staffRole: "MODERATOR" | "SUPER_ADMIN" | null; trustScore: number; isBanned: boolean; emailVerifiedAt: string | null; createdAt: string }
export type AdminUserDetail = AdminUser & { trips: number; warnings: number; complaints: number }
export type Obj = Record<string, unknown>

export const adminApi = baseApi.injectEndpoints({
  endpoints: (b) => ({
    stats: b.query<Stats, void>({ query: () => ({ url: "/admin/stats" }), providesTags: ["Admin"] }),
    analytics: b.query<Analytics, number>({ query: (days) => ({ url: "/admin/analytics", params: { days } }), providesTags: ["Admin"] }),
    verifications: b.query<{ vehicles: AdminVehicle[]; documents: AdminDoc[] }, Status3>({ query: (status) => ({ url: "/admin/verifications", params: { status } }), providesTags: ["Admin"] }),
    reviewVehicle: b.mutation<AdminVehicle, { id: string; status: "APPROVED" | "REJECTED"; reason?: string }>({ query: ({ id, ...body }) => ({ url: `/admin/vehicles/${id}`, method: "patch", body }), invalidatesTags: ["Admin"] }),
    reviewDocument: b.mutation<AdminDoc, { id: string; status: "APPROVED" | "REJECTED"; reason?: string }>({ query: ({ id, ...body }) => ({ url: `/admin/documents/${id}`, method: "patch", body }), invalidatesTags: ["Admin"] }),
    uploadLink: b.mutation<{ url: string }, string>({ query: (id) => ({ url: `/admin/uploads/${id}/url` }) }),
    emergencies: b.query<Emergency[], void>({ query: () => ({ url: "/admin/emergency" }), providesTags: ["Admin"] }),
    resolveEmergency: b.mutation<Emergency, string>({ query: (id) => ({ url: `/admin/emergency/${id}`, method: "patch" }), invalidatesTags: ["Admin"] }),
    complaints: b.query<AdminComplaint[], ComplaintStatus>({ query: (status) => ({ url: "/admin/complaints", params: { status } }), providesTags: ["Admin"] }),
    decideComplaint: b.mutation<AdminComplaint, { id: string; status: "IN_REVIEW" | "RESOLVED" | "REJECTED"; note?: string }>({ query: ({ id, ...body }) => ({ url: `/admin/complaints/${id}`, method: "patch", body }), invalidatesTags: ["Admin"] }),
    adminAppeals: b.query<AdminAppeal[], "OPEN" | "APPROVED" | "REJECTED">({ query: (status) => ({ url: "/admin/appeals", params: { status } }), providesTags: ["Admin"] }),
    decideAppeal: b.mutation<AdminAppeal, { id: string; status: "APPROVED" | "REJECTED"; note?: string }>({ query: ({ id, ...body }) => ({ url: `/admin/appeals/${id}`, method: "patch", body }), invalidatesTags: ["Admin"] }),
    zones: b.query<Zone[], void>({ query: () => ({ url: "/admin/zones" }), providesTags: ["Admin"] }),
    patchZone: b.mutation<Zone, { id: string; name?: string; multiplier?: number }>({ query: ({ id, ...body }) => ({ url: `/admin/zones/${id}`, method: "patch", body }), invalidatesTags: ["Admin"] }),
    fares: b.query<Fare[], void>({ query: () => ({ url: "/admin/fare-rates" }), providesTags: ["Admin"] }),
    patchFare: b.mutation<Fare, { type: string; perKm: number }>({ query: ({ type, perKm }) => ({ url: `/admin/fare-rates/${type}`, method: "patch", body: { perKm } }), invalidatesTags: ["Admin"] }),
    adminUsers: b.query<AdminUser[], { q: string; staff: boolean }>({ query: ({ q, staff }) => ({ url: "/admin/users", params: { q: q || undefined, staff: String(staff) } }), providesTags: ["Admin"] }),
    adminUser: b.query<AdminUserDetail, string>({ query: (id) => ({ url: `/admin/users/${id}` }) }),
    setStaff: b.mutation<AdminUser, { id: string; staffRole: "MODERATOR" | "SUPER_ADMIN" | null }>({ query: ({ id, staffRole }) => ({ url: `/admin/users/${id}/staff-role`, method: "patch", body: { staffRole } }), invalidatesTags: ["Admin"] }),
    exportCsv: b.mutation<{ queued: boolean; from: string; to: string }, { type: string; from?: string; to?: string }>({ query: (body) => ({ url: "/admin/exports", method: "post", body }) }),
    demoRun: b.mutation<Obj, { url: string; body?: Obj }>({ query: ({ url, body }) => ({ url: `/admin/demo/${url}`, method: "post", body: body ?? {} }), invalidatesTags: ["Admin"] }),
    demoGet: b.query<Obj, string>({ query: (url) => ({ url: `/admin/demo/${url}` }), providesTags: ["Admin"] }),
  }),
})

export const { useStatsQuery, useAnalyticsQuery, useVerificationsQuery, useReviewVehicleMutation, useReviewDocumentMutation, useUploadLinkMutation, useEmergenciesQuery, useResolveEmergencyMutation, useComplaintsQuery, useDecideComplaintMutation, useAdminAppealsQuery, useDecideAppealMutation, useZonesQuery, usePatchZoneMutation, useFaresQuery, usePatchFareMutation, useAdminUsersQuery, useAdminUserQuery, useSetStaffMutation, useExportCsvMutation, useDemoRunMutation, useDemoGetQuery } = adminApi
