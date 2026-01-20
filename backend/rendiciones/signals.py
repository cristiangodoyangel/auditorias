
from django.db.models.signals import post_save, post_delete
from django.dispatch import receiver
from django.db.models import Sum
from .models import Rendicion

@receiver([post_save, post_delete], sender=Rendicion)
def actualizar_total_rendido_proyecto(sender, instance, **kwargs):
    """
    Actualiza el campo 'total_rendido' del Proyecto asociado
    cada vez que una Rendicion se guarda o se borra.
    """
    proyecto = instance.proyecto
    
   
    total = Rendicion.objects.filter(proyecto=proyecto).aggregate(
        total_sum=Sum('monto_rendido')
    )['total_sum']
    
    
    proyecto.total_rendido = total or 0
    
    # Logic 2: Si es la primera rendición y el proyecto está 'aprobado', pasar a 'ejecucion'
    if instance.pk and proyecto.estado == 'aprobado':
        # Verificamos si es la única rendición (acaba de crearse) o si ya tenía
        # Aunque si ya está aprobado y llega una rendición, debería pasar a ejecución igual.
        # Solo no lo hacemos si está 'borrador' (raro) o 'cierre'.
        proyecto.estado = 'ejecucion'
        # Podríamos setear fecha_inicio real si es nula?
        # if not proyecto.fecha_inicio:
        #    from django.utils import timezone
        #    proyecto.fecha_inicio = timezone.now().date()
    
    proyecto.save(update_fields=['total_rendido', 'estado'])