from django.db import models

ESTADO_CHOICES = [
    ('borrador', 'Borrador'),
    ('revision_interna', 'En Revisión Interna'),
    ('revision_cpa', 'En Revisión CPA'),
    ('observaciones', 'Con Observaciones'),
    ('aprobado', 'Aprobado'),
    ('ejecucion', 'En Ejecución'),
    ('cierre', 'Cierre'),
]

class Proyecto(models.Model):
    comunidad = models.ForeignKey('comunidades.Comunidad', on_delete=models.CASCADE)
    periodo = models.ForeignKey('periodos.Periodo', on_delete=models.CASCADE)
    nombre = models.CharField(max_length=255)
    descripcion = models.TextField(default='') 
    fecha_inicio = models.DateField(null=True, blank=True) 
    fecha_fin = models.DateField(null=True, blank=True)
    presupuesto_total = models.DecimalField(max_digits=12, decimal_places=2, default=0) 
    
    estado = models.CharField(max_length=50, choices=ESTADO_CHOICES, default='borrador')
    total_rendido = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    estado_rendicion = models.CharField(max_length=50, default='Pendiente')
    
    # --- FORMULACIÓN Y GOBERNANZA (Paso 3) ---
    # Ficha de Proyecto
    objetivos = models.TextField(help_text="Objetivos principales del proyecto", blank=True, default='')
    justificacion = models.TextField(help_text="Por qué es necesario este proyecto", blank=True, default='')
    beneficiarios_estimados = models.PositiveIntegerField(help_text="Número de personas beneficiadas", default=0)

    # Gobernanza (Validación Asamblea)
    quorum_asamblea = models.PositiveIntegerField(help_text="Número de asistentes en el Acta", default=0)
    
    # Firma del Presidente (Representante Legal)
    firma_presidente = models.BooleanField(default=False, help_text="Aprobación digital simple del Presidente")
    fecha_firma_presidente = models.DateTimeField(null=True, blank=True)

    # --- ARCHIVOS (Ahora vía Documentos/Upload First) ---
    # Se eliminan los FileField directos (acta, cotizaciones, elegido)
    # y se accede a través de la relación inversa 'documento_set' o métodos helper.

    def __str__(self):
        return self.nombre

class HistorialEstado(models.Model):
    proyecto = models.ForeignKey(Proyecto, on_delete=models.CASCADE, related_name='historial')
    estado_anterior = models.CharField(max_length=50, choices=ESTADO_CHOICES, null=True, blank=True)
    estado_nuevo = models.CharField(max_length=50, choices=ESTADO_CHOICES)
    usuario = models.ForeignKey('usuarios.CustomUser', on_delete=models.SET_NULL, null=True)
    fecha = models.DateTimeField(auto_now_add=True)
    comentario = models.TextField(blank=True)

    def __str__(self):
        return f"{self.proyecto.nombre}: {self.estado_anterior} -> {self.estado_nuevo}"



# --- AVANCE FÍSICO (Paso 5) ---
class ReporteAvance(models.Model):
    proyecto = models.ForeignKey(Proyecto, on_delete=models.CASCADE, related_name='reportes_avance')
    autor = models.ForeignKey('usuarios.CustomUser', on_delete=models.SET_NULL, null=True)
    fecha_reporte = models.DateField(auto_now_add=True)
    
    porcentaje_avance = models.PositiveIntegerField(help_text="Porcentaje de avance físico (0-100)")
    observaciones = models.TextField()
    foto_avance = models.ImageField(upload_to='avances/', null=True, blank=True)

    def __str__(self):
        return f"Avance {self.porcentaje_avance}% - {self.proyecto.nombre}"