

from django.views.generic.base import TemplateView
from filebrowser.base import FileListing
from filebrowser.sites import site
from rules.contrib.views import PermissionRequiredMixin


class ViewMarketingMaterialsView(PermissionRequiredMixin, TemplateView):
    template_name = 'view_materials.html'
    permission_required = 'marketing.view_marketing_materials'

    @staticmethod
    def filter_filelisting(item):
        return not item.is_folder

    def get_context_data(self, **kwargs):
        context = super(ViewMarketingMaterialsView, self).get_context_data(**kwargs)
        files = FileListing(site.directory, filter_func=self.filter_filelisting, sorting_by='path')
        marketing_files = []
        for f in files.files_walk_filtered():
            marketing_files.append(
                {
                    'path': f.path[f.path.startswith(site.directory) and len(site.directory):],
                    'uploaded_on': f.datetime,
                    'url': f.url,
                }
            )
        context['marketing_files'] = marketing_files
        context['help_code'] = 'marketing_materials'
        return context
