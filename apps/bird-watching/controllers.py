"""
This file defines actions, i.e. functions the URLs are mapped into
The @action(path) decorator exposed the function at URL:

    http://127.0.0.1:8000/{app_name}/{path}

If app_name == '_default' then simply

    http://127.0.0.1:8000/{path}

If path == 'index' it can be omitted:

    http://127.0.0.1:8000/

The path follows the bottlepy syntax.

@action.uses('generic.html')  indicates that the action uses the generic.html template
@action.uses(session)         indicates that the action uses the session
@action.uses(db)              indicates that the action uses the db
@action.uses(T)               indicates that the action uses the i18n & pluralization
@action.uses(auth.user)       indicates that the action requires a logged in user
@action.uses(auth)            indicates that the action requires the auth object

session, db, T, auth, and tempates are examples of Fixtures.
Warning: Fixtures MUST be declared with @action.uses({fixtures}) else your app will result in undefined behavior
"""

import json
from py4web import action, request, abort, redirect, URL
from yatl.helpers import A
from .common import db, session, T, cache, auth, logger, authenticated, unauthenticated, flash
from py4web.utils.url_signer import URLSigner
from .models import get_user_email, get_time, get_current_time
from datetime import time
from py4web.utils.form import Form, FormStyleBulma, TextareaWidget
from pydal import Field
from pydal.validators import *
from py4web.utils.grid import Grid, GridClassStyleBulma

url_signer = URLSigner(session)

@action('index')
@action.uses('index.html', db, auth.user, url_signer)
def index():
    return dict(
        # COMPLETE: return here any signed URLs you need.
        load_species_url = URL('load_species_url', signer=url_signer),
        find_locations_in_range_url = URL('find_locations_in_range', signer=url_signer),
        location_url = URL('location'),
        stats_url = URL('stats'),
        checklist_url = URL('checklist'),
        my_checklists_url = URL('my_checklists'),
        save_user_polygon_url = URL('save_user_polygon', signer=url_signer),
        save_user_point_url = URL('save_user_point')
    )   

@action('location')
@action.uses('location.html', db, auth.user)
def location():
    return dict(
        load_user_polygon_url = URL('load_user_polygon', signer=url_signer),
        find_locations_in_range_url = URL('find_locations_in_range', signer=url_signer),
        get_sightings_for_checklist_url = URL('get_sightings_for_checklist', signer=url_signer),
        get_species_sightings_over_time_url = URL('get_species_sightings_over_time', signer=url_signer),
        get_top_contributors_url = URL('get_top_contributors', signer=url_signer),
        index_url = URL('index')
    )

@action('stats')
@action.uses('stats.html', db, auth.user)
def stats():
    return dict(
        load_user_stats_url = URL('load_user_stats')
    )

@action('checklist')
@action.uses('checklist.html', db, auth.user)
def checklist():
    return dict(
        load_sightings_url = URL('load_sightings_url'),
        index_url = URL('index'),
        my_checklists_url = URL('my_checklists'),
        add_to_sightings_url = URL('add_to_sightings'),
        update_quantity_url = URL('update_quantity'),
        remove_species_url = URL('remove_species'),
        save_checklist_url = URL('save_checklist')
    )

@action('view_checklist')
@action.uses('view_checklist.html', db, auth.user)
def view_checklist():
    return dict(
        load_sightings_url = URL('load_sightings_url'),
        index_url = URL('index'),
        my_checklists_url = URL('my_checklists'),
        add_to_sightings_url = URL('add_to_sightings'),
        update_quantity_url = URL('update_quantity'),
        remove_species_url = URL('remove_species'),
        save_checklist_url = URL('save_checklist')
    )

@action('my_checklists')
@action('my_checklists/<path:path>', method=['POST', 'GET'])
@action.uses('my_checklists.html', db, session, auth.user)
def my_checklists(path=None):
    GridClassStyleBulma
    columns = [
        db.checklist.LATITUDE,
        db.checklist.LONGITUDE,
        db.checklist.OBSERVER_ID,
        db.checklist.OBSERVATION_DATE,
        db.checklist.TIME_OBSERVATIONS_STARTED,
        db.checklist.DURATION_MINUTES
    ]
    
    headings = [
        'Latitude', 
        'Longitude',
        'Observer ID',
        'Observation Date',
        'Time Observations Started',
        'Duration Minutes',
        'Actions'  
    ]
    
    grid = Grid(
        path, query=(db.checklist.id > 0) & (db.checklist.USER_EMAIL == get_user_email()),
        search_queries=None, 
        search_form=None, editable=False, deletable=False, details=False, create=False,
        orderby=~db.checklist.id, grid_class_style=GridClassStyleBulma(), formstyle=FormStyleBulma,
        columns=columns, headings=headings, post_action_buttons=[GridViewButton(), GridUpdateCenterButton(), GridEditButton(), GridDeleteButton()]
    )

    return dict(
        grid=grid,
        index_url=URL('index')
    )

class GridUpdateCenterButton(object):
    """To update center with latitude and longitude."""
    def __init__(self):
        self.url = URL('update_center')  
        self.append_id = True  
        self.additional_classes = 'button is-small is-responsive is-warning m-1'
        self.icon = 'fa-map'  
        self.text = 'View on map'
        self.message = None
        self.onclick = None  

class GridViewButton(object):
    """This is the edit button for the grid."""
    def __init__(self):
        self.url = URL('view_selected_checklist')
        self.append_id = True 
        self.additional_classes = 'button is-small is-responsive is-primary m-1'
        self.icon = 'fa-list-ul'
        self.text = 'View'
        self.message = None
        self.onclick = None # Used for things like confirmation.

class GridEditButton(object):
    """This is the edit button for the grid."""
    def __init__(self):
        self.url = URL('edit_selected_checklist')
        self.append_id = True # append the ID to the edit.
        self.additional_classes = 'button is-small is-responsive is-info m-1'
        self.icon = 'fa-pencil'
        self.text = 'Edit'
        self.message = None
        self.onclick = None # Used for things like confirmation.

class GridDeleteButton(object):
    """This is the edit button for the grid."""
    def __init__(self):
        self.url = URL('delete_selected_checklist')
        self.append_id = True # append the ID to the edit.
        self.additional_classes = 'button is-small is-responsive is-danger m-1'
        self.icon = 'fa-trash'
        self.text = 'Delete'
        self.message = None
        self.onclick = None # Used for things like confirmation.

@action('update_center/<checklist_id:int>')
@action.uses(db, auth.user)
def update_center(checklist_id):
    user_email = get_user_email()
    if not user_email:
        return "User not logged in"
    
    checklist = db(db.checklist.id == checklist_id).select().first()
    if not checklist or checklist.USER_EMAIL != user_email:
        return "Checklist not found or not authorized"
    
    db(db.center.user_email == user_email).delete()

    db.center.insert(
        user_email=user_email,
        LATITUDE=checklist.LATITUDE,
        LONGITUDE=checklist.LONGITUDE
    )
    return redirect(URL('index'))

@action('edit_selected_checklist/<checklist_id:int>')
@action.uses('edit_selected_checklist', db, auth.user)
def edit_selected_checklist(checklist_id=None):
    checklist = db(db.checklist.id == checklist_id).select().first()
    db(db.user_point).update(lat=checklist.LATITUDE, lng=checklist.LONGITUDE)
    redirect(URL('checklist'))

@action('view_selected_checklist/<checklist_id:int>')
@action.uses('view_selected_checklist', db, auth.user)
def view_selected_checklist(checklist_id=None):
    checklist = db(db.checklist.id == checklist_id).select().first()
    db(db.user_point).update(lat=checklist.LATITUDE, lng=checklist.LONGITUDE)
    redirect(URL('view_checklist'))

@action('delete_selected_checklist/<checklist_id:int>')
@action.uses('delete_selected_checklist', db, auth.user)
def delete_selected_checklist(checklist_id=None):
    checklist = db(db.checklist.id == checklist_id).select().first()
    event_id = checklist.SAMPLING_EVENT_IDENTIFIER
    db(db.sightings.SAMPLING_EVENT_IDENTIFIER == event_id).delete()
    db((db.checklist.SAMPLING_EVENT_IDENTIFIER == event_id) & 
       (db.checklist.id == checklist_id)).delete()
    redirect(URL('my_checklists'))

@action('load_species_url')
@action.uses(db, auth.user)
def load_species():
    all_species = db(db.species).select().as_list()
    user_email = get_user_email() 
    center = db(db.center.user_email == user_email).select().first()
    sightings_data = db(db.sightings).select(
        db.checklist.LATITUDE,                
        db.checklist.LONGITUDE,               
        db.sightings.species_id,
        db.sightings.OBSERVATION_COUNT,             
        left=[db.checklist.on(db.sightings.SAMPLING_EVENT_IDENTIFIER == db.checklist.SAMPLING_EVENT_IDENTIFIER)],
        groupby=[db.checklist.LATITUDE, db.checklist.LONGITUDE, db.sightings.species_id],
    )

    species_info = []
    for sighting in sightings_data:
        species_info.append({
            'latitude': sighting.checklist.LATITUDE, 
            'longitude': sighting.checklist.LONGITUDE,
            'species_id': sighting.sightings.species_id, 
            'observation_count': sighting.sightings.OBSERVATION_COUNT, 
        })

    return dict(all_species=all_species, species=species_info, center=center)

@action('find_locations_in_range', method=["POST"])
@action.uses(db, auth.user)
def find_locations_in_range():
    data = request.json
    params = data.get('params', {})
    min_lat = params.get('min_lat')
    max_lat = params.get('max_lat')
    min_lng = params.get('min_lng')
    max_lng = params.get('max_lng')


    if None in [min_lat, max_lat, min_lng, max_lng]:
        return dict(error="Missing required parameters")

    try:
        checklists = db(
            (db.checklist.LATITUDE >= min_lat) &
            (db.checklist.LATITUDE <= max_lat) &
            (db.checklist.LONGITUDE >= min_lng) &
            (db.checklist.LONGITUDE <= max_lng)
        ).select().as_list()

        return dict(checklists=checklists)
    except Exception as e:
        return dict(error=str(e))

@action('save_user_polygon', method=["POST"])
@action.uses(db, auth.user)
def save_user_polygon():
    coords = request.json.get("polygon_coords")
    user_email = get_user_email() 
    if user_email:
        preexisting_polygon = db(db.user_polygon.user_email == user_email).select().first()
        
        coords_json = json.dumps(coords)

        if preexisting_polygon:
            db(db.user_polygon.id == preexisting_polygon.id).update(
                polygon_coords=coords_json,
                last_updated=get_time()
            )
        else:
            db.user_polygon.insert(
                user_email=user_email,
                polygon_coords=coords_json,
                last_updated=get_time()
            )

@action('load_user_polygon', method=["GET"])
@action.uses(db, auth.user)
def load_user_polygon():
    user_email = get_user_email()
    if user_email:
        user_polygon = db(db.user_polygon.user_email == user_email).select().first()
        if user_polygon:
            return dict(polygon_coords=json.loads(user_polygon.polygon_coords))
        else:
            return dict(polygon_coords=None)
    else:
        return dict(polygon_coords=None)
    
@action('get_sightings_for_checklist', method=["POST"])
@action.uses(db, auth.user)
def get_sightings_for_checklist():
    data = request.json
    identifiers = data.get('identifiers', [])


    if not identifiers:
        return dict(error="Missing required parameters")

    try:
        sightings = db(
            db.sightings.SAMPLING_EVENT_IDENTIFIER.belongs(identifiers) &
            (db.sightings.species_id == db.species.id)
            ).select(
                db.sightings.ALL,
                db.species.COMMON_NAME
            ).as_list()
        
        for sighting in sightings:
            sighting['COMMON_NAME'] = sighting['species']['COMMON_NAME']
            del sighting['species']
        return dict(sightings=sightings)
    except Exception as e:
        return dict(error=str(e))

@action('get_species_sightings_over_time', method=["POST"])
@action.uses(db, auth.user)
def get_species_sightings_over_time():
    data = request.json
    species_name = data.get('species_name')

    if not species_name:
        return dict(error="Missing required parameters")

    try:
        # First get species_id
        species = db(db.species.COMMON_NAME == species_name).select().first()
        if not species:
            return dict(error="Species not found")

        rows = db(
            (db.sightings.species_id == species.id) &
            (db.sightings.SAMPLING_EVENT_IDENTIFIER == db.checklist.SAMPLING_EVENT_IDENTIFIER)
        ).select(
            db.checklist.OBSERVATION_DATE,
            db.sightings.OBSERVATION_COUNT.sum().with_alias('total_count'),
            groupby=db.checklist.OBSERVATION_DATE,
            orderby=db.checklist.OBSERVATION_DATE
        )

        data = [{'date': row.checklist.OBSERVATION_DATE, 'count': row.total_count} for row in rows]
        return dict(data=data)
    except Exception as e:
        print(f"Error querying database: {e}")
        return dict(error=str(e))
    
@action('get_top_contributors', method=["POST"])
@action.uses(db, auth.user)
def get_top_contributors():
    data = request.json
    min_lat = data.get('min_lat')
    max_lat = data.get('max_lat')
    min_lng = data.get('min_lng')
    max_lng = data.get('max_lng')

    if None in [min_lat, max_lat, min_lng, max_lng]:
        return dict(error="Missing required parameters")

    try:
        # Get checklists in region and count by observer
        contributors = db(
            (db.checklist.LATITUDE >= min_lat) &
            (db.checklist.LATITUDE <= max_lat) &
            (db.checklist.LONGITUDE >= min_lng) &
            (db.checklist.LONGITUDE <= max_lng)
        ).select(
            db.checklist.OBSERVER_ID,
            db.checklist.id.count().with_alias('checklist_count'),
            groupby=db.checklist.OBSERVER_ID,
            orderby=~db.checklist.id.count(),
            limitby=(0, 10)  # Get top 10 contributors
        )

        return dict(contributors=[
            {'observer_id': c.checklist.OBSERVER_ID, 
             'count': c.checklist_count} 
            for c in contributors
        ])
    except Exception as e:
        return dict(error=str(e))

@action('save_user_point', method=["POST"])
@action.uses(db, auth.user)
def save_user_point():
    lat = request.json.get("lat")
    lng = request.json.get("lng")
    user_email = get_user_email() 
    if user_email:
        preexisting_polygon = db(db.user_point.user_email == user_email).select().first()
        
        if preexisting_polygon:
            db(db.user_point.id == preexisting_polygon.id).update(
                lat = lat,
                lng = lng,
                last_updated=get_time()
            )
        else:
            db.user_point.insert(
                user_email=user_email,
                lat=lat,
                lng=lng,
                last_updated=get_time()
            )            

@action('load_sightings_url', method=["GET"])
@action.uses(db, auth.user)
def load_sightings():
    point = db(db.user_point).select(db.user_point.lat, db.user_point.lng).first()
    lat = point.lat
    long = point.lng
    user_email = get_user_email()
    existingChecklist = db((db.checklist.LATITUDE == lat)
        & (db.checklist.LONGITUDE == long)
        & (db.checklist.USER_EMAIL == user_email)).select().first()
    event_id = user_email
    obs_date = ""
    obs_time = ""
    obs_dur = ""
    if existingChecklist:
        event_id = existingChecklist.SAMPLING_EVENT_IDENTIFIER
        obs_date = db(db.checklist.SAMPLING_EVENT_IDENTIFIER == event_id).select(db.checklist.OBSERVATION_DATE).first().OBSERVATION_DATE
        obs_time = db(db.checklist.SAMPLING_EVENT_IDENTIFIER == event_id).select(db.checklist.TIME_OBSERVATIONS_STARTED).first().TIME_OBSERVATIONS_STARTED
        obs_dur = db(db.checklist.SAMPLING_EVENT_IDENTIFIER == event_id).select(db.checklist.DURATION_MINUTES).first().DURATION_MINUTES
    sightings = db(db.sightings.SAMPLING_EVENT_IDENTIFIER == event_id).select().as_list()
    for sighting in sightings:
        species_record = db(db.species.id == sighting['species_id']).select(db.species.COMMON_NAME).first()
        if species_record:
            sighting['species_name'] = species_record.COMMON_NAME
    all_species = db(db.species).select().as_list()
    return dict(event_id=event_id, obs_date=obs_date, obs_time=obs_time, obs_dur=obs_dur, 
                sightings=reversed(sightings), all_species=all_species)

@action('add_to_sightings', method=["POST"])
@action.uses(db, auth.user)
def add_to_sightings():
    event_id = request.json.get("event_id")
    species_name = request.json.get("species_name")
    quantity = request.json.get("quantity")
    species_id = db(db.species.COMMON_NAME == species_name).select(db.species.id).first()
    if species_id:
        species_id = species_id.id
    else:
        species_id = db.species.insert(COMMON_NAME=species_name)
    id = None
    if event_id:
        existing_sighting = db((db.sightings.SAMPLING_EVENT_IDENTIFIER == event_id) & (db.sightings.species_id == species_id)).select().first()
        if existing_sighting:
            id = db(db.sightings.id == existing_sighting.id).select().first().id
            db(db.sightings.id == existing_sighting.id).update(OBSERVATION_COUNT=quantity)
        else:
            id = db.sightings.insert(SAMPLING_EVENT_IDENTIFIER=event_id, species_id=species_id, OBSERVATION_COUNT=quantity)
    return dict(id=id, species_id=species_id)

@action('update_quantity', method=["POST"])
@action.uses(db, auth.user)
def update_quantity():
    event_id = request.json.get("event_id")
    species_id = request.json.get("species_id")
    quantity = request.json.get("quantity")
    db((db.sightings.species_id == species_id) & 
       (db.sightings.SAMPLING_EVENT_IDENTIFIER == event_id)).update(OBSERVATION_COUNT=quantity)
    return "ok"

@action('remove_species', method=["POST"])
@action.uses(db, auth.user)
def remove_species():
    event_id = request.json.get('event_id')
    id = request.json.get('species_id')
    db((db.sightings.species_id == id) & 
       (db.sightings.SAMPLING_EVENT_IDENTIFIER == event_id)).delete()
    return "ok"

@action('save_checklist', method=["POST"])
@action.uses(db, auth.user)
def save_checklist():
    event_id = request.json.get('event_id')
    email = get_user_email()    
    if event_id == email:
        point = db(db.user_point).select(db.user_point.lat, db.user_point.lng).first()
        lat = point.lat
        long = point.lng
        id = db.checklist.insert(SAMPLING_EVENT_IDENTIFIER=email, LATITUDE=lat, 
            LONGITUDE=long, USER_EMAIL=email, OBSERVER_ID=email)
        db((db.checklist.LATITUDE == lat) & (db.checklist.LONGITUDE == long)).update(SAMPLING_EVENT_IDENTIFIER=str(id))
        event_id = str(id)
    db(db.sightings.SAMPLING_EVENT_IDENTIFIER == email).update(SAMPLING_EVENT_IDENTIFIER=event_id)
    observation_date = request.json.get('observation_date')
    time_observations_started = request.json.get('observation_time')
    duration_minutes = request.json.get('duration')
    db((db.checklist.SAMPLING_EVENT_IDENTIFIER == event_id)).update(OBSERVATION_DATE=observation_date, 
        TIME_OBSERVATIONS_STARTED=time_observations_started, DURATION_MINUTES=duration_minutes)
    return "ok"

@action('load_user_stats', method=["GET"])
@action.uses(db, auth.user)
def load_user_stats():
    user_email = get_user_email()
    species_seen = db(
        (db.checklist.USER_EMAIL == user_email) & 
        (db.checklist.SAMPLING_EVENT_IDENTIFIER == db.sightings.SAMPLING_EVENT_IDENTIFIER) & 
        (db.sightings.species_id == db.species.id)
    ).select(
        db.species.COMMON_NAME,
        distinct=True,  # Ensure the results are unique by species
        orderby=db.species.COMMON_NAME  # Ordering by species name (optional)
    ).as_list()
    distinct_species = len(species_seen)

    total_species = db(
        (db.checklist.USER_EMAIL == user_email) & 
        (db.checklist.SAMPLING_EVENT_IDENTIFIER == db.sightings.SAMPLING_EVENT_IDENTIFIER) & 
        (db.sightings.species_id == db.species.id)
    ).select(
        db.species.COMMON_NAME,
        db.sightings.OBSERVATION_COUNT.sum(),
        groupby=db.species.COMMON_NAME,
        # having=(db.checklist.USER_EMAIL == user_email)
    ).as_list()

    for species in total_species:
        species['total_observations'] = species['_extra'][f'SUM("sightings"."OBSERVATION_COUNT")']
        del species['_extra']  # Remove the _extra field

    sighting_stats = db(
    (db.checklist.USER_EMAIL == user_email) & 
    (db.checklist.SAMPLING_EVENT_IDENTIFIER == db.sightings.SAMPLING_EVENT_IDENTIFIER) & 
    (db.sightings.species_id == db.species.id)).select(
        db.species.COMMON_NAME,
        db.checklist.OBSERVATION_DATE,
        db.checklist.TIME_OBSERVATIONS_STARTED,
        db.sightings.OBSERVATION_COUNT,
        orderby=db.checklist.OBSERVATION_DATE
    ).as_list()

    total_birds = db(
        (db.checklist.USER_EMAIL == get_user_email()) & 
        (db.checklist.SAMPLING_EVENT_IDENTIFIER == db.sightings.SAMPLING_EVENT_IDENTIFIER)
    ).select(db.sightings.OBSERVATION_COUNT.sum()).first()
    observation_count = total_birds['_extra']['SUM("sightings"."OBSERVATION_COUNT")']
    total_birds_count = observation_count if observation_count is not None else 0

    distinct_locations = db(
        db.checklist.USER_EMAIL == get_user_email()
    ).select(
        db.checklist.LATITUDE, db.checklist.LONGITUDE, distinct=True
    )
    distinct_location_count = len(distinct_locations)

        
    # print(f"length of user stats is {len(user_stats)}")
    # for row in user_stats:
    #     print(f"Species: {row.species.common_name}, Date: {row.checklist.OBSERVATION_DATE}, Time: {row.checklist.TIME_OBSERVATIONS_STARTED}")
    return dict(
        user_email=user_email, 
        species_list=species_seen, 
        total_species=total_species, # not used yet
        sighting_stats=sighting_stats,
        total_birds=total_birds_count,
        distinct_species=distinct_species,
        distinct_locations=distinct_location_count
        )

