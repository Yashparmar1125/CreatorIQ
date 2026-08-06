# Generate RS256 JWT key pair for local Docker development.
$SecretsDir = Join-Path $PSScriptRoot "..\secrets"
$PrivateKey = Join-Path $SecretsDir "jwt_private.pem"
$PublicKey = Join-Path $SecretsDir "jwt_public.pem"

if (-not (Test-Path $SecretsDir)) {
    New-Item -ItemType Directory -Path $SecretsDir | Out-Null
}

if ((Test-Path $PrivateKey) -and (Test-Path $PublicKey)) {
    Write-Host "JWT keys already exist in backend/secrets/ - skipping." -ForegroundColor Yellow
    exit 0
}

Write-Host "Generating JWT RSA key pair..." -ForegroundColor Cyan

# Prefer openssl if available
$openssl = Get-Command openssl -ErrorAction SilentlyContinue
if ($openssl) {
    & openssl genrsa -out $PrivateKey 2048 2>$null
    & openssl rsa -in $PrivateKey -pubout -out $PublicKey 2>$null
    Write-Host "Created jwt_private.pem and jwt_public.pem" -ForegroundColor Green
    exit 0
}

# Fallback: Python cryptography
python -c @"
from cryptography.hazmat.primitives.asymmetric import rsa
from cryptography.hazmat.primitives import serialization
import os
secrets = r'$SecretsDir'
priv = rsa.generate_private_key(public_exponent=65537, key_size=2048)
priv_pem = priv.private_bytes(serialization.Encoding.PEM, serialization.PrivateFormat.TraditionalOpenSSL, serialization.NoEncryption())
pub_pem = priv.public_key().public_bytes(serialization.Encoding.PEM, serialization.PublicFormat.SubjectPublicKeyInfo)
open(os.path.join(secrets, 'jwt_private.pem'), 'wb').write(priv_pem)
open(os.path.join(secrets, 'jwt_public.pem'), 'wb').write(pub_pem)
print('Created JWT keys via Python')
"@

if ($LASTEXITCODE -ne 0) {
    Write-Error "Failed to generate keys. Install OpenSSL or: pip install cryptography"
    exit 1
}

Write-Host "Created jwt_private.pem and jwt_public.pem" -ForegroundColor Green
