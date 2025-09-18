#!/bin/sh
# Mostrar el puerto que Cloud Run asignó
echo "Cloud Run asignó el puerto: $PORT"

# Reemplazar listen 80; por listen $PORT;
sed -i "s/listen 80;/listen ${PORT};/" /etc/nginx/conf.d/default.conf

# Arrancar Nginx en primer plano
nginx -g 'daemon off;'
