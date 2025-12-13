# Script de test pour l'API /api/chat/match (PowerShell)
# Usage: .\scripts\test-api.ps1

$baseUrl = "http://localhost:3000"

Write-Host "🧪 Tests de l'API /api/chat/match" -ForegroundColor Cyan
Write-Host "==================================" -ForegroundColor Cyan
Write-Host ""

# Test 1: Greeting
Write-Host "📝 Test 1: Intention 'greeting'" -ForegroundColor Yellow
$body1 = @{
    messages = @(
        @{ role = "user"; content = "Bonjour" }
    )
} | ConvertTo-Json

try {
    $response1 = Invoke-RestMethod -Uri "$baseUrl/api/chat/match" -Method POST -Body $body1 -ContentType "application/json"
    Write-Host "✅ Réponse:" -ForegroundColor Green
    $response1 | ConvertTo-Json -Depth 10
} catch {
    Write-Host "❌ Erreur: $_" -ForegroundColor Red
}
Write-Host ""
Write-Host ""

# Test 2: New Search
Write-Host "📝 Test 2: Intention 'new_search'" -ForegroundColor Yellow
$body2 = @{
    messages = @(
        @{ role = "user"; content = "Je cherche un photographe" }
    )
} | ConvertTo-Json

try {
    $response2 = Invoke-RestMethod -Uri "$baseUrl/api/chat/match" -Method POST -Body $body2 -ContentType "application/json"
    Write-Host "✅ Réponse:" -ForegroundColor Green
    $response2 | ConvertTo-Json -Depth 10
} catch {
    Write-Host "❌ Erreur: $_" -ForegroundColor Red
}
Write-Host ""
Write-Host ""

# Test 3: Provide Info (recherche complète)
Write-Host "📝 Test 3: Intention 'provide_info' - Recherche complète" -ForegroundColor Yellow
$body3 = @{
    messages = @(
        @{ role = "user"; content = "Je cherche un photographe" },
        @{ role = "assistant"; content = "Super ! Pourriez-vous me donner plus de détails ?" },
        @{ role = "user"; content = "Notre mariage est le 15 juin 2025 à Paris, budget 4000€, on est franco-algérien, 150 invités" }
    )
} | ConvertTo-Json

try {
    $response3 = Invoke-RestMethod -Uri "$baseUrl/api/chat/match" -Method POST -Body $body3 -ContentType "application/json"
    Write-Host "✅ Réponse:" -ForegroundColor Green
    $response3 | ConvertTo-Json -Depth 10
} catch {
    Write-Host "❌ Erreur: $_" -ForegroundColor Red
}
Write-Host ""
Write-Host ""

Write-Host "✅ Tests terminés !" -ForegroundColor Green

