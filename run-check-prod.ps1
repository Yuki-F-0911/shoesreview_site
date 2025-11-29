$env:DATABASE_URL='postgresql://postgres.ynygmievhiofyossumck:kT%21%21Fqz4aRY%40UBa@aws-1-ap-northeast-1.pooler.supabase.com:6543/postgres?pgbouncer=true'
Write-Host "Checking data in: $env:DATABASE_URL"
npx tsx src/scripts/check-production-data.ts
