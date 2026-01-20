from django.db.models.signals import pre_save
from django.dispatch import receiver
from django.utils import timezone
from .models import Proyecto, HistorialEstado

@receiver(pre_save, sender=Proyecto)
def transition_on_signature(sender, instance, **kwargs):
    """
    Automated transitions based on field changes.
    1. Si firma_presidente cambia a True, estado -> 'aprobado'.
    """
    if not instance.pk:
        return  # Es creación, no update

    try:
        old_instance = Proyecto.objects.get(pk=instance.pk)
    except Proyecto.DoesNotExist:
        return

    # Check Firma Presidente change
    if instance.firma_presidente and not old_instance.firma_presidente:
        # Solo actuar si no está ya en un estado avanzado?
        # Asumimos flujo simple: si firma, se aprueba.
        if instance.estado in ['borrador', 'revision_interna', 'revision_cpa', 'observaciones']:
            instance.estado = 'aprobado'
            if not instance.fecha_firma_presidente:
                instance.fecha_firma_presidente = timezone.now()
            
            # Registrar en historial (Opcional, pero bueno)
            # Nota: crear historial en pre_save es riesgoso si save falla, 
            # pero aceptable para MVP. Mejor en post_save si requerimos ID, 
            # pero aqui modificamos 'instance.estado' antes de guardar.
            
            # Dejaremos que el cambio de estado se guarde, 
            # el historial lo podriamos crear en post_save si detectamos cambio.
