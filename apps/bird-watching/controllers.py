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
    return dict(
        add_to_checklist_url = URL('add_to_checklist')
    )

@action('load_species_url')
@action.uses(db, auth.user) # Add here things like db, auth, etc.
def load_species():
    species = db(db.species).select()
    return dict(species=species)

@action('load_checklist_url')
@action.uses(db, auth.user)
def load_checklist():
    checklist = db(db.checklist).select().as_list()
    return dict(checklist=checklist)

@action('load_sightings_url')
@action.uses(db, auth.user)
def load_sightings(idx):
    sightings = db(db.sightings.event_id == idx).select().as_list()
    return dict(event_id=idx, sightings=sightings)

@action('add_to_checklist')
@action.uses(db, auth.user)
def add_to_checklist():
    return