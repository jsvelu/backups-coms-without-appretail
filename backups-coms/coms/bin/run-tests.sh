#!/bin/bash -e
set -o pipefail

source "$(dirname "${BASH_SOURCE[0]}")/common.inc"

bin/run-tests-unit.sh

bin/run-tests-e2e.sh
