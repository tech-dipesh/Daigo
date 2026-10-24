import { DeleteObjectCommand, GetObjectCommand, HeadObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3"
import { getSignedUrl } from "@aws-sdk/s3-request-presigner"
import { env } from "@/lib/infra/clients/env"

const Bucket = env.S3_BUCKET
const expiresIn = 300
const s3 = new S3Client({
  region: env.S3_REGION,
  endpoint: env.S3_URL,
  forcePathStyle: true,
  credentials: { accessKeyId: env.S3_KEY, secretAccessKey: env.S3_SECRET },
})

export const signUpload = (key: string, contentType: string, size: number) => getSignedUrl(s3, new PutObjectCommand({ Bucket, Key: key, ContentType: contentType, ContentLength: size }), { expiresIn })
export const signRead = (key: string, seconds = expiresIn) => getSignedUrl(s3, new GetObjectCommand({ Bucket, Key: key }), { expiresIn: seconds })
export const putObject = (key: string, body: string, contentType: string) => s3.send(new PutObjectCommand({ Bucket, Key: key, Body: body, ContentType: contentType }))
export const removeObject = (key: string) => s3.send(new DeleteObjectCommand({ Bucket, Key: key }))

export async function objectSize(key: string) {
  try {
    const head = await s3.send(new HeadObjectCommand({ Bucket, Key: key }))
    return head.ContentLength ?? null
  } catch {
    return null
  }
}
