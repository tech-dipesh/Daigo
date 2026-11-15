import axios from "axios"
import { baseApi } from "@/store/api"

type Kind = "LICENCE" | "RC" | "PAYMENT_PROOF" | "PROFILE_PHOTO"
type Signed = { uploadId: string; url: string; method: string; headers: Record<string, string> }

export const uploadApi = baseApi.injectEndpoints({
  endpoints: (b) => ({
    signUpload: b.mutation<Signed, { kind: Kind; contentType: string; sizeBytes: number }>({ query: (body) => ({ url: "/uploads/sign", method: "post", body }) }),
    confirmUpload: b.mutation<{ id: string }, string>({ query: (id) => ({ url: `/uploads/${id}/confirm`, method: "post" }) }),
  }),
})

export const { useSignUploadMutation, useConfirmUploadMutation } = uploadApi

export function usePhotoUpload() {
  const [sign] = useSignUploadMutation()
  const [confirm] = useConfirmUploadMutation()
  return async (kind: Kind, file: File) => {
    const signed = await sign({ kind, contentType: file.type, sizeBytes: file.size }).unwrap()
    await axios.put(signed.url, file, { headers: signed.headers })
    await confirm(signed.uploadId).unwrap()
    return signed.uploadId
  }
}
