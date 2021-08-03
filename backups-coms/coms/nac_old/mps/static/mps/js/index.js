$(function() {
    //$('#placed_date').hide();


    $('#placed_date').change(function() {

        const shouldShow = $('#date-from').val() && $('#date-to').val();

        var s1 = $('#date-from').val();
        dd = s1.substring(0, 2);
        mn = s1.substring(s1.indexOf("-") + 1, s1.lastIndexOf("-"))
        yy = s1.substring(s1.lastIndexOf("-") + 1)
        dtf = yy + "-" + mn + "-" + dd

        s1 = $('#date-to').val();
        dd = s1.substring(0, 2);
        mn = s1.substring(s1.indexOf("-") + 1, s1.lastIndexOf("-"))
        yy = s1.substring(s1.lastIndexOf("-") + 1)
        dtt = yy + "-" + mn + "-" + dd

        $('#filter_link')
            .attr('href', BASE_SALES_URL + "schedule" + '/' + dtf + '/' + dtt + '/');
        //.attr('href', BASE_INVOICE_URL + type + '/' + $('#date-from').val() + '/' + $('#date-to').val());
        console.log(BASE_SALES_URL + "schedule" + '/' + dtf + '/' + dtt + '/');
    }).change();

    $('#date-from').datepicker({
        dateFormat: window.dateFormat,
        onClose: function(selectedDate) {
            $('#date-to').datepicker('option', 'minDate', selectedDate);
        }
    });

    $('#date-to').datepicker({
        dateFormat: window.dateFormat,
        onClose: function(selectedDate) {
            $('#date-from').datepicker('option', 'maxDate', selectedDate);
        }
    });

    $('#dealership').change(function() {
        const shouldShow = $('#sales-date-from').val() && $('#sales-date-to').val() && $('#dealership').val();
        $('#sales-link-disabled').toggle(!shouldShow);
        var dtf = $('#sales-date-from').val();
        var dtt = $('#sales-date-to').val();
        var did1 = $('#dealership').val();
        $('#sales-link').toggle(!!shouldShow) // toggle argument need to be === true or it will animate.
            //.attr('href', BASE_TT_URL + '/' + $('#dealership').val() + '/' + $('#sales-date-from').val() + '/' + $('#sales-date-to').val());
            .attr('href', BASE_TT_URL + $('#dealership').val() + $('#sales-date-from').val() + $('#sales-date-to').val());

    }).change();

    $('#order_date').change(function() {
        const shouldShow = $('#sales-date-from').val() && $('#sales-date-to').val() && $('#dealership').val();
        $('#sales-link-disabled').toggle(!shouldShow);
        $('#sales-link').toggle(!!shouldShow) // toggle argument need to be === true or it will animate.
            .attr('href', BASE_TT_URL + $('#dealership').val() + $('#sales-date-from').val() + $('#sales-date-to').val());
    }).change();

    $('#sales-date-from').datepicker({
        dateFormat: window.dateFormat,
        onClose: function(selectedDate) {
            $('#sales-date-to').datepicker('option', 'minDate', selectedDate);
        }
    });
    $('#sales-date-to').datepicker({
        dateFormat: window.dateFormat,
        onClose: function(selectedDate) {
            $('#sales-date-from').datepicker('option', 'maxDate', selectedDate);

        }
    });

});