import os
import django
import sys

sys.path.append(r'c:\Users\ROHITH KUMAR\OneDrive\Desktop\Rent\Rennto\rentt\rennto\hms\backend\BMS')
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'BMS.settings')
django.setup()

from BMS.HAC.models import Owners

owners = Owners.objects.all()
for o in owners:
    print(f"ID: {o.id}, Name: {o.name}, Phone: '{o.phone}'")

print("Checking 6304192151:", Owners.objects.filter(phone='6304192151').exists())
print("Checking 9491224543:", Owners.objects.filter(phone='9491224543').exists())
