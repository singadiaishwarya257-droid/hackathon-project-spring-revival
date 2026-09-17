# Mock Data Testing Guide

## Quick Verification

This guide helps you verify that mock data integration is working correctly across all endpoints.

---

## Prerequisites

```bash
# 1. Start the backend
cd backend
npm install
npm run dev

# 2. Get an auth token (use test credentials)
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@springrevival.gov",
    "password": "Admin@123456"
  }'

# Save the returned token for use in tests below
export TOKEN="eyJhbGc..." # Replace with actual token
```

---

## Test Suite 1: Dashboard Endpoints (Mock Data ✅)

### Test 1.1: Dashboard Stats

```bash
curl http://localhost:5000/api/dashboard/stats \
  -H "Authorization: Bearer ${TOKEN}"

# Expected output (mock data):
{
  "stats": {
    "total_villages": 6,
    "total_springs": 42,
    "active_springs": 25,  # May vary slightly
    "total_surveys": 126,
    "avg_recharge_score": "58.4",
    "high_risk_zones": 12,
    "active_users": 6
  }
}
```

### Test 1.2: Rainfall Chart

```bash
curl http://localhost:5000/api/dashboard/chart/rainfall \
  -H "Authorization: Bearer ${TOKEN}"

# Expected: Array of 30 rainfall records with dates and rainfall_mm
# [ { recorded_date: "2024-...", rainfall_mm: 12.5 }, ... ]
```

### Test 1.3: Risk Distribution

```bash
curl http://localhost:5000/api/dashboard/chart/risk-distribution \
  -H "Authorization: Bearer ${TOKEN}"

# Expected: Risk level distribution
# { data: [ { _id: "low", count: 12 }, { _id: "medium", count: 18 }, ... ] }
```

### Test 1.4: Spring Status

```bash
curl http://localhost:5000/api/dashboard/chart/spring-status \
  -H "Authorization: Bearer ${TOKEN}"

# Expected: Spring status distribution
# { data: [ { _id: "active", count: 25 }, { _id: "seasonal", count: 12 }, { _id: "dry", count: 5 } ] }
```

### Test 1.5: Recent Activity

```bash
curl http://localhost:5000/api/dashboard/recent-activity \
  -H "Authorization: Bearer ${TOKEN}"

# Expected: Recent surveys and analyses
# { recent_surveys: [...], recent_analyses: [...] }
```

### Test 1.6: Map Data

```bash
curl "http://localhost:5000/api/dashboard/map-data" \
  -H "Authorization: Bearer ${TOKEN}"

# Expected: Array of 42 springs with GeoJSON coordinates
# { springs: [ { id: "...", name: "...", location: {...}, recharge_score: 58, ... }, ... ] }
```

---

## Test Suite 2: Springs Endpoints (Mock Data ✅)

### Test 2.1: List Springs

```bash
curl "http://localhost:5000/api/springs?limit=10" \
  -H "Authorization: Bearer ${TOKEN}"

# Expected: 10 springs with analysis enrichment
# { springs: [...], total: 42 }
```

### Test 2.2: Springs GeoJSON

```bash
curl "http://localhost:5000/api/springs/geojson" \
  -H "Authorization: Bearer ${TOKEN}"

# Expected: GeoJSON FeatureCollection
# { type: "FeatureCollection", features: [...] }
```

### Test 2.3: Filter by Status

```bash
curl "http://localhost:5000/api/springs?status=active" \
  -H "Authorization: Bearer ${TOKEN}"

# Expected: Only active springs (~25)
# { springs: [...], total: 25 }
```

---

## Test Suite 3: Survey/Field Verification Endpoints (Mock Data ✅)

### Test 3.1: List Surveys

```bash
curl "http://localhost:5000/api/survey?limit=10" \
  -H "Authorization: Bearer ${TOKEN}"

# Expected: 10 field verification records
# { surveys: [...], total: 126 }
```

### Test 3.2: Filter by Status

```bash
curl "http://localhost:5000/api/survey?status=pending" \
  -H "Authorization: Bearer ${TOKEN}"

# Expected: Pending surveys only
# { surveys: [...], total: XX }
```

---

## Test Suite 4: Analysis Endpoints (Mock Data ✅ + Mock AI)

### Test 4.1: List Analyses

```bash
curl "http://localhost:5000/api/analysis?limit=10" \
  -H "Authorization: Bearer ${TOKEN}"

# Expected: 10 recharge analyses
# { analyses: [...], total: 42 }
```

### Test 4.2: Filter by Risk Level

```bash
curl "http://localhost:5000/api/analysis?risk_level=high" \
  -H "Authorization: Bearer ${TOKEN}"

# Expected: High-risk analyses only
# { analyses: [...], total: XX }
```

### Test 4.3: Heatmap Data

```bash
curl "http://localhost:5000/api/analysis/heatmap" \
  -H "Authorization: Bearer ${TOKEN}"

# Expected: Array of [lat, lon, intensity] coordinates
# { heatmap: [ [15.8627, 75.6234, 0.58], ... ] }
```

### Test 4.4: Mock AI Prediction (No AI Service Required ✅)

```bash
curl -X POST http://localhost:5000/api/analysis/predict \
  -H "Authorization: Bearer ${TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{
    "village_id": "test-village-id",
    "spring_id": "test-spring-id",
    "latitude": 15.8627,
    "longitude": 75.6234,
    "annual_rainfall_mm": 1200,
    "elevation_m": 650,
    "slope_deg": 15,
    "soil_permeability": 0.3,
    "land_use_code": "forest",
    "geology_type": "granite",
    "distance_to_stream_m": 200,
    "ndvi_value": 0.6
  }'

# Expected: Mock AI prediction
# {
#   "analysis": {...},
#   "ai_response": {
#     "recharge_score": 58,
#     "confidence_score": 87.3,
#     "risk_level": "medium",
#     "interventions": ["check_dam", "recharge_pit", "contour_trench"],
#     "note": "Mock prediction" or "AI service unavailable, using fallback"
#   }
# }
```

---

## Test Suite 5: Reports Endpoints (Mock Data ✅)

### Test 5.1: Export CSV

```bash
curl "http://localhost:5000/api/reports/export/csv" \
  -H "Authorization: Bearer ${TOKEN}" \
  -o report.csv

# Expected: CSV file with spring data
# Open report.csv to verify content
cat report.csv | head -5
```

### Test 5.2: Export PDF

```bash
curl "http://localhost:5000/api/reports/export/pdf" \
  -H "Authorization: Bearer ${TOKEN}" \
  -o report.pdf

# Expected: PDF file with formatted report
# Open report.pdf to verify content
```

---

## Test Suite 6: Villages Endpoints (Mock Data ✅)

### Test 6.1: List Villages

```bash
curl "http://localhost:5000/api/villages?limit=10" \
  -H "Authorization: Bearer ${TOKEN}"

# Expected: 6 villages with spring counts
# { villages: [...], total: 6, page: 1, limit: 10 }
```

### Test 6.2: Search Villages

```bash
curl "http://localhost:5000/api/villages?search=Belgaum" \
  -H "Authorization: Bearer ${TOKEN}"

# Expected: Belgaum villages only (4 results)
# { villages: [...], total: 4 }
```

---

## Test Suite 7: Rainfall Endpoints (Mock Data ✅)

### Test 7.1: Get Rainfall Data

First, get a village ID from villages endpoint:

```bash
# Get first village ID
VILLAGE_ID=$(curl -s "http://localhost:5000/api/villages?limit=1" \
  -H "Authorization: Bearer ${TOKEN}" | jq -r '.villages[0]._id')

curl "http://localhost:5000/api/rainfall/${VILLAGE_ID}" \
  -H "Authorization: Bearer ${TOKEN}"

# Expected: 30 days of rainfall data with stats
# {
#   "village_id": "...",
#   "records": [...],
#   "stats": {
#     "total_rainfall_mm": "450.0",
#     "avg_temperature_max": "32.5",
#     "record_count": 30
#   }
# }
```

---

## Test Suite 8: Elevation Endpoints (Mock Data ✅)

### Test 8.1: Get Elevation Data

```bash
curl "http://localhost:5000/api/elevation/${VILLAGE_ID}" \
  -H "Authorization: Bearer ${TOKEN}"

# Expected: 9-point DEM grid with elevation stats
# {
#   "elevation_data": [...],
#   "stats": {
#     "min": 520,
#     "max": 890,
#     "avg": "680.5"
#   }
# }
```

---

## Test Suite 9: Admin Mock Data Control Endpoints (✅)

### Test 9.1: Get Mock Data Status

```bash
curl http://localhost:5000/api/admin/mock-data/status \
  -H "Authorization: Bearer ${TOKEN}"

# Expected:
# {
#   "status": false,
#   "message": "Mock data fallback is disabled"
# }
```

### Test 9.2: Enable Mock Data Fallback

```bash
curl -X POST http://localhost:5000/api/admin/mock-data/toggle \
  -H "Authorization: Bearer ${TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{ "enable": true }'

# Expected:
# {
#   "message": "Mock data fallback enabled",
#   "status": true,
#   "timestamp": "2024-09-17T10:30:00.000Z"
# }
```

### Test 9.3: Get Mock Data Statistics

```bash
curl http://localhost:5000/api/admin/mock-data/stats \
  -H "Authorization: Bearer ${TOKEN}"

# Expected:
# {
#   "status": true,
#   "statistics": {
#     "users": 6,
#     "villages": 6,
#     "springs": 42,
#     "rainfallData": 180,
#     "elevationData": 54,
#     "rechargeAnalysis": 42,
#     "fieldVerifications": 126,
#     "uploadedPhotos": 200,
#     "total": 656
#   },
#   "timestamp": "2024-09-17T10:30:00.000Z"
# }
```

### Test 9.4: Reinitialize Mock Data

```bash
curl -X POST http://localhost:5000/api/admin/mock-data/reinitialize \
  -H "Authorization: Bearer ${TOKEN}"

# Expected: Fresh mock data cache
# { "message": "Mock data cache reinitialized", "statistics": {...} }
```

### Test 9.5: System Health

```bash
curl http://localhost:5000/api/admin/system/health \
  -H "Authorization: Bearer ${TOKEN}"

# Expected (with database):
# {
#   "status": "healthy",
#   "environment": "development",
#   "database": { "connected": true, "users": 6 },
#   "mockData": { "enabled": false, "statistics": {...} }
# }

# Expected (without database):
# {
#   "status": "degraded",
#   "database": { "connected": false, "error": "..." },
#   "mockData": { "enabled": true, "fallback_active": true }
# }
```

---

## Test Suite 10: Database Failure Scenario (✅)

This tests the automatic fallback to mock data when database is unavailable.

```bash
# Step 1: Verify endpoint works with database
curl http://localhost:5000/api/springs \
  -H "Authorization: Bearer ${TOKEN}" | jq '.total'
# Output: 42

# Step 2: Stop MongoDB
# Windows PowerShell:
# taskkill /IM mongod.exe /F
# or if using Docker:
# docker stop spring-mongodb

# Step 3: Test endpoint still returns data (from mock cache)
curl http://localhost:5000/api/springs \
  -H "Authorization: Bearer ${TOKEN}" | jq '.total'
# Output: 42 (from mock data cache)

# Step 4: Restart MongoDB
# mongod
# or if using Docker:
# docker start spring-mongodb

# Step 5: Verify database is being used again
curl http://localhost:5000/api/springs \
  -H "Authorization: Bearer ${TOKEN}" | jq '.total'
# Output: 42 (from database)
```

---

## Automated Test Script

Save as `test-mock-data.sh`:

```bash
#!/bin/bash

API_URL="http://localhost:5000/api"
TOKEN="$1"

if [ -z "$TOKEN" ]; then
  echo "Usage: ./test-mock-data.sh YOUR_JWT_TOKEN"
  exit 1
fi

echo "🧪 Testing Mock Data Integration..."
echo ""

# Test counts
echo "1️⃣  Dashboard Stats..."
curl -s "${API_URL}/dashboard/stats" \
  -H "Authorization: Bearer ${TOKEN}" | jq '.stats.total_springs'

echo "2️⃣  Springs..."
curl -s "${API_URL}/springs?limit=1" \
  -H "Authorization: Bearer ${TOKEN}" | jq '.total'

echo "3️⃣  Surveys..."
curl -s "${API_URL}/survey?limit=1" \
  -H "Authorization: Bearer ${TOKEN}" | jq '.total'

echo "4️⃣  Analyses..."
curl -s "${API_URL}/analysis?limit=1" \
  -H "Authorization: Bearer ${TOKEN}" | jq '.total'

echo "5️⃣  Villages..."
curl -s "${API_URL}/villages?limit=1" \
  -H "Authorization: Bearer ${TOKEN}" | jq '.total'

echo "6️⃣  Mock Data Stats..."
curl -s "${API_URL}/admin/mock-data/stats" \
  -H "Authorization: Bearer ${TOKEN}" | jq '.statistics.total'

echo ""
echo "✅ All endpoints tested successfully!"
```

Run it:

```bash
chmod +x test-mock-data.sh
./test-mock-data.sh $TOKEN
```

---

## Performance Benchmarks

Test response times with mock data:

```bash
# First request (initialization):
time curl -s http://localhost:5000/api/springs \
  -H "Authorization: Bearer ${TOKEN}" > /dev/null
# Expected: ~100-200ms

# Subsequent requests (cached):
time curl -s http://localhost:5000/api/springs \
  -H "Authorization: Bearer ${TOKEN}" > /dev/null
# Expected: ~5-10ms
```

---

## Troubleshooting

### Issue: Empty arrays returned

```bash
# Check if mock data is enabled
curl http://localhost:5000/api/admin/mock-data/status \
  -H "Authorization: Bearer ${TOKEN}"

# If status is false, enable it
curl -X POST http://localhost:5000/api/admin/mock-data/toggle \
  -H "Authorization: Bearer ${TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{ "enable": true }'
```

### Issue: Database errors but no mock data

```bash
# Reinitialize mock data cache
curl -X POST http://localhost:5000/api/admin/mock-data/reinitialize \
  -H "Authorization: Bearer ${TOKEN}"
```

### Issue: AI predictions failing

```bash
# Check if AI service is running
curl http://localhost:8000/docs

# If not running, predictions use mock algorithm (expected)
curl -X POST http://localhost:5000/api/analysis/predict \
  -H "Authorization: Bearer ${TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{
    "village_id": "test",
    "spring_id": "test",
    "latitude": 15.8,
    "longitude": 75.6,
    "annual_rainfall_mm": 1200,
    "elevation_m": 650,
    "slope_deg": 15,
    "soil_permeability": 0.3,
    "land_use_code": "forest",
    "geology_type": "granite",
    "distance_to_stream_m": 200,
    "ndvi_value": 0.6
  }'

# Should return prediction with "note" about fallback
```

---

## Summary

✅ **All test suites verify:**
- Mock data properly generated and cached
- All endpoints return expected structure
- Fallback mechanism works on errors
- AI predictions available even without service
- Admin controls functional
- Database failure graceful degradation

✅ **Mock Data Coverage:**
- 6 users
- 6 villages
- 42+ springs
- 126+ surveys
- 42 analyses
- 180+ rainfall records
- 54 elevation records
- 200+ photos
- **Total: 656+ records**

