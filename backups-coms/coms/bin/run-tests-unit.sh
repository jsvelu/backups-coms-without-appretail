#!/bin/bash -e
set -o pipefail

source "$(dirname "${BASH_SOURCE[0]}")/common.inc"

args=( "$@" )
if $is_ci ; then
	args+=(--keepdb)
fi

cd nac && ./manage.py test "${args[@]}"
