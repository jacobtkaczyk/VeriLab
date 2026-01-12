from django.contrib import admin
from django.urls import path
from simulation.views import run_simulation

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/simulate/', run_simulation),
]