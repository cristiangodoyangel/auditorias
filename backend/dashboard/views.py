from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.db.models import Sum, Count, Q
from django.utils import timezone
from proyectos.models import Proyecto
from rendiciones.models import Rendicion
from periodos.models import Periodo

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def dashboard_kpis(request):
    """
    Devuelve los KPIs generales para el dashboard filtrados por comunidad.
    """
    user = request.user
    if not hasattr(user, 'comunidad') or not user.comunidad:
        return Response({"error": "Usuario sin comunidad asignada"}, status=400)

    comunidad = user.comunidad
    
    # Filtros base
    proyectos_qs = Proyecto.objects.filter(comunidad=comunidad)
    
    # 1. Totales Generales
    total_proyectos = proyectos_qs.count()
    activas = proyectos_qs.filter(estado='ejecucion').count()
    cerradas = proyectos_qs.filter(estado='cierre').count()
    
    # 2. Financiero (Sumar de todos los proyectos)
    presupuesto_total = proyectos_qs.aggregate(Sum('presupuesto_total'))['presupuesto_total__sum'] or 0
    
    # Remesas Pagadas -> Rendiciones PAGADAS (Reembolsos o Pagos Directos)
    total_pagado = Rendicion.objects.filter(
        proyecto__comunidad=comunidad, 
        estado='pagado'
    ).aggregate(Sum('monto_rendido'))['monto_rendido__sum'] or 0
    
    # Rendiciones (Dinero justificado)
    # Consideramos 'rendido' todo lo presentado, pero quizás 'aprobado' es el KPI real.
    # Mostraremos 'Rendido Total' (ingresado) y 'Aprobado' (validado)
    rendiciones_qs = Rendicion.objects.filter(proyecto__comunidad=comunidad)
    total_rendido_ingresado = rendiciones_qs.aggregate(Sum('monto_rendido'))['monto_rendido__sum'] or 0
    total_rendido_aprobado = rendiciones_qs.filter(estado='aprobado').aggregate(Sum('monto_rendido'))['monto_rendido__sum'] or 0

    # 3. Alertas / Pendientes
    rendiciones_observadas = rendiciones_qs.filter(estado='observado').count()
    rendiciones_pendientes = rendiciones_qs.filter(estado='pendiente').count()
    
    # Proyectos Atrasados (Fecha fin pasada y no cerrado)
    hoy = timezone.now().date()
    proyectos_atrasados = proyectos_qs.filter(
        fecha_fin__lt=hoy
    ).exclude(estado__in=['cierre', 'rechazado']).count()

    # 4. Periodo Actual
    periodo_obj = Periodo.objects.periodo_actual(comunidad)
    periodo_data = None
    if periodo_obj:
        periodo_data = {
            "nombre": periodo_obj.nombre,
            "monto_asignado": periodo_obj.monto_asignado,
            "fecha_fin": periodo_obj.fecha_fin,
            "fecha_inicio": periodo_obj.fecha_inicio
        }

    data = {
        "periodo": periodo_data,
        "kpis": {
            "total_proyectos": total_proyectos,
            "proyectos_activos": activas,
            "presupuesto_total": presupuesto_total,
            "total_pagado": total_pagado,
            "total_rendido": total_rendido_ingresado,
            "total_rendido_aprobado": total_rendido_aprobado,
            "porcentaje_ejecucion_fin": (total_pagado / presupuesto_total * 100) if presupuesto_total > 0 else 0,
        },
        "alertas": {
            "rendiciones_observadas": rendiciones_observadas,
            "rendiciones_pendientes": rendiciones_pendientes,
            "proyectos_atrasados": proyectos_atrasados
        },
        "charts": {
            "rendiciones": [
                {"name": "Aprobado", "value": rendiciones_qs.filter(estado='aprobado').count()},
                {"name": "Observado", "value": rendiciones_qs.filter(estado='observado').count()},
                {"name": "Pendiente", "value": rendiciones_qs.filter(estado='pendiente').count()},
                {"name": "Rechazado", "value": rendiciones_qs.filter(estado='rechazado').count()},
            ]
        }
    }
    return Response(data)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def resumen(request):
    return Response({"message": "Resumen endpoint"})