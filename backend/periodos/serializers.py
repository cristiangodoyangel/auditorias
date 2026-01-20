from rest_framework import serializers
from .models import Periodo
from django.db.models import Sum


class PeriodoSerializer(serializers.ModelSerializer):
    comunidad_nombre = serializers.CharField(source='comunidad.nombre', read_only=True)
    saldo_remanente = serializers.SerializerMethodField()
    class Meta:
        model = Periodo
        fields = ['id', 'nombre', 'fecha_inicio', 'fecha_fin', 'comunidad', 'comunidad_nombre', 'monto_asignado', 'monto_anterior', 'activo', 'saldo_remanente']

    def get_saldo_remanente(self, obj):
        from rendiciones.models import Rendicion
        total_pagado = Rendicion.objects.filter(
            proyecto__periodo=obj, 
            estado='pagado'
        ).aggregate(Sum('monto_rendido'))['monto_rendido__sum'] or 0
        
        total_disponible = (obj.monto_asignado or 0) + (obj.monto_anterior or 0)
        return total_disponible - total_pagado
