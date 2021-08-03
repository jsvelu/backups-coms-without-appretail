#!/bin/bash -e
set -o pipefail

source "$(dirname "${BASH_SOURCE[0]}")/common.inc"
cd $project_dir

apps=(
	'caravans'
	'customers'
	'newage'
	'orders'
	'production'
	'schedule'
)

for ((i = 0; i<${#apps[@]}; i++)); do
    app=${apps[$i]}
    echo -n "Update fixtures for application $app? [Yn]: "
    read -n 1 go
    if [ "$go" != "n" ] ; then
        ./manage.py dumpdata $app --indent 2 -o $app/fixtures/dev.json
    else
        echo ""
    fi
done

