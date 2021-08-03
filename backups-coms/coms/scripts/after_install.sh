#!/bin/bash
set -e

echo "installing dependencies..."
cd /home/ubuntu/app

virtualenv env --no-site-packages
source env/bin/activate
pip install -r requirements/requirements.txt
