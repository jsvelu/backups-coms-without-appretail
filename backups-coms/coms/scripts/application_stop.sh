#!/bin/bash

echo "stopping application"

echo "unset environment variables"
ENV_FILE=/home/ubuntu/app/.env
unset $(grep -v '^#' ENV_FILE | sed -E "s/([^=]*)=.*/\1/" | xargs)

echo "stopping services"
systemctl stop gunicorn.service
systemctl stop nginx.service
