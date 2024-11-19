"""
This file defines the database models
"""

import datetime
from .common import db, Field, auth
from pydal.validators import *
import csv


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

def populate_tables():
    if db(db.species).isempty():
        with open('species.csv', 'r') as f:
            reader = csv.reader(f)
            for row in reader:
                db.species.insert(name=row[0])

    if db(db.checklist).isempty():
        with open('checklist.csv', 'r') as f:
            reader = csv.reader(f)
            for row in reader:
                db.checklist.insert(
                    event_id=row[0],
                    lat=row[1],
                    long=row[2],
                    date=row[3],
                    time=row[4],
                    obs_id=row[5],
                    duration=row[6]
                )
    
    if db(db.sightings).isempty():
        with open('sightings.csv', 'r') as f:
            reader = csv.reader(f)
            for row in reader:
                species = db(db.species.name == row[1]).select().first()
                checklist = db(db.checklist.event_id == row[0]).select().first()
                if species and checklist:
                    db.sightings.insert(
                        species_id=species.id,
                        event_id=checklist.id,
                        observation_count=row[2]
                    )


# run this function to populate the tables
populate_tables()
db.commit()
