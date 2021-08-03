import collections
import copy

from django.conf import settings
from django.urls import reverse


def newage_print_context():
    """
    Contexts for print output (no request)
    :return: dict of extra content variables
    """
    from orders.models import Order

    return {
        'DEBUG_WEBPACK': settings.DEBUG_WEBPACK,
        'bodyenvclass': settings.BODY_ENV_CLASS,
        'TEST_SETTINGS': {
            # These are replaced by protractor in test-e2e/conf.js
            'DISABLE_PDF': settings.DISABLE_PDF,
        },
        'APP_SETTINGS': {
            'DEBUG': settings.DEBUG,
            'STAGE_QUOTE_SELECTIONS': Order.STAGE_QUOTE_SELECTIONS,
            'FORMAT_DATE_JS': settings.FORMAT_DATE_JS,
            'FORMAT_DATE_DATEPICKER_JS': settings.FORMAT_DATE_DATEPICKER_JS,
            'FORMAT_DATE_DATEPICKER_DASH_FMT_JS' : settings.FORMAT_DATE_DATEPICKER_DASH_FMT_JS,
            'FORMAT_DATE_ISO_JS': settings.FORMAT_DATE_ISO_JS,
            'FORMAT_DATE_MONTH_JS': settings.FORMAT_DATE_MONTH_JS,
            'FORMAT_DATE_MONTH_ISO_JS': settings.FORMAT_DATE_MONTH_ISO_JS,
            'FORMAT_DATE_MONTH_SHORT_JS': settings.FORMAT_DATE_MONTH_SHORT_JS,
            'FORMAT_DATE_WEEKDAY_JS': settings.FORMAT_DATE_WEEKDAY_JS,
            'FORMAT_DATE_ONEWORD_JS': settings.FORMAT_DATE_ONEWORD_JS,
            'FORMAT_DATETIME_JS': settings.FORMAT_DATETIME_JS,
            'FORMAT_DATETIME_ONEWORD_JS': settings.FORMAT_DATETIME_ONEWORD_JS,
        },
    }


def newage_context(request):
    """
    Use this function to add custom variables to all contexts
    :param request:
    :return: dict of extra context variables
    """

    # import here to prevent circular dependencies
    from dealerships.models import DealershipUser

    try:
        dealerships = DealershipUser.objects.get(pk=request.user.pk).dealerships.all()
    except DealershipUser.DoesNotExist:
        dealerships = []

    data = newage_print_context()
    data.update({
        'has_permission': request.user.is_active and request.user.is_authenticated,
        'menu': _build_user_menu(request),
        'user_hijacked': request.session.get('is_hijacked_user', False),
        'user_dealerships': dealerships,
        'has_access_to_appretail':  request.user.has_perm('newage.can_view_appretail'),
    })
    return data

_MENU = collections.OrderedDict([
    ('Home', {
        'icon': '/static/newage/icons/dashboard.png',
        'sub_sections': collections.OrderedDict([
            ('Home', {
                'route': 'home',
                'permissions': (),
            }),
        ]),
    }),
    ('Orders', {
        'icon': '/static/newage/icons/orders.png',
        'sub_sections': collections.OrderedDict([
            ('Showroom', {
                'route': 'orders:showroom',
                'permissions': ('orders.create_order', ),
            }),
            ('Lookup', {
                'route': 'orders:lookup',
                'permissions': (),
            }),
            ('Create Order', {
                'route': 'newage:angular_app',
                'kwargs': {'app': 'orders'},
                'permissions': ('orders.create_order', ),
            }),
            ('All Orders', {
                'route': 'orders:list',
                'permissions': ('orders.view_order', ),
            }),
            ('All Quotes', {
                'route': 'orders:list-quotes',
                'permissions': ('orders.view_order', ),
            }),
            #('Bill of Materials', {
            #    'route': 'orders:bom',
            #    'permissions': ('orders.create_order', ),
            #}),
            ('Re-assign Orders', {
                'route': 'orders:reassign',
                'permissions': ('orders.reassign_order_all', ),
            }),
            ('Schedule Availability', {
                'route': 'orders:scheduleavail',
                'permissions': ('orders.view_schedule_availability', ),
            }),
            # ('Schedule Availability II', {
            #     'route': 'orders:schedule_availability2',
            #     'permissions': ('orders.view_schedule_availability', ),
            # }),
            ('Dealer Dashboard', {
                'route': 'newage:angular_jqueryui_app',
                'kwargs': {'app': 'schedule'},
                'fragment': '/dealer_dashboard',
                'permissions': ('schedule.view_dealer_schedule_dashboard',),
            }),
            ('Model Browser', {
                'route': 'caravans:browse_models',
                'permissions': ('caravans.can_browse_models', ),
            }),
            ('Failed Salesforce Orders', {
                'route': 'orders:salesforce_failed',
                # 'permissions': ('caravans.can_browse_models', ),
                # 'permission_func': lambda user: user.is_staff,
                'permission_func': lambda user: user.is_superuser,
            }),
        ])
    }),
    ('Models', {
        'icon': '/static/newage/icons/models.png',
        'sub_sections': collections.OrderedDict([
            ('Manage Specifications', {
                'route': 'newage:angular_app',
                'kwargs': {'app': 'models'},
                'permissions': ('caravans.change_model', ),
            }),
            ('Prices and Dimensions', {
                'route': 'admin:caravans_series_changelist',
                'permissions': ('caravans.change_series', ),
            }),
            ('Manage Model Photos', {
                'route': 'admin:caravans_seriesphoto_changelist',
                'permissions': ('caravans.change_seriesphoto', ),
            }),
            ('Replace SKU', {
                'route': 'orders:replace_sku',
                'permissions': ('orders.replace_sku', ),
            }),
        ]),
    }),
    ('Caravans', {
        'icon': '/static/newage/icons/factory-schedule.png',
        'sub_sections': collections.OrderedDict([

            ('Caravans Dashboard', {
                'route': 'newage:angular_jqueryui_app',
                'kwargs': {'app': 'schedule'},
                'fragment': '/dashboard',
                'permissions': ('schedule.view_schedule_dashboard', ),
            }),

            ('Caravans Production Dashboard', {
                'route': 'newage:angular_jqueryui_app',
                'kwargs': {'app': 'schedule'},
                'fragment': '/transportdashboard',
                'permissions': ('schedule.view_transport_dashboard', ),
            }),
            
            ('Caravans Production Status', {
                'route': 'newage:angular_jqueryui_app',
                'kwargs': {'app': 'schedule'},
                'fragment': '/statusdashboard',
                'permissions': ('schedule.view_transport_dashboard', ),
            }),

            ('Caravans Production Capacity', {
                'route': 'newage:angular_jqueryui_app',
                'kwargs': {'app': 'schedule'},
                'fragment': '/capacity',
                'permissions': ('schedule.view_schedule_capacity', ),
            }),
            ('Caravans Schedule Planner', {
                'route': 'newage:angular_jqueryui_app',
                'kwargs': {'app': 'schedule'},
                'fragment': '/planner',
                'permissions': ('schedule.view_schedule_planner', ),
            }),
            ('Caravans Export', {
                'route': 'newage:angular_jqueryui_app',
                'kwargs': {'app': 'schedule'},
                'fragment': '/export',
                'permissions': ('schedule.export_schedule', ),
            }),
        ])
    }),
    ('Pop-Top/Campers', {
        'icon': '/static/newage/icons/factory-schedule.png',
        'sub_sections': collections.OrderedDict([

            ('Pop-Top/Campers Dashboard', {
                'route': 'newage:angular_jqueryui_app',
                'kwargs': {'app': 'schedule2'},
                'fragment': '/dashboard2',
                'permissions': ('schedule.view_schedule_dashboard', ),
            }),

            ('Pop-Top/Campers Production Dashboard', {
                'route': 'newage:angular_jqueryui_app',
                'kwargs': {'app': 'schedule2'},
                'fragment': '/transportdashboard2',
                'permissions': ('schedule.view_transport_dashboard', ),
            }),
            
            (' Pop-Top/Campers Production Status', {
                'route': 'newage:angular_jqueryui_app',
                'kwargs': {'app': 'schedule2'},
                'fragment': '/statusdashboard2',
                'permissions': ('schedule.view_transport_dashboard', ),
            }),

            ('Pop-Top/Campers Production Capacity', {
                'route': 'newage:angular_jqueryui_app',
                'kwargs': {'app': 'schedule2'},
                'fragment': '/capacity2',
                'permissions': ('schedule.view_schedule_capacity', ),
            }),
            ('Pop-Top/Campers Schedule Planner', {
                'route': 'newage:angular_jqueryui_app',
                'kwargs': {'app': 'schedule2'},
                'fragment': '/planner2',
                'permissions': ('schedule.view_schedule_planner', ),
            }),
            ('Pop-Top/Campers Export', {
                'route': 'newage:angular_jqueryui_app',
                'kwargs': {'app': 'schedule2'},
                'fragment': '/export2',
                'permissions': ('schedule.export_schedule', ),
            }),
        ])
    }),
    #('Quality Assurance', {
    #    'icon': '/static/newage/icons/quality-assurance.png',
    #    'sub_sections': collections.OrderedDict([
    #        ('Quality Assurance', {
    #            'route': 'quality:list',
    #            'permission_func': lambda user: user.is_superuser,
    #        }),
    #    ]),
    #}),
    ('Combined Dashboard', {
       'icon': '/static/newage/icons/leads.png',
       'sub_sections': collections.OrderedDict([
           ('Status', {
                # 'kwargs': {'app': 'schedule'},
                'route': 'newage:angular_jqueryui_app',
                # 'route': 'reports:index',
                'kwargs': {'app': 'schedule'},
                'fragment': '/combinedstatusdashboard',
                # 'permissions': ('schedule.view_transport_dashboard', ),
                'permissions': ('orders.view_order', ),
                # 'permissions': ('schedule.view_transport_dashboard', ),
                # 'route': 'schedule:lead_listing',
                # 'permissions': ('reports.view_reports_page', ),
           }),
           ('Delay Dashboard', {
                # 'kwargs': {'app': 'schedule'},
                'route': 'newage:angular_jqueryui_app',
                # 'route': 'reports:index',
                'kwargs': {'app': 'schedule'},
                'fragment': '/delaydashboard',
                'permissions': ('schedule.view_transport_dashboard', ),
                # 'route': 'schedule:lead_listing',
                # 'permissions': ('reports.view_reports_page', ),
           }),
           
       ]),
       
    }),
    ('Reports', {
        'icon': '/static/newage/icons/reports.png',
        'sub_sections': collections.OrderedDict([
            ('Reports', {
                'route': 'reports:index',
                'permissions': ('reports.view_reports_page', ),
            }),
            
            ('Cancelled Orders', {
                'route': 'orders:list-cancelled',
                'permissions': ('orders.view_order', ),
            }),
            ('VIN Data Sheet', {
                'route': 'orders:list-delivery',
                'permissions': ('delivery.can_access_vin_sheet', ),
            }),
        ]),
    }),
    ('Management Reports', {
        'icon': '/static/newage/icons/reports.png',
        'sub_sections': collections.OrderedDict([
            ('MPS', {
                'route': 'mps:index',
                'permissions': ('mps.view_mps_page', ),
            }),
           
            ('Reports', {
                'route': 'mps:sales',
                'permissions': ('mps.view_mps_sales_report', ),
            }),
            
        ]),
    }),
    
    #('Warranty', {
    #    'icon': '/static/newage/icons/warranty.png',
    #    'sub_sections': collections.OrderedDict([
    #        ('Warranty Claims', {
    #            'route': 'warranty:listing',
    #            'permission_func': lambda user: user.is_superuser,
    #        }),
    #    ]),
    #}),
    #('Marketing', {
    #    'icon': '/static/newage/icons/marketing-material.png',
    #    'sub_sections': collections.OrderedDict([
    #        ('Marketing Materials', {
    #            'route': 'marketing:view_marketing_materials',
    #            'permissions': ('marketing.view_marketing_materials', ),
    #        }),
    #    ]),
    #}),
    
    ('System Admin', {
        'icon': '/static/newage/icons/sys-admin.png',
        'sub_sections': collections.OrderedDict([
            ('Admin', {
                'route': 'admin:index',
                'permission_func': lambda user: user.is_staff,
            }),
            #('Import SKUs', {
            #    'route': 'caravans:sku_import',
            #    'permissions': ('caravans.import_sku', ),
            #}),
            ('Export SKUs', {
                'route': 'caravans:sku_export',
                'permissions': ('caravans.export_sku', ),
            }),
        ]),
    }),
])

_menu_urls_calculated = False


def _precalc_menu_urls():
    global _menu_urls_calculated
    if not _menu_urls_calculated:
        # We don't want to reverse the routes on every single page request
        # so precalc the data since it will never change
        for (section, section_val) in list(_MENU.items()):
            for (sub_section, menu_item) in list(section_val['sub_sections'].items()):
                menu_item['url'] = reverse(menu_item['route'], kwargs=menu_item.get('kwargs', {}))
                if 'fragment' in menu_item:
                    menu_item['url'] += '#' + menu_item['fragment']
    _menu_urls_calculated = True


def _build_user_menu(request):
    """
    Return a menu that only shows sections the user has permission to view, and indicate current selected view
    :param request: the current request object
    :return: a dictionary of menu items accessed by the base template
    """
    _precalc_menu_urls()

    # filter the menu by permissions
    user = request.user
    user_menu = copy.deepcopy(_MENU)
    for (section, section_val) in list(_MENU.items()): # iterate over the original menu, not the copy
        for (sub_section, menu_item) in list(section_val['sub_sections'].items()):
            if 'permission_func' in menu_item:
                has_permissions = menu_item['permission_func'](user)
            else:
                has_permissions = all(user.has_perm(perm) for perm in menu_item['permissions'])

            if not has_permissions:
                del user_menu[section]['sub_sections'][sub_section]

            else:
                # set active state if menu item is currently showing
                if request.path == menu_item['url']:
                    user_menu[section]['active'] = True
                    user_menu[section]['sub_sections'][sub_section]['active'] = True

    # only keep sections that contain sub sections
    final_menu = collections.OrderedDict()
    for (section, section_val) in list(user_menu.items()):
        if len(section_val['sub_sections']):
            final_menu[section] = section_val

    return final_menu

