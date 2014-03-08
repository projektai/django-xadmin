from django.conf import settings

def admin_branding(request):
    return {'copyright_company': settings.COPYRIGHT}
