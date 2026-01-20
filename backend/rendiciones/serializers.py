
from rest_framework import serializers
from .models import Rendicion
from documentos.serializers import DocumentoSerializer
from documentos.models import Documento 

class RendicionSerializer(serializers.ModelSerializer):
    
    documentos_adjuntos = DocumentoSerializer(many=True, read_only=True)
    

    proyecto_nombre = serializers.CharField(source='proyecto.nombre', read_only=True)


    documentos_ids = serializers.PrimaryKeyRelatedField(
        many=True,
        write_only=True,
        queryset=Documento.objects.all(),
        source='documentos_adjuntos'
    )

    class Meta:
        model = Rendicion
        fields = [
            'id', 
            'proyecto', 
            'proyecto_nombre', 
            'descripcion', 
            'monto_rendido',
            'numero_documento', 
            'fecha_rendicion', 
            'documentos_adjuntos', 
            'documentos_ids',
            'comprobante_traspaso',
            # New fields for Step 6
            'estado',
            'observacion',
            'revisor',
            'fecha_revision'
        ]
        read_only_fields = ['estado', 'observacion', 'revisor', 'fecha_revision'] # Only modifiable via specific actions