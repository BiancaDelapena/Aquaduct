from django.apps import AppConfig

class aquaductConfig(AppConfig):
    name = 'aquaduct'
    
    def ready(self):
        import aquaduct.signals  # noqa