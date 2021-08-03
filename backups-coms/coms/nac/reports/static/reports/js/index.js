$(function() {
    
    $('#show').change(function() {
        const shouldShow = $('#show').val();
        $('#runsheet-link-disabled').toggle(!shouldShow);
        $('#runsheet-link').toggle(!!shouldShow)  // toggle argument need to be === true or it will animate.
            .attr('href', BASE_RUNSHEET_URL + shouldShow);

    }).change();
    $('#model').change(function() {
        const shouldShow = $('#model').val();
        $('#series_pricelist-link-disabled').toggle(!shouldShow);
        $('#series_pricelist-link').toggle(!!shouldShow)  // toggle argument need to be === true or it will animate.
            .attr('href', BASE_SERIES_PRICELIST_URL + shouldShow);

    }).change();


    
    $('#placed_date').change(function() {
        var type = $('input[name=order_filter]:checked').val();
        const shouldShow = $('#date-from').val() && $('#date-to').val();

        $('#invoice-link-disabled').toggle(!shouldShow);
        $('#invoice-link').toggle(!!shouldShow)  // toggle argument need to be === true or it will animate.
            .attr('href', BASE_INVOICE_URL + type + '/' + $('#date-from').val() + '/' + $('#date-to').val());
    }).change();

    $('#dealership').change(function() {
        const shouldShow = $('#sales-date-from').val() && $('#sales-date-to').val() && $('#dealership').val();
        $('#sales-link-disabled').toggle(!shouldShow);
        $('#sales-link').toggle(!!shouldShow)  // toggle argument need to be === true or it will animate.
            .attr('href', BASE_SALES_URL + $('#dealership').val() + '/' + $('#sales-date-from').val() + '/' + $('#sales-date-to').val());
    }).change();


    $('#order_date').change(function() {
        const shouldShow = $('#sales-date-from').val() && $('#sales-date-to').val() && $('#dealership').val();
        $('#sales-link-disabled').toggle(!shouldShow);
        $('#sales-link').toggle(!!shouldShow)  // toggle argument need to be === true or it will animate.
            .attr('href', BASE_SALES_URL + $('#dealership').val() + '/' + $('#sales-date-from').val() + '/' + $('#sales-date-to').val());
    }).change();


    $('#ready-link').click(function() {
        const shouldShow = $('#dispatch-date-from').val() && $('#dispatch-date-to').val();
        // $('#ready-link-disabled').toggle(!shouldShow);
        // $('#ready-export-link-disabled').toggle(!shouldShow);
        $('#ready-link').toggle(!!shouldShow)  // toggle argument need to be === true or it will animate.
            .attr('href', BASE_READY_URL  + $('#dispatch-date-from').val() + '/' + $('#dispatch-date-to').val());
    }).change();

    $('#dispatch-link').click(function() {
        const shouldShow = $('#actual-dispatch-date-from').val() && $('#actual-dispatch-date-to').val();
        $('#dispatch-link-disabled').toggle(!shouldShow);
        // $('#dispatch-export-link-disabled').toggle(!shouldShow);
        $('#dispatch-link').toggle(!!shouldShow)  // toggle argument need to be === true or it will animate.
            .attr('href', BASE_DISPATCH_URL  + $('#actual-dispatch-date-from').val() + '/' + $('#actual-dispatch-date-to').val());
    }).change();

    $('#ready-export-link').click(function() {
        const shouldShow = $('#dispatch-date-from').val() && $('#dispatch-date-to').val();
        // $('#ready-export-link-disabled').toggle(!shouldShow);
        $('#ready-export-link').toggle(!!shouldShow)  // toggle argument need to be === true or it will animate.
            .attr('href', BASE_READY_EXPORT_URL  + $('#dispatch-date-from').val() + '/' + $('#dispatch-date-to').val());
    });

    $('#dispatch-export-link').click(function() {
        const shouldShow = $('#actual-dispatch-date-from').val() && $('#actual-dispatch-date-to').val();
        // $('#dispatch-export-link-disabled').toggle(!shouldShow);
        $('#dispatch-export-link').toggle(!!shouldShow)  // toggle argument need to be === true or it will animate.
            .attr('href', BASE_DISPATCH_EXPORT_URL  + $('#actual-dispatch-date-from').val() + '/' + $('#actual-dispatch-date-to').val());
    });



    $('input:radio[name="order_filter"]').change(function() {
        const enabled = $('#date-from').val() && $('#date-to').val();
        var type = $('input[name=order_filter]:checked').val();

        if (enabled) {
            $('#invoice-link').attr('href', BASE_INVOICE_URL + type + '/' + $('#date-from').val() + '/' + $('#date-to').val());
        } else {
            $('#placed_date').show();
        }
    });

    $('#date-from').datepicker({
        dateFormat: window.dateFormat,
        onClose: function (selectedDate) {
            $('#date-to').datepicker('option', 'minDate', selectedDate);
        }
    });
    $('#date-to').datepicker({
        dateFormat: window.dateFormat,
        onClose: function (selectedDate) {
            $('#date-from').datepicker('option', 'maxDate', selectedDate);
        }
    });

    $('#sales-date-from').datepicker({
        dateFormat: window.dateFormat,
        onClose: function (selectedDate) {
            $('#sales-date-to').datepicker('option', 'minDate', selectedDate);
        }
    });
    $('#sales-date-to').datepicker({
        dateFormat: window.dateFormat,
        onClose: function (selectedDate) {
            $('#sales-date-from').datepicker('option', 'maxDate', selectedDate);
        }
    });
    $('#dispatch-date-from').datepicker({
        dateFormat: window.dateFormat,
        onClose: function (selectedDate) {
            $('#dispatch-date-to').datepicker('option', 'minDate', selectedDate);
        }
    })
    .datepicker("setDate", new Date());;

    $('#dispatch-date-to').datepicker({
        dateFormat: window.dateFormat,
        onClose: function (selectedDate) {
            $('#dispatch-date-from').datepicker('option', 'maxDate', selectedDate);
        }
    })
    .datepicker("setDate", new Date());;

    $('#actual-dispatch-date-from').datepicker({
        dateFormat: window.dateFormat,
        onClose: function (selectedDate) {
            $('#actual-dispatch-date-to').datepicker('option', 'minDate', selectedDate);
        }
    })
    .datepicker("setDate", new Date());;

    $('#actual-dispatch-date-to').datepicker({
        dateFormat: window.dateFormat,
        onClose: function (selectedDate) {
            $('#actual-dispatch-date-from').datepicker('option', 'maxDate', selectedDate);
        }

    })
    .datepicker("setDate", new Date());
    ;
});

