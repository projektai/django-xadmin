from sorl.thumbnail import ImageField, get_thumbnail
from django.contrib.gis.db import models as gis_models

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
        if 'show_original' in self.thumb_options['medium'] and self.thumb_options['medium']['show_original']:
            return instance
        return self._get_thumb(instance, 'medium')

    def _get_thumb(self, instance, size):
        return get_thumbnail(instance, self.thumb_options[size]['geometry'], **self.thumb_options[size]['options'])


class ColorField(models.CharField):
    def __init__(self, *args, **kwargs):
        kwargs['max_length'] = 7
        super(ColorField, self).__init__(*args, **kwargs)


class CoordinatesField(gis_models.PointField):
    def __init__(self, verbose_name=None, name_for_map=None, show_in_map=None, **kwargs):
        kwargs['geography'] = True
        self.name_for_map = name_for_map
        self.show_in_map = show_in_map
        super(CoordinatesField, self).__init__(verbose_name, **kwargs)

    def formfield(self, **kwargs):
        from xadmin.widgets import AdminOpenStreetMapWidget
        field = super(CoordinatesField, self).formfield(**kwargs)
        field.widget = AdminOpenStreetMapWidget() #forms.CharField
        return field
