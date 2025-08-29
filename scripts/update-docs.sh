#!/bin/bash

set -euo pipefail
BASE=${1:-HEAD~1}

# Script para detectar cambios en la estructura del proyecto frontend y recordar actualizar documentación

echo "🔍 Detecting frontend project structure changes..."

# Frontend - Detectar páginas cambiadas
echo "📄 Checking for changed pages since $BASE..."
CHANGED_PAGES=$(git diff --name-only "$BASE" -- 'app/**/page.tsx' 2>/dev/null || true)

# Detectar componentes cambiados
echo "🧩 Checking for changed components since $BASE..."
CHANGED_COMPONENTS=$(git diff --name-only "$BASE" -- 'components/**/*.tsx' 2>/dev/null || true)

# Detectar hooks cambiados
echo "🎣 Checking for changed hooks since $BASE..."
CHANGED_HOOKS=$(git diff --name-only "$BASE" -- 'hooks/**/*.ts' 2>/dev/null || true)

# Detectar servicios cambiados
echo "🔧 Checking for changed services since $BASE..."
CHANGED_SERVICES=$(git diff --name-only "$BASE" -- 'lib/api/**/*.ts' 2>/dev/null || true)

# Detectar schemas cambiados
echo "📋 Checking for changed schemas since $BASE..."
CHANGED_SCHEMAS=$(git diff --name-only "$BASE" -- 'schema/**/*.ts' 2>/dev/null || true)

# Detectar cambios en package.json
echo "📦 Checking for package.json changes since $BASE..."
PACKAGE_CHANGES=$(git diff --name-only "$BASE" -- package.json 2>/dev/null || true)

# Detectar providers cambiados
echo "🔄 Checking for changed providers since $BASE..."
CHANGED_PROVIDERS=$(git diff --name-only "$BASE" -- 'providers/**/*.tsx' 2>/dev/null || true)

echo ""
echo "📋 SUMMARY OF DETECTED CHANGES (vs $BASE):"
echo "================================"

if [ -n "$CHANGED_PAGES" ]; then
    echo "🆕 Pages changed:"
    echo "$CHANGED_PAGES"
    echo ""
fi

if [ -n "$CHANGED_COMPONENTS" ]; then
    echo "🆕 Components changed:"
    echo "$CHANGED_COMPONENTS"
    echo ""
fi

if [ -n "$CHANGED_HOOKS" ]; then
    echo "🆕 Hooks changed:"
    echo "$CHANGED_HOOKS"
    echo ""
fi

if [ -n "$CHANGED_SERVICES" ]; then
    echo "🆕 Services changed:"
    echo "$CHANGED_SERVICES"
    echo ""
fi

if [ -n "$CHANGED_SCHEMAS" ]; then
    echo "🆕 Schemas changed:"
    echo "$CHANGED_SCHEMAS"
    echo ""
fi

if [ -n "$CHANGED_PROVIDERS" ]; then
    echo "🆕 Providers changed:"
    echo "$CHANGED_PROVIDERS"
    echo ""
fi

if [ -n "$PACKAGE_CHANGES" ]; then
    echo "📦 Package.json changes detected!"
    echo ""
fi

echo "⚠️  REMINDER: Update documentation files:"
echo "   - .cursor/rules/sunnsteel-project.mdc"
echo "   - .windsurf/rules/sunnsteel-project-part-1.mdc"
echo "   - .windsurf/rules/sunnsteel-project-part-2.mdc"
echo "   - README.md"
echo ""
echo "💡 Run this script after making changes to detect what needs documentation updates." 