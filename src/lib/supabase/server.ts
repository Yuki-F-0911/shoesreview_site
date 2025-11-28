import { randomUUID } from 'crypto'
import { createClient, type SupabaseClient } from '@supabase/supabase-js'

const SUPABASE_URL = process.env.SUPABASE_URL
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY
const SUPABASE_BUCKET = process.env.SUPABASE_BUCKET_SHOES || 'shoe-media'

let serviceClient: SupabaseClient | null = null

function getServiceClient() {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error('Supabase environment variables are not configured')
  }

  if (!serviceClient) {
    serviceClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    })
  }

  return serviceClient
}

interface UploadOptions {
  prefix?: string
  contentType?: string
}

export async function uploadPngToStorage(buffer: Buffer, options: UploadOptions = {}) {
  const client = getServiceClient()
  const folder = options.prefix?.replace(/\/+$/, '') || 'shoe-media'
  const fileName = `${folder}/${new Date().getFullYear()}/${randomUUID()}.png`

  const { error } = await client.storage.from(SUPABASE_BUCKET).upload(fileName, buffer, {
    cacheControl: '31536000',
    contentType: options.contentType || 'image/png',
    upsert: false,
  })

  if (error) {
    throw new Error(`Supabase upload failed: ${error.message}`)
  }

  const { data } = client.storage.from(SUPABASE_BUCKET).getPublicUrl(fileName)

  if (!data?.publicUrl) {
    throw new Error('Failed to retrieve Supabase public URL')
  }

  return {
    path: fileName,
    publicUrl: data.publicUrl,
  }
}

export function getSupabasePublicUrl(path: string) {
  const client = getServiceClient()
  const { data } = client.storage.from(SUPABASE_BUCKET).getPublicUrl(path)
  return data.publicUrl
}

export function getSupabaseBucketName() {
  return SUPABASE_BUCKET
}


