from django.urls import reverse_lazy
from django.db.models import Prefetch
from django.utils import timezone
from django.views.generic.edit import FormView

from caravans.models import SKU
from orders.models import Order
from warranty.forms.claim import WarrantyClaimForm
from warranty.forms.claim import WarrantyEditClaimForm
from warranty.models import WarrantyClaim
from warranty.models import WarrantyClaimNote
from warranty.models import WarrantyClaimPhoto


class WarrantyClaimView(FormView):
    template_name = 'warranty/claim.html'
    form_class = WarrantyClaimForm
    success_url = reverse_lazy('warranty:claim')

    def get_form_kwargs(self):
        self.order_id = self.kwargs.get('order_id')
        self.order = Order.objects.get(pk=self.order_id)
        self.customer_id = self.order.customer_id
        self.customer = self.order.customer

        kwargs = super(WarrantyClaimView, self).get_form_kwargs()
        return kwargs

    def get_context_data(self, **kwargs):
        context = super(WarrantyClaimView, self).get_context_data(**kwargs)
        context['customer_id'] = self.customer_id
        context['order'] = self.order

        context['claims'] = WarrantyClaim.objects.all().filter(order_id=self.order_id).order_by('creation_time').reverse()\
            .prefetch_related("warrantyclaimphoto_set").prefetch_related(Prefetch("warrantyclaimnote_set", WarrantyClaimNote.objects.all().order_by('creation_time').reverse()))

        context['claim_statuses'] = WarrantyClaim.WARRANTY_STATUS_TYPES

        context['sub_heading'] = 'Claims for Chassis No. ' + self.order.chassis + ' | Series ' + str(self.order.orderseries.series)\
                                 + ' | Customer ' + self.customer.first_name + ' ' + self.customer.last_name\
                                 + ' | Dealership ' + self.order.dealership.name
        context['help_code'] = 'warranty_list'
        return context

    def form_invalid(self, form):
        return super(WarrantyClaimView, self).form_invalid(form)

    def form_valid(self, form):
        if self.request.POST.get('btn_add'):
            warranty_claim = WarrantyClaim()
            warranty_claim.creation_time = timezone.now()
            warranty_claim.cost_price = 0
            warranty_claim.created_by = self.request.user
            warranty_claim.sku = SKU.objects.get(id=self.request.POST.get('hdn_item_id'))
            warranty_claim.sku_name = warranty_claim.sku.name
            warranty_claim.description = self.request.POST.get('issue')
            warranty_claim.order = Order.objects.get(pk=self.kwargs.get('order_id'))
            warranty_claim.status = WarrantyClaim.WARRANTY_STATUS_NOT_ACTIONED

            warranty_claim.save()

        self.success_url = self.request.path

        return super(WarrantyClaimView, self).form_valid(form)

class WarrantyEditClaimView(FormView):
    template_name = 'warranty/claim.html'
    form_class = WarrantyEditClaimForm
    success_url = reverse_lazy('warranty:claim')

    def form_invalid(self, form):
        return super(WarrantyEditClaimView, self).form_invalid(form)

    def form_valid(self, form):
        if len(self.request.FILES) > 0:
            warranty_claim_photo = WarrantyClaimPhoto()
            warranty_claim_photo.photo = list(self.request.FILES.values())[0]
            warranty_claim_photo.warranty_claim_id = self.request.POST.get('hdn_claim_id')
            warranty_claim_photo.save()

        if self.request.POST.get('btn_update'):
            post = self.request.POST
            this_claim = WarrantyClaim.objects.get(pk=post.get('hdn_claim_id'))
            this_claim.description = post.get('description')
            this_claim.repairer = post.get('repairer')
            if this_claim.status != int(post.get('status_choices')):
                if int(post.get('status_choices')) == WarrantyClaim.WARRANTY_STATUS_UNDER_APPROVAL or \
                int(post.get('status_choices')) == WarrantyClaim.WARRANTY_STATUS_COMPLETED:
                    warranty_claim_note = WarrantyClaimNote()
                    warranty_claim_note.created_by = self.request.user
                    warranty_claim_note.creation_time = timezone.now()
                    warranty_claim_note.warranty_claim = this_claim
                    if int(post.get('status_choices')) == WarrantyClaim.WARRANTY_STATUS_UNDER_APPROVAL:
                        warranty_claim_note.note = "Claim Approved"
                    if int(post.get('status_choices')) == WarrantyClaim.WARRANTY_STATUS_COMPLETED:
                        warranty_claim_note.note = "Claim Fulfilled"

                    warranty_claim_note.save()

            this_claim.status = post.get('status_choices')

            if post.get('txt_fix_date'):
                this_claim.date_fixed = post.get('fix_date')
            else:
                this_claim.date_fixed = None

            if post.get('txt_price_quote'):
                this_claim.cost_price = post.get('price_quote')
            else:
                this_claim.cost_price = None

            this_claim.save()

            if post.get('note'):
                warranty_claim_note = WarrantyClaimNote()
                warranty_claim_note.created_by = self.request.user
                warranty_claim_note.creation_time = timezone.now()
                warranty_claim_note.warranty_claim = this_claim
                warranty_claim_note.note = post.get('note')

                warranty_claim_note.save()

        self.success_url = '../claim/' + self.kwargs.get('order_id')
        return super(WarrantyEditClaimView, self).form_valid(form)
