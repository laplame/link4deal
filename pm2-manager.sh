#!/bin/bash

APP_NAME="link4deal-backend"
CONFIG_FILE="ecosystem.config.cjs"

echo "🚀 PM2 Manager para Link4Deal"
echo "================================"

case "$1" in
    start)
        echo "▶️  Iniciando aplicación..."
        pm2 start $CONFIG_FILE --env production
        pm2 save
        echo "✅ Aplicación iniciada y guardada"
        ;;
    stop)
        echo "⏹️  Parando aplicación..."
        pm2 stop $APP_NAME
        echo "✅ Aplicación parada"
        ;;
    restart)
        echo "🔄 Reiniciando aplicación..."
        pm2 restart $APP_NAME
        echo "✅ Aplicación reiniciada"
        ;;
    reload)
        echo "🔄 Recargando aplicación..."
        pm2 reload $APP_NAME
        echo "✅ Aplicación recargada"
        ;;
    status)
        echo "📊 Estado de la aplicación:"
        pm2 list
        ;;
    logs)
        echo "📝 Mostrando logs en tiempo real (Ctrl+C para salir):"
        pm2 logs $APP_NAME
        ;;
    build)
        echo "🔨 Construyendo frontend..."
        npm run build
        echo "✅ Frontend construido"
        ;;
    deploy)
        echo "🚀 Desplegando aplicación completa..."
        npm run build
        pm2 reload $CONFIG_FILE --env production
        pm2 save
        echo "✅ Aplicación desplegada y guardada"
        ;;
    setup)
        echo "⚙️  Configurando PM2 para inicio automático..."
        pm2 startup
        pm2 save
        echo "✅ PM2 configurado para inicio automático"
        ;;
    *)
        echo "Uso: $0 {start|stop|restart|reload|status|logs|build|deploy|setup}"
        echo ""
        echo "Comandos disponibles:"
        echo "  start   - Iniciar aplicación"
        echo "  stop    - Parar aplicación"
        echo "  restart - Reiniciar aplicación"
        echo "  reload  - Recargar aplicación (sin downtime)"
        echo "  status  - Ver estado de todas las aplicaciones"
        echo "  logs    - Ver logs en tiempo real"
        echo "  build   - Construir frontend"
        echo "  deploy  - Desplegar aplicación completa"
        echo "  setup   - Configurar inicio automático"
        exit 1
        ;;
esac
