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

db.define_table('sighting',
    Field('user_email', default=get_user_email),
    Field('species_id', 'string', requires=IS_NOT_EMPTY()),
    Field('location_id', 'string'),
    Field('count', 'integer', default=1),
    Field('sighting_time', 'datetime', default=get_time),                
)

db.define_table('checklist',
   Field('event_id', requires=IS_NOT_EMPTY()),
   Field('lat', requires=IS_NOT_EMPTY()),
   Field('long', requires=IS_NOT_EMPTY()),
   Field('date', default=get_time()),
   Field('time', default=get_time()),
   Field('obs_id', requires=IS_NOT_EMPTY()),
   Field('duration', requires=IS_NOT_EMPTY()),
)

db.commit()
