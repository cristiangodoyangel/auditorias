# from django.apps import AppConfig

#class RendicionesConfig(AppConfig):
#    default_auto_field = 'django.db.models.BigAutoField'
#    name = 'rendiciones'

    
#    def ready(self):
   
#        import rendiciones.signals
    
from django.contrib import admin
from .models import Rendicion

admin.site.register(Rendicion)    