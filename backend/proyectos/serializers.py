from rest_framework import serializers
from .models import Proyecto, ReporteAvance
from documentos.models import Documento
from django.db.models import Sum



class ReporteAvanceSerializer(serializers.ModelSerializer):
    foto_url = serializers.SerializerMethodField()

    class Meta:
        model = ReporteAvance
        fields = '__all__'
        read_only_fields = ('fecha_reporte', 'autor')

    def get_foto_url(self, obj):
        request = self.context.get('request')
        if obj.foto_avance:
            return request.build_absolute_uri(obj.foto_avance.url)
        return None

class ProyectoSerializer(serializers.ModelSerializer):
    # Campos para recibir IDs de documentos ya subidos (Upload First)
    documentos_ids = serializers.ListField(
        child=serializers.IntegerField(), 
        write_only=True, 
        required=False,
        help_text="Lista de IDs de documentos (Acta, Cotizaciones) previamente subidos"
    )
    
    # Campos de solo lectura para devolver URLs al frontend (buscando en Documento)
    acta_url = serializers.SerializerMethodField()
    cotizaciones_urls = serializers.SerializerMethodField()
    elegido_url = serializers.SerializerMethodField()


    
    # Campo de resumen Físico
    ultimo_avance_fisico = serializers.SerializerMethodField()

    class Meta:
        model = Proyecto
        fields = '__all__'
        read_only_fields = ('estado', 'fecha_firma_presidente')

    def validate_quorum_asamblea(self, value):
        if value <= 0:
            raise serializers.ValidationError("El quórum de la asamblea debe ser mayor a 0.")
        return value

    def validate(self, data):
        # Validar que si estamos creando, venga al menos un acta en documentos_ids?
        # Por ahora lo dejaremos flexible en el serializer, pero el frontend lo exigirá.
        # Podríamos validar aquí si tenemos acceso a los IDs y consultamos la BD.
        return data

    def create(self, validated_data):
        documentos_ids = validated_data.pop('documentos_ids', [])
        proyecto = Proyecto.objects.create(**validated_data)
        
        # Vincular documentos al proyecto
        if documentos_ids:
            docs = Documento.objects.filter(id__in=documentos_ids)
            for doc in docs:
                doc.proyecto = proyecto
                doc.save()
                
            if not docs.filter(tipo='Acta').exists():
                pass 

        return proyecto

    def get_acta_url(self, obj):
        request = self.context.get('request')
        doc = obj.documento_set.filter(tipo='Acta').last()
        if doc and doc.archivo:
            return request.build_absolute_uri(doc.archivo.url)
        return None

    def get_cotizaciones_urls(self, obj):
        request = self.context.get('request')
        docs = obj.documento_set.filter(tipo='Cotizaciones')
        urls = []
        for doc in docs:
            if doc.archivo:
                urls.append(request.build_absolute_uri(doc.archivo.url))
        return urls

    def get_elegido_url(self, obj):
        request = self.context.get('request')
        doc = obj.documento_set.filter(tipo='Cotizacion Elegida').last()
        if doc and doc.archivo:
            return request.build_absolute_uri(doc.archivo.url)
        return None



    def get_ultimo_avance_fisico(self, obj):
        """Devuelve el % de avance del último reporte ingresado (el más reciente)."""
        ultimo = obj.reportes_avance.order_by('-fecha_reporte', '-id').first()
        return ultimo.porcentaje_avance if ultimo else 0
