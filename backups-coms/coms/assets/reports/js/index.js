$(function() {
    $('#placed_date').hide();

    $('#show').change(function() {
        const shouldShow = $('#show').val();
        $('#runsheet-link-disabled').toggle(!shouldShow);
        $('#runsheet-link').toggle(!!shouldShow)  // toggle argument need to be === true or it will animate.
            .attr('href', BASE_RUNSHEET_URL + shouldShow);

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
});
