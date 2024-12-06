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

### Define your tables

db.define_table(
    'species',
    Field('COMMON_NAME', 'string', unique=True, requires=IS_NOT_EMPTY())
)

db.define_table(
    'checklist',
    Field('SAMPLING_EVENT_IDENTIFIER', 'string', unique=True, requires=IS_NOT_EMPTY()),
    Field('LATITUDE', 'double'),
    Field('LONGITUDE', 'double'),
    Field('OBSERVATION_DATE', 'date'),
    Field('TIME_OBSERVATIONS_STARTED', 'time'),
    Field('OBSERVER_ID', 'string'),
    Field('DURATION_MINUTES', 'double')
)

db.define_table(
    'sightings',
    Field('SAMPLING_EVENT_IDENTIFIER', 'string', requires=IS_NOT_EMPTY()),
    Field('species_id', 'references species', requires=IS_NOT_EMPTY()),
    Field('OBSERVATION_COUNT', 'integer')
)

db.define_table(
    'user_polygon',
    Field('user_email', 'string', default=get_user_email()), 
    Field('polygon_coords', 'json', requires=IS_NOT_EMPTY()),
    Field('last_updated', 'datetime', default=get_time()),  
)

db.define_table(
    'user_point',
    Field('user_email', 'string', default=get_user_email()), 
    Field('lat', 'double', requires=IS_NOT_EMPTY()),
    Field('lng', 'double', requires=IS_NOT_EMPTY()),
    Field('last_updated', 'datetime', default=get_time()),  
)

# Function to import CSV data manually
def populate_tables():
    uploads_dir = os.path.join(os.getcwd(), 'apps', 'bird-watching', 'uploads')
    
    ## Populate Species Table
    if db(db.species).isempty():
        species_csv_path = os.path.join(uploads_dir, 'species.csv')
        with open(species_csv_path, 'r', encoding='utf-8') as f:
            reader = csv.DictReader(f)
            for row in reader:
                common_name = row.get('COMMON_NAME', '').strip()
                if common_name:
                    db.species.insert(COMMON_NAME=common_name)
        db.commit()
        print("Species table populated successfully.")
    else:
        print("Species table already populated.")
    
    # Populate Checklist Table
    if db(db.checklist).isempty():
        checklist_csv_path = os.path.join(uploads_dir, 'checklists.csv')
        with open(checklist_csv_path, 'r', encoding='utf-8') as f:
            reader = csv.DictReader(f)
            for row in reader:
                try:
                    db.checklist.insert(
                        SAMPLING_EVENT_IDENTIFIER=row['SAMPLING EVENT IDENTIFIER'].strip(),
                        LATITUDE=float(row['LATITUDE']),
                        LONGITUDE=float(row['LONGITUDE']),
                        OBSERVATION_DATE=row['OBSERVATION DATE'].strip(),
                        TIME_OBSERVATIONS_STARTED=row['TIME OBSERVATIONS STARTED'].strip(),
                        OBSERVER_ID=row['OBSERVER ID'].strip(),
                        DURATION_MINUTES=float(row['DURATION MINUTES'])
                    )
                except Exception as e:
                    # print(f"Error inserting checklist row: {e}")
                    pass
        db.commit()
        print("Checklist table populated successfully.")
    else:
        print("Checklist table already populated.")

        # Populate Sightings Table
    if db(db.sightings).isempty():
        sightings_csv_path = os.path.join(uploads_dir, 'sightings.csv')
        with open(sightings_csv_path, 'r', encoding='utf-8') as f:
            reader = csv.DictReader(f)
            for row in reader:
                try:
                    observation_count_str = row['OBSERVATION COUNT'].strip()
                    observation_count = int(observation_count_str)
                except KeyError:
                    break  # Exit the loop or handle as needed (Error: 'OBSERVATION COUNT' column not found.)
                except ValueError:
                    observation_count = None  # Set a default value or handle the error

                db.sightings.insert(
                    SAMPLING_EVENT_IDENTIFIER=row['SAMPLING EVENT IDENTIFIER'].strip(),
                    COMMON_NAME=row['COMMON NAME'].strip(),
                    OBSERVATION_COUNT=observation_count
                )
        db.commit()
        print("Sightings table populated successfully.")
    else:
        print("Sightings table already populated.")

populate_tables()
db.commit()