from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.shortcuts import get_object_or_404
from django.utils import timezone
from .models import Proyecto, HistorialEstado 
from django.db import models # Needed for aggregation
from .serializers import ProyectoSerializer
from usuarios.permissions import IsCPA, IsAuditor, IsPresidente, IsDirectorio, IsITO

# --------------------

class ProyectoViewSet(viewsets.ModelViewSet):
    serializer_class = ProyectoSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        user = self.request.user
        if hasattr(user, 'comunidad') and user.comunidad:
            return Proyecto.objects.filter(comunidad=user.comunidad)
        return Proyecto.objects.none()
    
    def perform_create(self, serializer):
        if self.request.user.rol == 'Admin Comunidad':
            serializer.save(comunidad=self.request.user.comunidad)
        else:
            serializer.save()
    
    @action(detail=True, methods=['post'])
    def cambiar_estado(self, request, pk=None):
        proyecto = self.get_object()
        nuevo_estado = request.data.get('nuevo_estado')
        comentario = request.data.get('comentario', '')

        if not nuevo_estado:
            return Response({'error': 'Debe proporcionar un nuevo estado'}, status=status.HTTP_400_BAD_REQUEST)

        # Reglas de Transición
        
        # 1. Solo CPA puede aprobar
        if nuevo_estado == 'aprobado':
            if request.user.rol != 'cpa':
                return Response({'error': 'Solo el CPA puede aprobar proyectos'}, status=status.HTTP_403_FORBIDDEN)
            if proyecto.estado != 'revision_cpa':
                return Response({'error': 'El proyecto debe estar en revisión por el CPA para ser aprobado'}, status=status.HTTP_400_BAD_REQUEST)

        # 2. Borrador -> Revisión Interna
        elif nuevo_estado == 'revision_interna':
            if proyecto.estado != 'borrador' and proyecto.estado != 'observaciones':
                 return Response({'error': 'Transición no válida'}, status=status.HTTP_400_BAD_REQUEST)

        # 3. Revisión Interna -> Revisión CPA (Solo Presidente o Directorio)
        elif nuevo_estado == 'revision_cpa':
            if request.user.rol not in ['presidente', 'directorio', 'admin']: # Admin for testing
                 return Response({'error': 'Solo Presidente o Directorio pueden enviar a CPA'}, status=status.HTTP_403_FORBIDDEN)
            if proyecto.estado != 'revision_interna':
                 return Response({'error': 'El proyecto debe haber pasado la revisión interna'}, status=status.HTTP_400_BAD_REQUEST)

        # 4. CPA -> Observaciones
        elif nuevo_estado == 'observaciones':
             if request.user.rol != 'cpa':
                return Response({'error': 'Solo el CPA puede emitir observaciones'}, status=status.HTTP_403_FORBIDDEN)

        # Actualizar Estado
        estado_anterior = proyecto.estado
        proyecto.estado = nuevo_estado
        proyecto.save()

        # Guardar Historial
        HistorialEstado.objects.create(
            proyecto=proyecto,
            estado_anterior=estado_anterior,
            estado_nuevo=nuevo_estado,
            usuario=request.user,
            comentario=comentario
        )

        return Response({
            'message': f'Estado cambiado a {nuevo_estado}',
            'estado_anterior': estado_anterior,
            'estado_nuevo': nuevo_estado
        })



# --- AVANCE FÍSICO VIEWSET (Paso 5) ---
from .models import ReporteAvance
from .serializers import ReporteAvanceSerializer

class ReporteAvanceViewSet(viewsets.ModelViewSet):
    serializer_class = ReporteAvanceSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        # Filtro por comunidad
        user = self.request.user
        if hasattr(user, 'comunidad') and user.comunidad:
            return ReporteAvance.objects.filter(proyecto__comunidad=user.comunidad).order_by('-fecha_reporte')
        return ReporteAvance.objects.none()

    def perform_create(self, serializer):
        # Validar Rol (Solo ITO o Admin)
        if self.request.user.rol not in ['ito', 'admin']:
             raise serializers.ValidationError("Solo el ITO o Admin pueden reportar avance físico.")
        
        serializer.save(autor=self.request.user)