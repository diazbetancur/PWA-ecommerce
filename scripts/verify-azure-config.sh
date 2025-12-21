#!/bin/bash

# 🔍 Script de verificación de configuración de entornos
# Verifica que todos los archivos estén correctamente configurados

echo "🔍 Verificando configuración de entornos para Azure Backend..."
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Counters
PASSED=0
FAILED=0
WARNINGS=0

# Function to check if file exists
check_file() {
    if [ -f "$1" ]; then
        echo -e "${GREEN}✅ Found: $1${NC}"
        ((PASSED++))
        return 0
    else
        echo -e "${RED}❌ Missing: $1${NC}"
        ((FAILED++))
        return 1
    fi
}

# Function to check if file contains string
check_content() {
    if grep -q "$2" "$1" 2>/dev/null; then
        echo -e "${GREEN}✅ $1 contains: $2${NC}"
        ((PASSED++))
        return 0
    else
        echo -e "${RED}❌ $1 missing: $2${NC}"
        ((FAILED++))
        return 1
    fi
}

# Function to check if Azure URL is configured
check_azure_url() {
    local file="$1"
    local env_name="$2"

    if grep -q "api-ecommerce-d9fxeccbeeehdjd3.eastus-01.azurewebsites.net" "$file" 2>/dev/null; then
        echo -e "${GREEN}✅ $env_name configured with Azure URL${NC}"
        ((PASSED++))
    else
        echo -e "${YELLOW}⚠️ $env_name not using Azure URL${NC}"
        ((WARNINGS++))
    fi
}

echo "📁 Verificando estructura de archivos..."
echo "----------------------------------------"

# Check environment files
check_file "apps/pwa/src/environments/environment.ts"
check_file "apps/pwa/src/environments/environment.dev.ts"
check_file "apps/pwa/src/environments/environment.qa.ts"
check_file "apps/pwa/src/environments/environment.prod.ts"

# Check core services
check_file "core/src/lib/services/app-env.service.ts"
check_file "core/src/lib/config/app-env-initializer.ts"

# Check demo component
check_file "shared/src/lib/demos/environment-demo.component.ts"

echo ""
echo "🔧 Verificando configuración de Azure..."
echo "----------------------------------------"

# Check Azure URLs
check_azure_url "apps/pwa/src/environments/environment.dev.ts" "Development"
check_azure_url "apps/pwa/src/environments/environment.qa.ts" "QA"
check_azure_url "apps/pwa/src/environments/environment.prod.ts" "Production"

echo ""
echo "📦 Verificando package.json scripts..."
echo "----------------------------------------"

# Check NPM scripts
check_content "package.json" "start:dev"
check_content "package.json" "start:qa"
check_content "package.json" "build:dev"
check_content "package.json" "build:qa"
check_content "package.json" "start:prod"

echo ""
echo "⚙️ Verificando project.json configuración..."
echo "----------------------------------------"

# Check Nx configuration
check_content "apps/pwa/project.json" "\"dev\":"
check_content "apps/pwa/project.json" "\"qa\":"
check_content "apps/pwa/project.json" "environment.dev.ts"
check_content "apps/pwa/project.json" "environment.qa.ts"

echo ""
echo "🔌 Verificando integración de servicios..."
echo "----------------------------------------"

# Check service integrations
check_content "core/src/lib/services/api-client.service.ts" "AppEnvService"
check_content "apps/pwa/src/app/app.config.ts" "APP_ENV_INITIALIZER"
check_content "core/src/index.ts" "app-env.service"

echo ""
echo "🧪 Verificando exports y imports..."
echo "----------------------------------------"

# Check exports
check_content "core/src/index.ts" "export \* from './lib/services/app-env.service'"
check_content "core/src/index.ts" "export \* from './lib/config/app-env-initializer'"

echo ""
echo "📊 Resumen de verificación"
echo "========================="
echo -e "${GREEN}✅ Verificaciones exitosas: $PASSED${NC}"
echo -e "${YELLOW}⚠️ Advertencias: $WARNINGS${NC}"
echo -e "${RED}❌ Verificaciones fallidas: $FAILED${NC}"
echo ""

if [ $FAILED -eq 0 ]; then
    if [ $WARNINGS -eq 0 ]; then
        echo -e "${GREEN}🎉 ¡Configuración completa! Todo está correctamente configurado.${NC}"
        echo ""
        echo "🚀 Comandos disponibles:"
        echo "  npm start                 # Development con Mock API"
        echo "  npm run start:real       # Development con Azure API"
        echo "  npm run start:prod       # Production mode"
        echo "  npm run build:prod       # Build para producción"
        echo ""
    else
        echo -e "${YELLOW}⚠️ Configuración funcional con advertencias.${NC}"
        echo "Las advertencias no impiden el funcionamiento pero se recomienda revisarlas."
    fi
else
    echo -e "${RED}❌ La configuración tiene errores que deben corregirse.${NC}"
    echo "Por favor, revisa los archivos marcados con ❌"
    exit 1
fi

echo "📚 Documentación: docs/AZURE_BACKEND_INTEGRATION.md"
echo "🧪 Demo component: shared/src/lib/demos/environment-demo.component.ts"
