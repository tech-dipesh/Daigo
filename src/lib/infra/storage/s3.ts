import { DeleteObjectCommand, GetObjectCommand, HeadObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3"
import { getSignedUrl } from "@aws-sdk/s3-request-presigner"
import { env } from "@/lib/infra/clients/env"
import { AppError } from "@/lib/infra/http/response"

const expiresIn = 300
let cached: { s3: S3Client; Bucket: string } | null = null

/*
  this is plain aws s3, leave S3_URL empty. S3_URL only exists for s3 compatible stores
  keys are optional so the app starts without them, uploads just say not configured
*/
function storage() {
  if (cached) return cached
  const { S3_URL, S3_KEY, S3_SECRET, S3_BUCKET, S3_REGION } = env
  const hasKeys = Boolean(S3_KEY && S3_SECRET)
  if (!S3_BUCKET || (S3_URL && !hasKeys)) throw new AppError("File storage is not configured", 503)
  const custom = S3_URL ? { endpoint: S3_URL, forcePathStyle: true } : {}
  const keys = S3_KEY && S3_SECRET ? { credentials: { accessKeyId: S3_KEY, secretAccessKey: S3_SECRET } } : {}
  cached = { s3: new S3Client({ region: S3_REGION, ...custom, ...keys }), Bucket: S3_BUCKET }
  return cached
}

export function signUpload(key: string, contentType: string, size: number) {
  const { s3, Bucket } = storage()
  return getSignedUrl(s3, new PutObjectCommand({ Bucket, Key: key, ContentType: contentType, ContentLength: size }), { expiresIn })
}

export function signRead(key: string, seconds = expiresIn) {
  const { s3, Bucket } = storage()
  return getSignedUrl(s3, new GetObjectCommand({ Bucket, Key: key }), { expiresIn: seconds })
}

export function putObject(key: string, body: string, contentType: string) {
  const { s3, Bucket } = storage()
  return s3.send(new PutObjectCommand({ Bucket, Key: key, Body: body, ContentType: contentType }))
}

export function removeObject(key: string) {
  const { s3, Bucket } = storage()
  return s3.send(new DeleteObjectCommand({ Bucket, Key: key }))
}

export async function objectSize(key: string) {
  const { s3, Bucket } = storage()
  try {
    const head = await s3.send(new HeadObjectCommand({ Bucket, Key: key }))
    return head.ContentLength ?? null
  } catch {
    return null
  }
}
