from rest_framework import viewsets
from .models import Periodo
from rest_framework.permissions import IsAuthenticated
import rest_framework.decorators
import rest_framework.response
import datetime
from .serializers import PeriodoSerializer

class PeriodoViewSet(viewsets.ModelViewSet):
    serializer_class = PeriodoSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if hasattr(user, 'comunidad') and user.comunidad:
            return Periodo.objects.filter(comunidad=user.comunidad)
        return Periodo.objects.none()

    def perform_create(self, serializer):
        user = self.request.user
        if hasattr(user, 'comunidad') and user.comunidad:
            serializer.save(comunidad=user.comunidad)
        else:
            serializer.save()

    @rest_framework.decorators.action(detail=True, methods=['post'])
    def cerrar(self, request, pk=None):
        periodo = self.get_object()
        
        if not periodo.activo:
            return rest_framework.response.Response({'error': 'El periodo ya está cerrado.'}, status=400)

        # 1. Validaciones previas? 
        # (Ej: todos los proyectos deben estar cerrados? No necesariamente, pueden quedar deudas)
        
        # 2. Calcular saldos finales
        from django.db.models import Sum
        from rendiciones.models import Rendicion
        
        # Gastos Reales: Suma de Rendiciones PAGADAS en este periodo (o proyectos de este periodo)
        # Asumiendo que las rendiciones pertenecen a proyectos de ESTE periodo.
        # Si un proyecto dura varios años, ¿cambia de periodo? 
        # Modelo simplificado: Proyecto pertenece a UN periodo.
        
        gastos_pagados = Rendicion.objects.filter(
            proyecto__periodo=periodo,
            estado='pagado'
        ).aggregate(total=Sum('monto_rendido'))['total'] or 0
        
        # Ingresos totales
        total_recursos = periodo.monto_asignado + periodo.monto_anterior
        
        # Remanente
        saldo_final = total_recursos - gastos_pagados
        
        # 3. Cerrar
        periodo.activo = False
        periodo.save()
        
        # 4. Crear Siguiente Periodo Automáticamente? 
        # El requerimiento dice "Transfiere automáticamente... al Periodo Siguiente".
        # Podríamos crearlo con fechas tentativas (+1 año) y el monto_anterior = saldo_final.
        
        dia_siguiente = periodo.fecha_fin + datetime.timedelta(days=1)
        fin_siguiente = dia_siguiente.replace(year=dia_siguiente.year + 1) - datetime.timedelta(days=1)
        
        siguiente = Periodo.objects.create(
            comunidad=periodo.comunidad,
            nombre=f"Periodo {dia_siguiente.year}",
            fecha_inicio=dia_siguiente,
            fecha_fin=fin_siguiente,
            monto_asignado=0, # A definir por tesorero luego
            monto_anterior=saldo_final,
            activo=True # El nuevo queda activo
        )
        
        return rest_framework.response.Response({
            'message': 'Periodo cerrado exitosamente.',
            'resumen': {
                'total_recursos': total_recursos,
                'gastos_pagados': gastos_pagados,
                'saldo_remanente': saldo_final
            },
            'siguiente_periodo': PeriodoSerializer(siguiente).data
        })
