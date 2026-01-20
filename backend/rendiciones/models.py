from django.db import models

class Rendicion(models.Model):
    ESTADO_RENDICION = [
        ('pendiente', 'Pendiente'),
        ('aprobado', 'Aprobado'),
        ('observado', 'Con Observaciones'),
        ('rechazado', 'Rechazado'),
        ('pagado', 'Pagado'),
    ]

    proyecto = models.ForeignKey('proyectos.Proyecto', on_delete=models.CASCADE)
    descripcion = models.TextField(blank=True, null=True)
    monto_rendido = models.DecimalField(max_digits=12, decimal_places=2)
    numero_documento = models.CharField(max_length=50, blank=True, null=True, help_text="Número de factura o boleta")
    fecha_rendicion = models.DateField()
    documentos_adjuntos = models.ManyToManyField('documentos.Documento', related_name='rendiciones_adjuntas', blank=True)

    # Campos de Revisión (Paso 6)
    estado = models.CharField(max_length=20, choices=ESTADO_RENDICION, default='pendiente')
    observacion = models.TextField(blank=True, null=True, help_text="Observaciones del auditor/CPA")
    revisor = models.ForeignKey('usuarios.CustomUser', on_delete=models.SET_NULL, null=True, blank=True, related_name='rendiciones_revisadas')
    fecha_revision = models.DateTimeField(null=True, blank=True)
    comprobante_traspaso = models.FileField(upload_to='comprobantes_pago/', null=True, blank=True, help_text="Comprobante de transferencia al proveedor")

    def __str__(self):
        return f"Rendición {self.id} - {self.proyecto} ({self.estado})"