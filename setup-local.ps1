Copy-Item .env.example .env
(Get-Content .env) -replace "DATABASE_URL=.*", "DATABASE_URL=`"postgresql://postgres:password@localhost:5432/taxsentry`"" -replace "DATABASE_URL_UNPOOLED=.*", "DATABASE_URL_UNPOOLED=`"postgresql://postgres:password@localhost:5432/taxsentry`"" | Set-Content .env
Write-Host "Created .env with local Postgres configuration"
docker-compose up -d
Write-Host "Started local Postgres via docker-compose"
Start-Sleep -Seconds 5
npx prisma generate --schema=apps/api/prisma/schema.prisma
npx prisma db push --schema=apps/api/prisma/schema.prisma
Write-Host "Database pushed successfully"
