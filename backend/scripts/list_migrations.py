import os
import sys
from pathlib import Path

# ensure working dir is project backend
BASE = Path(__file__).resolve().parent.parent
os.chdir(BASE)

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
import django
django.setup()

from django.db.migrations.recorder import MigrationRecorder

records = MigrationRecorder.Migration.objects.filter(app__in=['authentication','users']).order_by('applied')
if not records:
    print('No recorded migrations for authentication or users')
    sys.exit(0)

for r in records:
    print(f"{r.applied.isoformat()} | {r.app} | {r.name}")
