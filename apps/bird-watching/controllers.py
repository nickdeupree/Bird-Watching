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
from .models import get_user_email, get_time
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
    )

@action('stats')
@action.uses('stats.html', db, auth.user)
def stats():
    return dict()

@action('checklist')
@action.uses('checklist.html', db, auth.user)
def checklist():
    return dict(
        load_sightings_url = URL('load_sightings_url'),
        index_url = URL('index'),
        add_to_sightings_url = URL('add_to_sightings'),
        update_quantity_url = URL('update_quantity'),
        remove_species_url = URL('remove_species'),
    )

@action('my_checklists')
@action('my_checklists/<path:path>', method=['POST', 'GET'])
@action.uses('my_checklists.html', db, session, auth.user)
def my_checklists(path=None):
    grid = Grid(
        path, query=db.checklist.id > 0,
        search_queries=None, 
        search_form=None, editable=False, deletable=True, details=False, create=False,
        grid_class_style=GridClassStyleBulma, formstyle=FormStyleBulma,
    )
    return dict(
        grid=grid,
        load_sightings_url = URL('load_sightings_url'),
        index_url = URL('index'),
        add_to_sightings_url = URL('add_to_sightings'),
        update_quantity_url = URL('update_quantity'),
        remove_species_url = URL('remove_species'),
    )

@action('load_species_url')
@action.uses(db, auth.user)
def load_species():
    all_species = db(db.species).select().as_list()
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

    return dict(all_species=all_species, species=species_info)

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
        
# use py4web grid functionality to load checklists
@action('load_checklist_url')
@action.uses(db, auth.user)
def load_checklist():
    # add user email check
    checklist = db(db.checklist).select().as_list()
    return dict(checklist=checklist)

@action('load_sightings_url', method=["GET"])
@action.uses(db, auth.user)
def load_sightings():
    point = db(db.user_point).select(db.user_point.lat, db.user_point.lng).first()
    lat = point.lat
    long = point.lng
    user_email = get_user_email()
    existingChecklist = db(db.checklist.LATITUDE == lat
        and db.checklist.LONGITUDE == long
        and db.checklist.USER_EMAIL == user_email).select().first()
    event_id = None
    if existingChecklist:
        event_id = existingChecklist.SAMPLING_EVENT_IDENTIFIER
    else:
        id = db.checklist.insert(SAMPLING_EVENT_IDENTIFIER="placeholder", LATITUDE=lat, 
            LONGITUDE=long, USER_EMAIL=user_email)
        db(db.checklist.LATITUDE == lat and db.checklist.LONGITUDE == long).update(SAMPLING_EVENT_IDENTIFIER=str(id))
        event_id = str(id)
    sightings = db(db.sightings.SAMPLING_EVENT_IDENTIFIER == event_id).select().as_list()
    # S80376372
    print(sightings)
    return dict(event_id=event_id, sightings=sightings)

@action('add_to_sightings', method=["POST"])
@action.uses(db, auth.user)
def add_to_sightings():
    return

@action('update_quantity', method=["POST"])
@action.uses(db, auth.user)
def update_quantity():
    return

@action('remove_species', method=["POST"])
@action.uses(db, auth.user)
def remove_species():
    return


@action('load_user_stats', method=["GET"])
@action.uses(db, auth.user)
def load_user_stats():
    user_email = get_user_email()
    user_stats = db(
    (db.checklist.USER_EMAIL == user_email) & 
    (db.checklist.SAMPLING_EVENT_IDENTIFIER == db.sightings.SAMPLING_EVENT_IDENTIFIER) & 
    (db.sightings.species_id == db.species.id)).select(
        db.species.COMMON_NAME,  # assuming `common_name` is the field for species name in `species` table
        db.checklist.OBSERVATION_DATE,
        db.checklist.TIME_OBSERVATIONS_STARTED,
        orderby=db.checklist.OBSERVATION_DATE
    )
    for row in user_stats:
        print(f"Species: {row.species.common_name}, Date: {row.checklist.OBSERVATION_DATE}, Time: {row.checklist.TIME_OBSERVATIONS_STARTED}")
    return dict(user_email=user_email, user_stats=user_stats)

