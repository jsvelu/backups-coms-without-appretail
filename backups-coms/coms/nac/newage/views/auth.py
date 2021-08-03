

import authtools.views
from django.contrib import auth
from django.contrib.auth.decorators import login_required
from django.contrib.auth.forms import PasswordChangeForm
from django.views.decorators.csrf import csrf_protect
from django.views.decorators.debug import sensitive_post_parameters
from django.views.generic import TemplateView


class LoginView(authtools.views.LoginView):
    """
    Login action
    """
    allow_authenticated = False # they have to log out before they can log in again
    #template_name = 'registration/login.html'
    template_name = 'admin/login.html'

    def get_success_url(self):
        # user = self.request.user
        # Redirect to different places after login?
        return super(LoginView, self).get_success_url()


class LogoutView(authtools.views.LogoutView):
    """
    Logout action
    """
    template_name = 'registration/logged_out.html'


class MaintenanceView(TemplateView):
    template_name = 'newage/maintenance.html'


@sensitive_post_parameters()
@csrf_protect
@login_required
def password_change(request,
                    template_name='registration/password_change_form.html',
                    post_change_redirect=None,
                    password_change_form=PasswordChangeForm,
                    current_app=None, extra_context=None):

    # Call the django password change method, but use our template (out of admin)

    return auth.views.password_change(request,
        template_name,
        post_change_redirect,
        password_change_form,
        current_app, extra_context)


@login_required
def password_change_done(request,
                         template_name='registration/password_change_done.html',
                         current_app=None, extra_context=None):

    # Call the django password change method, but use our template (out of admin)

    return auth.views.password_change_done(request,
        template_name,
        current_app,
        extra_context)
