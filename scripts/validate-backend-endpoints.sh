#!/bin/bash

# 🔍 Script de validación de endpoints del backend
# Verifica que todos los endpoints críticos estén disponibles y respondan correctamente

# Colores para output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuración
API_URL="${NG_APP_API_BASE_URL:-http://localhost:5093}"
TENANT="${TENANT_SLUG:-test}"

echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}🔍 Validación de Endpoints del Backend${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"
echo -e "${YELLOW}API URL:${NC} $API_URL"
echo -e "${YELLOW}Tenant:${NC} $TENANT"
echo ""

# Contador de resultados
PASSED=0
FAILED=0
WARNINGS=0

# Función para validar endpoint
validate_endpoint() {
  local endpoint=$1
  local expected_status=$2
  local description=$3
  local use_tenant_header=${4:-true}

  echo -n "Testing: $description... "

  if [ "$use_tenant_header" = "true" ]; then
    status=$(curl -s -o /dev/null -w "%{http_code}" \
      -H "X-Tenant-Slug: $TENANT" \
      -H "Content-Type: application/json" \
      "$API_URL$endpoint" 2>/dev/null)
  else
    status=$(curl -s -o /dev/null -w "%{http_code}" \
      -H "Content-Type: application/json" \
      "$API_URL$endpoint" 2>/dev/null)
  fi

  if [ "$status" = "$expected_status" ]; then
    echo -e "${GREEN}✅ $status${NC}"
    ((PASSED++))
  elif [ "$status" = "401" ] || [ "$status" = "403" ]; then
    echo -e "${YELLOW}⚠️  $status (Requiere autenticación - OK)${NC}"
    ((WARNINGS++))
  else
    echo -e "${RED}❌ $status (Expected: $expected_status)${NC}"
    ((FAILED++))
  fi
}

# Función para validar endpoint autenticado
validate_auth_endpoint() {
  local endpoint=$1
  local description=$2

  echo -n "Testing: $description... "

  status=$(curl -s -o /dev/null -w "%{http_code}" \
    -H "X-Tenant-Slug: $TENANT" \
    -H "Content-Type: application/json" \
    "$API_URL$endpoint" 2>/dev/null)

  if [ "$status" = "401" ] || [ "$status" = "403" ]; then
    echo -e "${GREEN}✅ $status (Auth required - OK)${NC}"
    ((PASSED++))
  elif [ "$status" = "200" ]; then
    echo -e "${YELLOW}⚠️  $status (Sin auth pero funcional)${NC}"
    ((WARNINGS++))
  else
    echo -e "${RED}❌ $status${NC}"
    ((FAILED++))
  fi
}

echo -e "${BLUE}──────────────────────────────────────────────────────────${NC}"
echo -e "${BLUE}📋 Endpoints Públicos${NC}"
echo -e "${BLUE}──────────────────────────────────────────────────────────${NC}"

validate_endpoint "/api/public/tenant/$TENANT" "200" "Tenant Config" "false"
validate_endpoint "/api/store/products" "200" "Storefront Products"
validate_endpoint "/api/store/categories" "200" "Storefront Categories"

echo ""
echo -e "${BLUE}──────────────────────────────────────────────────────────${NC}"
echo -e "${BLUE}🔐 Endpoints Autenticados (Admin)${NC}"
echo -e "${BLUE}──────────────────────────────────────────────────────────${NC}"

validate_auth_endpoint "/api/admin/products" "Admin Products"
validate_auth_endpoint "/api/admin/stores" "Stores Management"
validate_auth_endpoint "/api/admin/loyalty/rewards" "Loyalty Rewards"
validate_auth_endpoint "/api/admin/loyalty/config" "Loyalty Config"

echo ""
echo -e "${BLUE}──────────────────────────────────────────────────────────${NC}"
echo -e "${BLUE}🏪 Endpoints Multi-Store${NC}"
echo -e "${BLUE}──────────────────────────────────────────────────────────${NC}"

validate_auth_endpoint "/api/admin/stores/products/test-id/stock" "Product Stock by Stores"

echo ""
echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}📊 Resumen de Validación${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"

TOTAL=$((PASSED + FAILED + WARNINGS))

echo -e "${GREEN}✅ Exitosos:${NC} $PASSED"
echo -e "${YELLOW}⚠️  Advertencias:${NC} $WARNINGS (requieren auth)"
echo -e "${RED}❌ Fallidos:${NC} $FAILED"
echo -e "${BLUE}📈 Total:${NC} $TOTAL"
echo ""

if [ $FAILED -eq 0 ]; then
  echo -e "${GREEN}🎉 ¡Validación completada exitosamente!${NC}"
  echo -e "${GREEN}Todos los endpoints críticos están disponibles.${NC}"
  exit 0
else
  echo -e "${RED}⚠️  Algunos endpoints fallaron.${NC}"
  echo -e "${YELLOW}Verifica la configuración del backend y el tenant.${NC}"
  exit 1
fi
