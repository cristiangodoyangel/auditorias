import os
import django
import sys

# Setup Django environment
sys.path.append(os.path.join(os.getcwd(), 'backend'))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'auditoriapp.settings')
django.setup()

from usuarios.models import CustomUser
from periodos.models import Periodo

def check_last_period():
    username = 'juancalama'
    try:
        user = CustomUser.objects.get(username=username)
        print(f"User: {user.username}, Rol: {user.rol}, Comunidad: {user.comunidad}")
    except CustomUser.DoesNotExist:
        print("User not found")
        return

    print("\nLast 5 Periods created:")
    periodos = Periodo.objects.all().order_by('-id')[:5]
    for p in periodos:
        print(f"ID: {p.id}, Name: {p.nombre}, Start: {p.fecha_inicio}, End: {p.fecha_fin}, Community: {p.comunidad}")

if __name__ == '__main__':
    check_last_period()
