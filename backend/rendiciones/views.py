from rest_framework import viewsets
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.decorators import action
from rest_framework.response import Response
from django.utils import timezone
from rest_framework.permissions import IsAuthenticated, AllowAny
from .models import Rendicion
from .serializers import RendicionSerializer

class RendicionViewSet(viewsets.ModelViewSet):
    serializer_class = RendicionSerializer
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['proyecto', 'estado']

    def get_queryset(self):
        user = self.request.user
        if hasattr(user, 'comunidad') and user.comunidad:
            return Rendicion.objects.filter(proyecto__comunidad=user.comunidad)
        return Rendicion.objects.none()
    permission_classes = [IsAuthenticated] # AllowAny was temporary, stricter now

    @action(detail=True, methods=['post'])
    def revisar(self, request, pk=None):
        rendicion = self.get_object()
        user = request.user
        
        # Validar Rol (Solo CPA o Admin)
        if user.rol not in ['cpa', 'admin', 'CPA Revisor']:
             return Response({'error': 'No tiene permisos para revisar'}, status=403)

        nuevo_estado = request.data.get('estado')
        observacion = request.data.get('observacion', '')

        if nuevo_estado not in ['aprobado', 'observado', 'rechazado']:
             return Response({'error': 'Estado inválido'}, status=400)

        rendicion.estado = nuevo_estado
        rendicion.observacion = observacion
        rendicion.revisor = user
        rendicion.fecha_revision = timezone.now()
        rendicion.save()

        return Response({'status': 'ok', 'estado': rendicion.estado})
