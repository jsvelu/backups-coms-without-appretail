#!/bin/bash -e
set -o pipefail

source "$(dirname "${BASH_SOURCE[0]}")/../bin/common.inc"
cd test-e2e

connector_dir=node_modules/webdriver-manager/selenium
if [ ! -e $connector_dir/selenium-server-standalone-*.jar ] || [ ! -e $connector_dir/chromedriver_*.zip ] ; then
	echo "Selenium driver & server missing; installing"
	# WEBDRIVER_MANAGER_CDN is defined for CI, is empty for local dev
	node_modules/.bin/webdriver-manager update --alternate_cdn "$WEBDRIVER_MANAGER_CDN"
else
	echo "Selenium driver & server present"
fi
