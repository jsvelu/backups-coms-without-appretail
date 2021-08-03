$(function() {

    // $('#show').change(function() {
    //     const shouldShow = $('#show').val();
    //     $('#runsheet-link-disabled').toggle(!shouldShow);
    //     $('#runsheet-link').toggle(!!shouldShow)  // toggle argument need to be === true or it will animate.
    //         .attr('href', BASE_RUNSHEET_URL + shouldShow);
    // }).change();
    $('#show').change(function() {
        const shouldShow = $('#show').val();
        $('#runsheet-link-disabled').toggle(!shouldShow);
        $('#runsheet-link').toggle(!!shouldShow)
            .attr('href', BASE_RUNSHEET_URL + shouldShow);
    }).change();

    $('#dealership1').change(function() {
        const shouldShow = $('#dealership1').val();
        $('#stock-link-disabled').toggle(!shouldShow);
        $('#stock-link').toggle(!!shouldShow) // toggle argument need to be === true or it will animate.
            .attr('href', BASE_STOCK_URL + $('#dealership1').val());
    }).change();

    $('#dealership').change(function() {
        const shouldShow = $('#dealership').val();
        $('#sales-link-disabled').toggle(!shouldShow);
        $('#sales-link').toggle(!!shouldShow);

    }).change();

    $('input:radio[name="optradio"]').change(function() {

        var type1 = $('input[name= optradio]:checked').val();

        var thevalue = 'All Dealerships';

        $("#extract_retail_sales").prop("checked", false);
        $("#extract_stock_sales").prop("checked", false);

        if (type1 == 'AdHoc') {

            const shouldShow = $('#sales-date-from').val() && $('#sales-date-to').val() && $('#dealership').val();

            var mylen = ($("select[id$='dealership'] option:contains('" + thevalue + "')").length);
            if (mylen == 0) {
                var theoption = -1;
                var o = new Option(thevalue, theoption);
                $(o).html(thevalue);
                $("#dealership").append(o);
            }

            $("#month-display").hide();
            $("#adhoc").show();
        }

        if (type1 == 'Monthly') {

            if ($("select[id$='dealership'] option:contains('" + thevalue + "')").length > 0) {
                ($("select[id$='dealership'] option:contains('" + thevalue + "')").remove());
            }
            const shouldShow = $('#sales-month-from').val() && $('#sales-month-to').val() && $('#dealership').val();
            $("#adhoc").hide();
            $("#month-display").show();

        }


    });


    $('#dealership').change(function() {
        var type = $('input[name= extract_sales]:checked').val();
        const shouldShow = $('#extract-date-from').val() && $('#extract-date-to').val() && $('#dealership').val();
        $('#extract-link-disabled').toggle(!shouldShow);
        $('#extract-link').toggle(!!shouldShow) // toggle argument need to be === true or it will animate.
            .attr('href', BASE_EXTRACT_URL + type + '/' + $('#dealership').val() + '/' + $('#extract-date-from').val() + '/' + $('#extract-date-to').val() + '/');
    }).change();

    $('#sales-link').click(function() {
        var type1 = $('input[name= optradio]:checked').val();

        if (type1 == 'AdHoc') {
            const shouldShow = $('#sales-date-from').val() && $('#sales-date-to').val() && $('#dealership').val();
            $('#sales-link').toggle(!!shouldShow) // toggle argument need to be === true or it will animate.
                .attr('href', BASE_SALES_URL + $('#dealership').val() + '/' + $('#sales-date-from').val() + '/' + $('#sales-date-to').val() + '/');
        }
        if (type1 == 'Monthly') {
            const shouldShow = $('#sales-month-from').val() && $('#sales-month-to').val() && $('#dealership').val();
            sel_month_from = '01-' + $('#sales-month-from').val()
            sel_month_to = $('#sales-month-to').val();
            sel_date = sel_month_to.substring(sel_month_to.indexOf('-') + 1) + "-" + sel_month_to.substring(0, 2) + '-' + '01'
            var dt = new Date(sel_date);
            var month = dt.getMonth(),
                year = dt.getFullYear();
            LastDay = new Date(year, month + 1, 0).getDate();
            sel_month_to = LastDay + '-' + $('#sales-month-to').val();

            $('#sales-link').toggle(!!shouldShow) // toggle argument need to be === true or it will animate.
                .attr('href', BASE_MONTH_URL + $('#dealership').val() + '/' + sel_month_from + '/' + sel_month_to + '/');

        }
        $("#optradio1").prop("checked", false);
        $("#optradio2").prop("checked", false);
    }).click();
    //added for data-extract
    $('#data_extract_date').show();

    $('#data_extract_date').change(function() {

        var thevalue = 'All Dealerships';
        var mylen = ($("select[id$='dealership'] option:contains('" + thevalue + "')").length);
        if (mylen == 0) {
            var theoption = -1;
            var o = new Option(thevalue, theoption);
            $(o).html(thevalue);
            $("#dealership").append(o);
        }

        var type = $('input[name= extract_sales]:checked').val();
        const shouldShow = $('#extract-date-from').val() && $('#extract-date-to').val() && $('#dealership').val();
        $('#extract-link-disabled').toggle(!shouldShow);
        $('#extract-link').toggle(!!shouldShow) // toggle argument need to be === true or it will animate.
            .attr('href', BASE_EXTRACT_URL + type + '/' + $('#dealership').val() + '/' + $('#extract-date-from').val() + '/' + $('#extract-date-to').val() + '/');
        $("#optradio1").prop("checked", false);
        $("#optradio2").prop("checked", false);

    }).change();

    //for radio button link of data_extract....
    $('input:radio[name="extract_sales"]').change(function() {
        var thevalue = 'All Dealerships';
        var mylen = ($("select[id$='dealership'] option:contains('" + thevalue + "')").length);
        if (mylen == 0) {
            var theoption = -1;
            var o = new Option(thevalue, theoption);
            $(o).html(thevalue);
            $("#dealership").append(o);
        }

        const enabled = $('#extract-date-from').val() && $('#extract-date-to').val() && $('#dealership').val();
        var type = $('input[name= extract_sales]:checked').val();

        if (enabled) {
            $('#extract-link').attr('href', BASE_EXTRACT_URL + type + '/' + $('#dealership').val() + '/' + $('#extract-date-from').val() + '/' + $('#extract-date-to').val() + '/');
        } else {
            $('#data_extract_date').show();
        }
        $("#optradio1").prop("checked", false);
        $("#optradio2").prop("checked", false);
        // $("#extract_retail_sales").prop("checked", false);
        // $("#extract_stock_sales").prop("checked", false);
    });

    // current and future stock extract


    $('#dealership1').change(function() {
        var stock_type = $('input[name= extract_stock]:checked').val();
        const shouldShow = $('#dealership1').val();
        $('#extract_stock-link-disabled').toggle(!shouldShow);
        $('#extract_stock-link').toggle(!!shouldShow) // toggle argument need to be === true or it will animate.
            .attr('href', BASE_STOCK_EXTRACT_URL + '/' + stock_type + '/' + $('#dealership1').val() + '/');
    }).change();

    //for radio button link of data_extract....
    $('input:radio[name="extract_stock"]').change(function() {
        const enabled = $('#dealership1').val();
        var stock_type = $('input[name= extract_stock]:checked').val();

        if (enabled) {
            $('#extract_stock-link').attr('href', BASE_STOCK_EXTRACT_URL + '/' + stock_type + '/' + $('#dealership1').val() + '/');
        } else {
            $('#dealership1').show();
        }
    });

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

    $('#extract-date-from').datepicker({
        dateFormat: window.dateFormat,
        onClose: function(selectedDate) {
            $('#extract-date-to').datepicker('option', 'minDate', selectedDate);
        }
    });

    $('#extract-date-to').datepicker({
        dateFormat: window.dateFormat,
        onClose: function(selectedDate) {
            $('#extract-date-from').datepicker('option', 'maxDate', selectedDate);
        }
    });
});