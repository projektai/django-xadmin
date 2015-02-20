from sorl.thumbnail import ImageField, get_thumbnail

from django.core import exceptions
from django.db import models
from django.utils.translation import ugettext_lazy as _


THUMB_DEFAULT_OPTIONS = {
    'small': {
        'geometry': '80x80',
        'options': {'crop':'center', 'quality':99}
    },
    'medium': {
        'geometry': '200x200',
        'options': {'crop':'center', 'quality':99}
    }
}

class ImageWithThumbField(ImageField):
    def __init__(self, verbose_name=None, name=None, thumb_options={}, **kwargs):
        # TODO: override with default thumb_options from settings
        self.thumb_options = THUMB_DEFAULT_OPTIONS.copy()
        if thumb_options:
            for size in THUMB_DEFAULT_OPTIONS:
                if size in thumb_options:
                    self.thumb_options[size] = thumb_options[size].copy()

        super(ImageWithThumbField, self).__init__(verbose_name, name, **kwargs)

    def get_small(self, instance):
        return self._get_thumb(instance, 'small')

    def get_medium(self, instance):
        return self._get_thumb(instance, 'medium')

    def _get_thumb(self, instance, size):
        return get_thumbnail(instance, self.thumb_options[size]['geometry'], **self.thumb_options[size]['options'])


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
                lat = float(tmp[0])
                lon = float(tmp[1])
                if abs(lon) <= 180 and abs(lat) <= 90:
                    is_valid = True
            except ValueError:
                pass

        if not is_valid:
            raise exceptions.ValidationError(
                _('Incorrect coordinates'),
                params={'value': value},
            )
