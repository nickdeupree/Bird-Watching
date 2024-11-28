"""
This file defines the database models
"""

import datetime
import os
from .common import db, Field, auth
from pydal.validators import *
import csv

def get_user_email():
    return auth.current_user.get('email') if auth.current_user else None

def get_time():
    return datetime.datetime.utcnow()
def get_date():
    return datetime.date.today()


### Define your table below
#
# db.define_table('thing', Field('name'))
#
## always commit your models to avoid problems later
db.define_table('species',
    Field('name', 'string', unique=True, requires=IS_NOT_EMPTY())
)

db.define_table('checklist',
   Field('event_id', 'string', requires=IS_NOT_EMPTY()),
   Field('lat', 'float', requires=IS_NOT_EMPTY()),
   Field('long', 'float', requires=IS_NOT_EMPTY()),
   Field('date', 'date', default=get_date()),
   Field('time', 'time', default=get_time()),
   Field('obs_id', 'string', requires=IS_NOT_EMPTY()),
   Field('duration', 'string', requires=IS_NOT_EMPTY()),
)

db.define_table('sightings',
    Field('species_id', 'reference species', requires=IS_IN_DB(db, 'species.id')),
    Field('event_id', 'reference checklist',requires=IS_IN_DB(db, 'checklist.event_id')),
    Field('observation_count', 'integer', default=1)
)


db.define_table('user_polygon',
    Field('user_email', 'string', unique=True, requires=IS_NOT_EMPTY()), 
    Field('polygon_coords', 'json', requires=IS_NOT_EMPTY()),
    Field('last_updated', 'datetime', default=get_time()),  
)

db.define_table('user_point',
    Field('user_email', 'string', unique=True, requires=IS_NOT_EMPTY()), 
    Field('coord', 'json', requires=IS_NOT_EMPTY()),
    Field('last_updated', 'datetime', default=get_time()),  
)


def populate_tables():
    uploads_dir = os.path.join(os.getcwd(), 'apps', 'bird-watching', 'uploads')
    
    
    if db(db.species).isempty():
        species_csv_path = os.path.join(uploads_dir, 'species.csv')
        with open(species_csv_path, 'r', newline='', encoding='utf-8') as f:
            reader = csv.reader(f)
            headers = next(reader, None) 
            for row in reader:
                if row:  
                    db.species.insert(name=row[0].strip())
        db.commit()
        print("Species table populated successfully.")
    else:
        print("Species table already populated.")
    
    if db(db.checklist).isempty():
        checklist_csv_path = os.path.join(uploads_dir, 'checklists.csv')
        with open(checklist_csv_path, 'r', newline='', encoding='utf-8') as f:
            reader = csv.reader(f)
            headers = next(reader, None) 
            for row in reader:
                if row and len(row) >= 7: 
                    db.checklist.insert(
                        event_id=(row[0].strip()),
                        lat=float(row[1].strip()),
                        long=float(row[2].strip()),
                        date=row[3].strip(),   
                        time=row[4].strip(),    
                        obs_id=(row[5].strip()),
                        duration=row[6].strip()
                    )
        db.commit()
        print("Checklist table populated successfully.")
    else:
        print("Checklist table already populated.")
    
    # Populate Sightings Table
    if db(db.sightings).isempty():
        sightings_csv_path = os.path.join(uploads_dir, 'sightings.csv')
        with open(sightings_csv_path, 'r', newline='', encoding='utf-8') as f:
            reader = csv.reader(f)
            headers = next(reader, None) 
            for row in reader:
                if row and len(row) >= 4:  
                    species_name = row[0].strip()
                    species = db(db.species.name == species_name).select().first()
                    if species:
                        db.sightings.insert(
                            species_id=species.id,
                            location=row[1].strip(),
                            observer=row[2].strip(),
                            observed_on=row[3].strip()  
                        )
                    else:
                        print(f"Species '{species_name}' not found. Skipping sighting.")
        db.commit()
        print("Sightings table populated successfully.")
    else:
        print("Sightings table already populated.")

populate_tables()

#print the tables first rows
# print(db(db.species).select().first())
# print(db(db.checklist).select().first())

db.commit()