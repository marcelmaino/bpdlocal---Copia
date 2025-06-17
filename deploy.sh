#!/bin/bash

# Script de Deploy para BPD Dashboard
# Uso: ./deploy.sh [ambiente]
# Ambientes: dev, prod

set -e

ENVIRONMENT=${1:-prod}
COMPOSE_FILE="docker-compose.yml"

if [ "$ENVIRONMENT" = "prod" ]; then
    COMPOSE_FILE="docker-compose.prod.yml"
fi

echo "🚀 Iniciando deploy para ambiente: $ENVIRONMENT"
echo "📁 Usando arquivo: $COMPOSE_FILE"

# Verificar se o arquivo existe
if [ ! -f "$COMPOSE_FILE" ]; then
    echo "❌ Arquivo $COMPOSE_FILE não encontrado!"
    exit 1
fi

# Verificar se o Docker está rodando
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker não está rodando!"
    exit 1
fi

# Parar containers existentes
echo "🛑 Parando containers existentes..."
docker-compose -f "$COMPOSE_FILE" down

# Remover imagens antigas (opcional)
read -p "🗑️  Remover imagens antigas? (y/N): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "🧹 Removendo imagens antigas..."
    docker system prune -f
    docker image prune -f
fi

# Build e start dos containers
echo "🔨 Fazendo build das imagens..."
docker-compose -f "$COMPOSE_FILE" build --no-cache

echo "▶️  Iniciando containers..."
docker-compose -f "$COMPOSE_FILE" up -d

# Aguardar containers iniciarem
echo "⏳ Aguardando containers iniciarem..."
sleep 10

# Verificar status
echo "📊 Status dos containers:"
docker-compose -f "$COMPOSE_FILE" ps

# Verificar logs
echo "📝 Últimos logs:"
docker-compose -f "$COMPOSE_FILE" logs --tail=20

# URLs de acesso
echo ""
echo "✅ Deploy concluído!"
echo ""
echo "🌐 URLs de acesso:"
if [ "$ENVIRONMENT" = "prod" ]; then
    echo "   Frontend: http://localhost"
    echo "   Backend API: http://localhost:5000"
    echo "   phpMyAdmin: http://localhost:8080"
else
    echo "   Frontend: http://localhost:3001"
    echo "   Backend API: http://localhost:5000"
    echo "   phpMyAdmin: http://localhost:8080"
fi
echo ""
echo "📋 Comandos úteis:"
echo "   Ver logs: docker-compose -f $COMPOSE_FILE logs -f"
echo "   Parar: docker-compose -f $COMPOSE_FILE down"
echo "   Reiniciar: docker-compose -f $COMPOSE_FILE restart"
echo "   Status: docker-compose -f $COMPOSE_FILE ps"
echo ""
echo "🎉 Deploy finalizado com sucesso!"