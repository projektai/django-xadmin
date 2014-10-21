from django.core import exceptions
from django.db import models
from django.utils.translation import ugettext_lazy as _


class ColorField(models.CharField):
    def __init__(self, *args, **kwargs):
        kwargs['max_length'] = 7
        super(ColorField, self).__init__(*args, **kwargs)


class CoordinatesField(models.CharField):
    def __init__(self, *args, **kwargs):
        kwargs['max_length'] = 40
        super(CoordinatesField, self).__init__(*args, **kwargs)

    def validate(self, value, model_instance):
        super(CoordinatesField, self).validate(value, model_instance)

        is_valid = False
        tmp = value.split(':')
        if len(tmp) == 2:
            try:
                lon = float(tmp[0])
                lat = float(tmp[1])
                if abs(lon) <= 180 and abs(lat) <= 90:
                    is_valid = True
            except ValueError:
                pass

        if not is_valid:
            raise exceptions.ValidationError(
                _('Incorrect coordinates'),
                params={'value': value},
            )
