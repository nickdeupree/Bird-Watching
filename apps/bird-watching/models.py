"""
This file defines the database models
"""

import datetime
from .common import db, Field, auth
from pydal.validators import *


def get_user_email():
    return auth.current_user.get('email') if auth.current_user else None

def get_time():
    return datetime.datetime.utcnow()


### Define your table below
#
# db.define_table('thing', Field('name'))
#
## always commit your models to avoid problems later
db.define_table('species',
    Field('name', 'string', unique=True, requires=IS_NOT_EMPTY())
)

db.define_table('sightings',
    Field('species_id', 'reference species', requires=IS_NOT_EMPTY()),
    Field('event_id', 'reference checklist', requires=IS_NOT_EMPTY()),
    Field('observation_count', 'integer', default=1)
)

db.define_table('checklist',
   Field('event_id', 'reference sightings', requires=IS_NOT_EMPTY()),
   Field('lat', requires=IS_NOT_EMPTY()),
   Field('long', requires=IS_NOT_EMPTY()),
   Field('date', default=get_time()),
   Field('time', default=get_time()),
   Field('obs_id', requires=IS_NOT_EMPTY()),
   Field('duration', requires=IS_NOT_EMPTY()),
)

db.commit()
