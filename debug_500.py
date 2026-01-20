import os
import django
import sys

# Setup Django environment
sys.path.append(os.path.join(os.getcwd(), 'backend'))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'auditoriapp.settings')
django.setup()

from periodos.models import Periodo
from periodos.serializers import PeriodoSerializer

def debug_serializer():
    print("Fetching first period...")
    periodo = Periodo.objects.first()
    if not periodo:
        print("No periods found.")
        return

    print(f"Period found: {periodo.nombre}")
    
    print("Attempting to serialize...")
    try:
        serializer = PeriodoSerializer(periodo)
        print("Serialized data:", serializer.data)
    except Exception as e:
        print("CRITICAL ERROR during serialization:")
        import traceback
        traceback.print_exc()

if __name__ == '__main__':
    debug_serializer()
