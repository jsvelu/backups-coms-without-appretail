import allianceutils.urls
import authtools.views
import ckeditor_uploader.urls
from django.conf import settings
from django.conf.urls import include
from django.urls import path, re_path
from django.conf.urls.static import static
from django.contrib import admin
from django.contrib import auth
from django.urls import reverse_lazy
from django.views.generic.base import RedirectView
from filebrowser.sites import site
import hijack.urls
from spyne.server.django import DjangoView

import caravans.urls
import crm.urls
import customers.urls
import help.urls
import marketing.urls
import newage.views
import newage.views.auth
import newage.views.egm_ws
import newage.views.home
import orders.urls
import portal.urls
import production.urls
import quality.urls
import reports.urls
import schedule.urls
import warranty.urls
import mps.urls

admin.autodiscover()

newage_urlpatterns_api = [
    re_path(r'^homelookup/$', newage.views.home.HomeLookupView.as_view(), name="lookup"),
]

newage_urlpatterns = [
    re_path(r'^login/$', newage.views.auth.LoginView.as_view(), name='login'),
    re_path(r'^logout/$', newage.views.auth.LogoutView.as_view(), name='logout'),
    re_path('login_token/', newage.views.auth.TokenLogin.as_view(), name='login_token'),
    re_path(r'^(?P<app>schedule)/$', newage.views.AngularJQueryUIView.as_view(), name='angular_jqueryui_app'),
    re_path(r'^(?P<app>schedule2)/$', newage.views.AngularJQueryUIView.as_view(), name='angular_jqueryui_app'),
    re_path(r'^(?P<app>.+)/$', newage.views.AngularView.as_view(), name='angular_app'),
]

# TODO: API URLs are wildly inconsistent
urlpatterns_api = [
    re_path(r'^caravans/', include(caravans.urls.urlpatterns_api)),
    re_path(r'^common/', include(caravans.urls.urlpatterns_api_common)),
    re_path(r'^leads/', include(customers.urls.urlpatterns_api)),
    re_path(r'^gateway/', include(customers.urls.urlpatterns_api)),
    re_path(r'^models/', include(caravans.urls.urlpatterns_api_models)),
    re_path(r'^orders/', include(orders.urls.urlpatterns_api)),
    re_path(r'^production/', include(production.urls.urlpatterns_api)),
    re_path(r'^schedule/', include(schedule.urls.urlpatterns_api)),
    re_path(r'^schedule2/', include(schedule.urls.urlpatterns_api)),
    re_path(r'^uom/', include(caravans.urls.urlpatterns_api_uom)),
]

urlpatterns_export = [
    re_path(r'^schedule/', include(schedule.urls.urlpatterns_export)),
    re_path(r'^schedule2/', include(schedule.urls.urlpatterns_export)),
]
urlpatterns = []
if settings.MAINTENANCE_MODE:
    urlpatterns += [
        re_path(r'^.*/?$', newage.views.auth.MaintenanceView.as_view()),
    ]

urlpatterns += [
    re_path(r'^$', RedirectView.as_view(url=reverse_lazy('home'), permanent=False)),
    # Including the password change urls here to make them accessible outside of the admin subsite
    re_path(r'^password_change/$', auth.views.PasswordChangeView.as_view(), name='password_change'),
    re_path(r'^password_change/done/$', auth.views.PasswordChangeDoneView.as_view(), name='password_change_done'),
    re_path(r'^password_reset/$', authtools.views.PasswordResetView.as_view(), name='password_reset'),
    re_path(r'^password_reset/(?P<uidb64>[0-9A-Za-z_\-]+)/(?P<token>[0-9A-Za-z]{1,13}-[0-9A-Za-z]{1,20})/$', authtools.views.PasswordResetConfirmView.as_view(), name='password_reset_confirm'),
    re_path(r'^password_reset/done/$', authtools.views.PasswordResetDoneView.as_view(), name='password_reset_done'),
    re_path(r'^reset/done/$', authtools.views.PasswordResetCompleteView.as_view(), name='password_reset_complete'),
    re_path(r'^admin/', admin.site.urls),
    re_path(r'^admin/filebrowser/', site.urls),
    re_path(r'^allianceutils/', include(allianceutils.urls.urlpatterns_permissionsexport)),
    re_path(r'^api/', include(urlpatterns_api)),
    re_path(r'^caravans/', include((caravans.urls.urlpatterns, 'caravans'))),
    re_path(r'^crm/', include((crm.urls.urlpatterns, 'crm'))),
    re_path(r'^export/', include((urlpatterns_export, 'export'))),
    re_path(r'^help/', include((help.urls.urlpatterns, 'help'))),
    re_path(r'^hijack/', include((hijack.urls.urlpatterns, 'hijack'))),
    re_path(r'^home/', newage.views.home.HomePageView.as_view(), name='home'),
    re_path(r'^marketing/', include((marketing.urls.urlpatterns, 'marketing'))),
    re_path(r'^newage/', include((newage_urlpatterns, 'newage'))),
    re_path(r'^orders/', include((orders.urls.urlpatterns, 'orders'))),
    re_path(r'^schedule/', include((schedule.urls.urlpatterns, 'schedule'))),
    re_path(r'^portal/', include((portal.urls.urlpatterns, 'portal'))),
    re_path(r'^quality/', include((quality.urls.urlpatterns, 'quality'))),
    re_path(r'^reports/', include((reports.urls.urlpatterns, 'reports'))),
    re_path(r'^mps/', include((mps.urls.urlpatterns, 'mps'))),
    re_path(r'^warranty/', include((warranty.urls.urlpatterns, 'warranty'))),

    # e-GoodManners webservice API
    re_path(r'^egm_ws/', DjangoView.as_view(application=newage.views.egm_ws.EgmWebServices), name='egm_ws'),

    # CKeditor upload views
    re_path(r'^ckeditor/', include(ckeditor_uploader.urls.urlpatterns)),

    # serve media content in dev
] + static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)

if settings.DEBUG:
    try:
        import debug_toolbar
    except ImportError:
        pass
    else:
        urlpatterns += [
            re_path(r'^__debug__/', include(debug_toolbar.urls)),
        ]
