# NewAge Caravans

* [Overview](#overview)
 * [Purpose](#purpose)
 * [Tech Stack](#tech-stack)
* [Architecture](#architecture)
* [Development](#development)
    * [Fixtures](#fixtures)
* [Testing](#testing)
* [Deployment](#deployment)
    * [Staging/UAT](#deployment-uatstage)
    * [Production](#deployment-production)
    * [Database Backups](#database-backups)

## Overview

### Purpose

A system for managing the operations of a caravan manufacturer
* CRM
* Quoting
* Ordering
* Build Scheduling
* Build Production
* Quality Assurance
* Warranties

### Tech Stack

* AWS (Ubuntu 18 LTS)
    * Python 2.7
        * Django 1.8
    * Angular 1.4
    * MySQL 5.1
        * Client libs on prod are 5.5 but server is actually 5.1
    * nginx
        * gunicorn
* External integration with eGM (eGood Manners) API

### Architecture

#### JS

JS Dev is split into two
* 'Normal' (non-angular) admin javascript & css is in `nac/appname/static/...` as usual
 * Vendor css/js comes from `frontend/bower_components`
 * Global CSS comes from `frontend/apps/shared/style.scss`
* The system is also made up of a number of single page apps
 * These are built separately from the admin assets; in `frontend` with webpack
* Bower had been removed from the project as of 2018.07.17
 * As some of the libraries depend on bower (ie. havent been ported to NPM), we're freezing current set of bower installs by committing bower_components directly into repo

#### Static Files

* Most javascript and css files are concatenated & minified using webpack
 * Static files are collected into the top-level `assets` directory
 * Uploaded files are stored in the top-level `media` directory
* Static files are sourced from
 * webpack's `frontend/dist/prod` production build output
 * django apps can also provide files in `nac/(modulename)/static/..` (these won't be run through webpack)

## Development

### AWS Setup

#### Management Setup
* To view details in the AWS Console use tt:client=600#account_6491 for login
* To view details via the CLI,
    * Install AWS CLI - https://docs.aws.amazon.com/cli/latest/userguide/cli-chap-install.html
    * Configure specific AWS profile using tt:client=600#account_6459,
```bash
aws configure --profile nac
```   

#### Deployment Setuo
* Generate a new SSH key called `nac_codecommit_rsa` and store it in your `~/.ssh` folder using `ssh-keygen`
* Send the public key to QRSolutions and they will provide you with a login to AWS and an SSH Key ID which should be stored in TT
* Add the following to your `~/.ssh/config`,
```
Host git-codecommit.*.amazonaws.com
	User <your-ssh-key-id>
	IdentityFile ~/.ssh/nac_codecommit_rsa
```
* Add a CodeCommit remote called `deploy` to your git config for the repo,
```
git remote add deploy ssh://git-codecommit.ap-southeast-2.amazonaws.com/v1/repos/newage-coms
```

### Enable `.git/hooks`

In the root of a git checkout:
```bash
( [ -e .git ] || ( echo "You're not in the root of the git repository" >&2 ; false ) ) && ( rm -rf .git/hooks && ln -sf ../git-hooks .git/hooks && echo ".git/hooks symlink created" )
```

### Install Dependencies

* Install `wkhtmltopdf`
```bash
brew cask install wkhtmltopdf
```
* Create and activate a python virtualenv
* Activate node version (`nvm use`)
* Install package dependencies:

```bash
( cd frontend && yarn install )
( cd requirements && pip install -r requirements.txt )
( cd requirements && pip install -r dev.txt )
```

#### Frontend Test Dependencies
```bash
( cd test-e2e && yarn install )
```

### Dev Servers

* Reset database and load dev fixture data
   * Assumes you have a mysql server running
   * Database name is hardcoded in `nac/newage/settings/dev.py`
   * Will read database+username+password from `~/.my.cnf`

* **DO NOT DO THIS ON THE STAGING OR LIVE SERVER**
  * It will wipe your database
```bash
bin/reset-db.sh
```

#### Webpack Dev Server
```bash
( cd frontend && yarn run server )
```

#### Django Server
```bash
( cd nac && ./manage.py runserver_plus )
```

### Fixtures
* Fixture data is split into 3; each builds on the previous set of fixtures
    * `groups` - groups & permission data. This is loaded on the live server to sync group permissions.
        * Note that django fixtures will modify records (including many-many relationships), but not delete them
        * If you change the 'natural primary key' of a record then django will see this as creating a new record
        * If you delete or rename a group you need to manually apply this change
    * `users` - test users for uat/staging/dev only
    * `dev` - test data for (local) dev only
* To load fixture data
    * `bin/reset-db.sh`
        * Will wipe the DB and reload all fixture data
    * `nac/manage.py loaddata groups`
        * Will reload the `group` fixtures.
        * If a group already exists with the same name django will update it
* To recreate fixture data
    * When you make structural DB changes you will need to recreate fixture data
    * `nac/manage.py autodumpdata --fixture groups`
        * `autodumpdata` is a wrapper to the built-in django `dumpdata` that sets some defaults and automatically determines which models to dump based on their `fixtures_autodump` property
    * `nac/manage.py autodumpdata --fixture dev`
        * Will recreate dev test data

## Testing

* Django server needs to be started with date mocking in order for frontend tests to pass
* Selenium can't deal with PDFs so we need to generate html output for those pages

```bash
( cd nac && DISABLE_PDF=1 MOCK_DATES=1 ./manage.py runserver_plus )
```

Run Tests
```bash
( cd test-e2e && yarn run test )
```

## Deployment

### Branches

* `master` - live branch
* `staging` - internal testing (ephemeral branch; may be reset at any point)

### Production Build (on local machine)

Get updated dependencies and run webpack to build static assets:
```bash
( cd frontend && yarn install )
( cd frontend && yarn run build )
```

Commit changes from the webpack build (these should be confined to `/frontend/dist/prod`) with the commit message `build`

### Deployment (stage)
* **DO NOT** commit any permanent changes to `staging`; they will be lost when the branch is reset
* Merge the branch you want to go live into `staging` with `--no-ff`
* Rebuild production assets and commit
* Deploy the code to AWS `git push deploy staging`
* Update environment variables if required by logging into the AWS Console and going to the Parameter Store in Systems Manager (https://ap-southeast-2.console.aws.amazon.com/systems-manager/parameters?region=ap-southeast-2) and updating `/staging/newage-coms`


### Deployment (production)
* Merge `staging` into `master` as a fast-forward (i.e. with `--ff`)
* Rebuild production assets and commit to `master`
* Create sendlive tag (format `sendlive/YYYY/MMDD-HHMM`)
* Deploy the code to AWS `git push deploy master`
* Update environment variables if required by logging into the AWS Console and going to the Parameter Store in Systems Manager (https://ap-southeast-2.console.aws.amazon.com/systems-manager/parameters?region=ap-southeast-2) and updating `/production/newage-coms`

* Once changes have been sent live
 * Validate that site still loads and DB is ok (log in)

 * Rebase existing working branches off `master` (`git mass-rebase` in `alliancetools` can automate this)
 * Recreate `staging` branch with previous branches
  * - Run `git diff origin/staging staging` first to confirm that you haven't missed any commits


### Deployment Notes
* When pushing to the `deploy` remote, it will return immediately without any indication of success or failure of the deployment
* To check the status of deployments, log in to the AWS Console and go to Deployments in Code Deploy (https://ap-southeast-2.console.aws.amazon.com/codesuite/codedeploy/deployments?region=ap-southeast-2)
