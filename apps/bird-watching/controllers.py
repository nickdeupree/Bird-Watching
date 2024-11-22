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

from py4web import action, request, abort, redirect, URL
from yatl.helpers import A
from .common import db, session, T, cache, auth, logger, authenticated, unauthenticated, flash
from py4web.utils.url_signer import URLSigner
from .models import get_user_email

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
    )   

@action('location')
@action.uses('location.html', db, auth)
def location():
    return dict()

@action('stats')
@action.uses('stats.html', db, auth)
def stats():
    return dict()

@action('checklist')
@action.uses('checklist.html', db, auth)
def checklist():
    return dict()

# @action('checklist')
# @action.uses('checklist.html', db, auth, url_signer)
# def checklist():
#     return dict(
#         # COMPLETE: return here any signed URLs you need.
#         my_callback_url = URL('my_callback', signer=url_signer),
#     )

@action('load_species_url')
@action.uses(db, auth.user) # Add here things like db, auth, etc.
def load_species():
    species = db(db.species).select()
    return dict(species=species)

@action('find_locations_in_range_url', method=["POST"])
@action.uses(db, auth.user)
def find_locations_in_rectangle():
    points = request.data.get("points")  # For now, hardcoded to be 4 points

    if not points or len(points) != 4:
        return dict(error="Need 4 points to define a rectangle")

    lats = [p[0] for p in points]
    lngs = [p[1] for p in points]
    min_lat, max_lat = min(lats), max(lats)
    min_lng, max_lng = min(lngs), max(lngs)

    checklists = db(
        (db.checklist.lat >= min_lat) & 
        (db.checklist.lat <= max_lat) & 
        (db.checklist.long >= min_lng) & 
        (db.checklist.long <= max_lng)
    ).select()

    return dict(checklists=checklists.as_list())
