#!/bin/bash

# Script para detectar cambios en la estructura del proyecto frontend y recordar actualizar documentación

echo "🔍 Detecting frontend project structure changes..."

# Frontend - Detectar nuevas páginas
echo "📄 Checking for new pages..."
NEW_PAGES=$(find app -name "page.tsx" -type f 2>/dev/null)

# Detectar nuevos componentes
echo "🧩 Checking for new components..."
NEW_COMPONENTS=$(find components -name "*.tsx" -type f 2>/dev/null)

# Detectar nuevos hooks
echo "🎣 Checking for new hooks..."
NEW_HOOKS=$(find hooks -name "*.ts" -type f 2>/dev/null)

# Detectar nuevos servicios
echo "🔧 Checking for new services..."
NEW_SERVICES=$(find lib/api -name "*.ts" -type f 2>/dev/null)

# Detectar nuevos schemas
echo "📋 Checking for new schemas..."
NEW_SCHEMAS=$(find schema -name "*.ts" -type f 2>/dev/null)

# Detectar cambios en package.json
echo "📦 Checking for package.json changes..."
PACKAGE_CHANGES=$(git diff --name-only HEAD~1 | grep "package.json" 2>/dev/null)

# Detectar nuevos providers
echo "🔄 Checking for new providers..."
NEW_PROVIDERS=$(find providers -name "*.tsx" -type f 2>/dev/null)

echo ""
echo "📋 SUMMARY OF DETECTED CHANGES:"
echo "================================"

if [ ! -z "$NEW_PAGES" ]; then
    echo "🆕 New pages detected:"
    echo "$NEW_PAGES"
    echo ""
fi

if [ ! -z "$NEW_COMPONENTS" ]; then
    echo "🆕 New components detected:"
    echo "$NEW_COMPONENTS"
    echo ""
fi

if [ ! -z "$NEW_HOOKS" ]; then
    echo "🆕 New hooks detected:"
    echo "$NEW_HOOKS"
    echo ""
fi

if [ ! -z "$NEW_SERVICES" ]; then
    echo "🆕 New services detected:"
    echo "$NEW_SERVICES"
    echo ""
fi

if [ ! -z "$NEW_SCHEMAS" ]; then
    echo "🆕 New schemas detected:"
    echo "$NEW_SCHEMAS"
    echo ""
fi

if [ ! -z "$NEW_PROVIDERS" ]; then
    echo "🆕 New providers detected:"
    echo "$NEW_PROVIDERS"
    echo ""
fi

if [ ! -z "$PACKAGE_CHANGES" ]; then
    echo "📦 Package.json changes detected!"
    echo ""
fi

echo "⚠️  REMINDER: Update documentation files:"
echo "   - .cursor/rules/sunnsteel-project.mdc"
echo "   - README.md"
echo ""
echo "💡 Run this script after making changes to detect what needs documentation updates." 