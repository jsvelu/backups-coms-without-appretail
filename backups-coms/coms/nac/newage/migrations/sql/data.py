from allianceutils.migrations import migrate_create_group
from allianceutils.migrations import migrate_run_sql_file

import newage.models


def insert_postcode(_, schema_editor):
    migrate_run_sql_file(schema_editor, 'newage', '0001_postcode')


def insert_state(_, schema_editor):
    migrate_run_sql_file(schema_editor, 'newage', '0001_state')


def insert_suburb(_, schema_editor):
    migrate_run_sql_file(schema_editor, 'newage', '0001_suburb')


def insert_newage_groups(_, schema_editor):
    migrate_create_group(schema_editor, (
        (newage.models.GROUP_NATIONAL_SALES, 'National Sales Manager'),
    ))
