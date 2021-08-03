
$(function () {
    const form = $('#replace-sku-form');
    const $elementsToDetermineSubmitState = $('[data-required]');
    const submit = form.find('[type="submit"]');

    const preview = $('#preview');
    const previewTable = preview.find('table');
    const masterSelector = $('#masterSelector');
    const update = $('#update');

    const progress = $('.progress');

    form.show();
    preview.hide();
    progress.hide();

    // On model select, update series list
    $('#model').change(() => {
        clearMessages();

        const seriesSelect = $('#series');
        emptySelect(seriesSelect, 'Select Series');

        const modelId = $('#model').val();
        if (!modelId) {
            return;
        }

        updateSelectContent(
            `/api/orders/replace_sku/series/${modelId}`,
            seriesSelect
        );
    }).change();

    // On category select, update department list
    $('#category').change(() => {
        clearMessages();

        const departmentSelect = $('#department');
        emptySelect(departmentSelect, 'Select Department');

        const categoryId = $('#category').val();
        const seriesId = $('#series').val();
        const modelId = $('#model').val();
        if (!categoryId) {
            return;
        }

        updateSelectContent(
            `/api/orders/replace_sku/departments/${categoryId}/${seriesId}/${modelId}`,
            departmentSelect
        );
    }).change();

    // On department select, update item lists
    $('#department, #series').change(() => {
        clearMessages();

        const skuSelects = $('#old_item, #new_item');
        emptySelect(skuSelects, 'Select SKU');

        const departmentId = $('#department').val();
        const seriesId = $('#series').val();
        const modelId = $('#model').val();
        if (!departmentId || !seriesId) {
            return;
        }

        updateSelectContent(
             `/api/orders/replace_sku/skus/${departmentId}`,
             $('#new_item')
        );

        updateSelectContent(
            `/api/orders/replace_sku/skus/${departmentId}/${seriesId}/${modelId}`,
             $('#old_item')
        );

    }).change();

    $('#with-production-dates').change((e) => {
        $('#production-dates').toggle($(e.target).is(':checked'));
    });

    $('#with-schedule-months').change((e) => {
        $('#schedule-months').toggle($(e.target).is(':checked'));
    });

    $('#month-from-show').MonthPicker({ Button: false, MonthFormat: 'M yy', AltFormat: window.dateFormat, AltField: '#month-from' });
    $('#month-to-show').MonthPicker({ Button: false, MonthFormat: 'M yy', AltFormat: window.dateFormat, AltField: '#month-to' });

    $elementsToDetermineSubmitState.change(() => {
        clearMessages();

        // Disabled if any of these elements don't have a value
        const hasMissingValue = $elementsToDetermineSubmitState
                .not('[data-required-group]')
                .filter((index,element) => (element.type === 'checkbox') ? !element.checked : !element.value)
                .length > 0;

        // Disabled if none of these elements don't have a value
        const hasAtLeastOneValue = $elementsToDetermineSubmitState
                .filter('[data-required-group]')
                .filter((index,element) => (element.type === 'checkbox')? element.checked: element.value)
                .length > 0;

        submit.prop('disabled', hasMissingValue || !hasAtLeastOneValue);
    }).change();

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

    form.submit((event) => {
        event.preventDefault();
        clearMessages();

        progress.show();
        $.post('/api/orders/replace_sku/preview/', {
            csrfmiddlewaretoken: getCookie('csrftoken'),
            withoutProductionDates: $('#without-production-dates').is(':checked'),
            withProductionDates: $('#with-production-dates').is(':checked'),
            withScheduleMonths: $('#with-schedule-months').is(':checked'),
            dateFrom: $('#date-from').val(),
            dateTo: $('#date-to').val(),
            monthFrom: $('#month-from').val(),
            monthTo: $('#month-to').val(),
            seriesId: $('#series').val(),
            modelId: $('#model').val(),
            skuId: $('#old_item').val(),
        }).success((result) => {
            const orderRows = [];
            const oddEven = ['even', 'odd'];
            $.each(result.orders, (i, order) => {
                orderRows.push(`<tr class="${oddEven[i%2]}"><td>${order.details}</td><td><input type="checkbox" value="${order.id}" /></td></tr>`);
            });

            previewTable.find('tr:has(td)').remove();
            previewTable.append(orderRows);

            previewTable.find('td [type="checkbox"]').change(() => {
                const count = previewTable.find('td [type="checkbox"]:checked').length;
                update.html(`Update ${count} orders`).prop('disabled', count == 0);
            });

            update.html(`Update 0 orders`).prop('disabled', true);
            masterSelector.prop('checked', true).change();

            form.hide();
            preview.show();

        }).fail((error) => {
            clearMessages().addClass('alert-danger').html(error.message);

        }).always(() => {
            progress.hide();
        });
    });

    $('#changeCriteria').click(() => {
        form.show();
        preview.hide();
    });

    masterSelector.change(() => {
        previewTable.find('td [type="checkbox"]')
            .prop('checked', masterSelector.prop('checked'))
            .change();
    });

    update.click(() => {
        const orderIds = Array.from(
            $('#preview')
                .find('td [type="checkbox"]:checked')
                .map((i, e) => e.value)
        );

        progress.show();
        $.post('/api/orders/replace_sku/update/', {
            csrfmiddlewaretoken: getCookie('csrftoken'),
            orderIds: orderIds,
            oldSkuId: $('#old_item').val(),
            newSkuId: $('#new_item').val(),
        }).success((result) => {

            clearMessages().addClass('alert-success').html(`${result.count} orders have been correctly updated.`);

            form.show();
            preview.hide();

        }).fail((error) => {
            clearMessages().addClass('alert-danger').html(error.responseJSON.message);

        }).always(() => {
            progress.hide();
        });
    });
});

function emptySelect(selectElement, defaultValue) {
    selectElement
        .empty()
        .append(
            $('<option>').val('').html(defaultValue)
        )
        .prop('disabled', true);
}

function updateSelectContent(url, selectElement) {
    const progress = $('.progress');
    progress.show();

    $.get(url).success((result) => {
        selectElement.prop('disabled', result.data.length == 0);

        const options = [];
        $.each(result.data, function(index, obj) {
            options.push(
                $('<option>').val(obj.id).html(obj.name)
            );
        });

        selectElement
            .append(options)
            .change();

    }).always(() => {
        progress.hide();
    });
}

function getCookie(name) {
    var cookieValue = null;
    if (document.cookie && document.cookie != '') {
        var cookies = document.cookie.split(';');
        for (var i = 0; i < cookies.length; i++) {
            var cookie = jQuery.trim(cookies[i]);
            // Does this cookie string begin with the name we want?
            if (cookie.substring(0, name.length + 1) == (name + '=')) {
                cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                break;
            }
        }
    }
    return cookieValue;
}

function clearMessages() {
    return $('#messages').attr('class', '').html('');
}
