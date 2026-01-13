# DATABASE_URL should be set in .env file
Write-Host "Checking data..."
npx tsx src/scripts/check-production-data.ts
