#!/bin/bash -e
set -o pipefail

if [ "$1" = "--help" ] ; then
	echo "$0: Copies database & media files from live to the current environment (staging/dev)"
	exit
fi

MY_CNF_PROD=~/.my.cnf.prod
MEDIA_SRC=newageprod@localhost:website/media/
MEDIA_DST=~/website/media/

if [ "$USER" = "newageprod" ] ; then
	echo "Already on prod. This will do very bad things! Aborting."
	exit 1
fi

[ -e "$MY_CNF_PROD" ] || { echo "$MY_CNF_PROD missing; are you on the live server?" ; exit 1 }
[ -e "$MEDIA_DST" ]   || { echo "$MEDIA_DST missing; are you on the live server?"   ; exit 1 }

echo "This will overwrite the current database with data from production"
echo "Press enter to continue or Ctrl-C to abort"
read X

echo "Copying DB"
mysqldump --defaults-file="$MY_CNF_PROD" newageprod --verbose | mysql
echo "Done"
echo
echo "Syncing media files"
rsync -e ssh --archive --verbose --delete "$MEDIA_SRC" "$MEDIA_DST"
echo ""
echo
echo "TODO: Do you want to reload group permissions?"
echo "   ( cd ~/website/nac && ./manage.py loaddata groups )"
echo
echo "TODO: Do you want to reload test users?"
echo "   ( cd ~/website/nac && ./manage.py loaddata users )"
echo
echo "Remember to run any necessary migrations!"
cd ~/website/nac
./manage.py showmigrations | egrep '^([^ ]| \[ \])'
