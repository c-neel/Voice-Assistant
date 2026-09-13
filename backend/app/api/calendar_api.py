"""
GLS NEXUS — Calendar API
"""

from fastapi import APIRouter
from app.api.reminders import cal_router

# We defined the endpoints in reminders.py for brevity, we just export the router here.
router = cal_router
