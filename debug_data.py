import os
import django
import sys

# Setup Django environment
sys.path.append(os.path.join(os.getcwd(), 'backend'))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'auditoriapp.settings')
django.setup()

from usuarios.models import CustomUser
from proyectos.models import Proyecto
from periodos.models import Periodo
from comunidades.models import Comunidad

def audit_data():
    username = 'juancalama'
    try:
        user = CustomUser.objects.get(username=username)
        print(f"User found: {user.username}, Comunidad: {user.comunidad}")
    except CustomUser.DoesNotExist:
        print(f"User {username} not found. Listing all users with communities:")
        for u in CustomUser.objects.filter(comunidad__isnull=False):
            print(f"- {u.username}: {u.comunidad}")
        return

    if not user.comunidad:
        print("User has no comunidad.")
        return

    comunidad = user.comunidad
    print(f"\nAudit for Comunidad: {comunidad.nombre} (ID: {comunidad.id})")

    # Check Periods directly linked
    periodos_direct = Periodo.objects.filter(comunidad=comunidad)
    print(f"\nPeriods directly linked to community: {periodos_direct.count()}")
    for p in periodos_direct:
        print(f"- ID: {p.id}, Name: {p.nombre}, Active: {p.activo}")

    # Check Projects and their periods
    proyectos = Proyecto.objects.filter(comunidad=comunidad)
    print(f"\nProjects in community: {proyectos.count()}")
    
    linked_period_ids = set()
    for p in proyectos:
        pe = p.periodo
        linked_period_ids.add(pe.id)
        print(f"- Project: {p.nombre} (ID: {p.id}) -> Period: {pe.nombre} (ID: {pe.id}), Period's Community ID: {pe.comunidad.id if pe.comunidad else 'None'}")

    print(f"\nUnique Period IDs used by projects: {linked_period_ids}")
    
    # Check if these periods are in the direct list
    direct_ids = set(periodos_direct.values_list('id', flat=True))
    missing = linked_period_ids - direct_ids
    
    if missing:
        print(f"\nCRITICAL: The following Period IDs are used by projects but NOT linked to the community correctly: {missing}")
        for pid in missing:
            periodo = Periodo.objects.get(id=pid)
            print(f"Fixing Period {pid} ({periodo.nombre})... Setting community to {comunidad.nombre}")
            # Identify if we should auto-fix? For now just identifying.
            # periodo.comunidad = comunidad
            # periodo.save()
    else:
        print("\nAll periods used by projects are correctly linked to the community.")

if __name__ == '__main__':
    audit_data()
