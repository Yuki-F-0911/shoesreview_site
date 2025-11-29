$env:DATABASE_URL='postgresql://postgres.ynygmievhiofyossumck:kT%21%21Fqz4aRY%40UBa@aws-1-ap-northeast-1.pooler.supabase.com:6543/postgres?pgbouncer=true'
Write-Host "Setting DATABASE_URL to: $env:DATABASE_URL"
npx prisma db seed
