#!/bin/bash

# Script de test pour l'API /api/chat/match
# Usage: ./scripts/test-api.sh

BASE_URL="http://localhost:3000"

echo "🧪 Tests de l'API /api/chat/match"
echo "=================================="
echo ""

# Test 1: Greeting
echo "📝 Test 1: Intention 'greeting'"
curl -X POST "$BASE_URL/api/chat/match" \
  -H "Content-Type: application/json" \
  -d '{
    "messages": [
      {"role": "user", "content": "Bonjour"}
    ]
  }' | jq '.'
echo ""
echo ""

# Test 2: New Search
echo "📝 Test 2: Intention 'new_search'"
curl -X POST "$BASE_URL/api/chat/match" \
  -H "Content-Type: application/json" \
  -d '{
    "messages": [
      {"role": "user", "content": "Je cherche un photographe"}
    ]
  }' | jq '.'
echo ""
echo ""

# Test 3: Provide Info (recherche complète)
echo "📝 Test 3: Intention 'provide_info' - Recherche complète"
curl -X POST "$BASE_URL/api/chat/match" \
  -H "Content-Type: application/json" \
  -d '{
    "messages": [
      {"role": "user", "content": "Je cherche un photographe"},
      {"role": "assistant", "content": "Super ! Pourriez-vous me donner plus de détails ?"},
      {"role": "user", "content": "Notre mariage est le 15 juin 2025 à Paris, budget 4000€, on est franco-algérien, 150 invités"}
    ]
  }' | jq '.'
echo ""
echo ""

# Test 4: Question
echo "📝 Test 4: Intention 'question'"
curl -X POST "$BASE_URL/api/chat/match" \
  -H "Content-Type: application/json" \
  -d '{
    "messages": [
      {"role": "user", "content": "Comment ça marche ?"}
    ]
  }' | jq '.'
echo ""
echo ""

echo "✅ Tests terminés !"

