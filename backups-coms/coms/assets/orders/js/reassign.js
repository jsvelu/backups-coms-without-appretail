

$(function () {
    $('.progress').hide();

    $('#show').change(onChange);
    $('#dealership').change(onChange);
    onChange();

    $('#customer_manager').change(function() {
        if ($('#customer_manager').val()) {
            $('#assign').removeAttr('disabled');
        } else {
            $('#assign').attr('disabled', 'disabled');
        }
    }).change();

    $('#assign').click(function() {
        $('.progress').show();
        $.post('/api/orders/reassign/' +
            $('#show').val() + '/' +
            $('#dealership').val() + '/' +
            $('#customer_manager').val(),
            {
                csrfmiddlewaretoken: getCookie('csrftoken')
            })

            .success(function() {
                $('#result')
                    .removeClass()
                    .addClass('success');
            })

            .fail(function() {
                $('#result')
                    .removeClass()
                    .addClass('failure');
            })

            .always(function(response) {
                $('#result').html(response.message);
                $('.progress').hide();
            });
    });
});

function onChange() {
    repopulateCustomerManagerList();

    if (!$('#show').val() || ! $('#dealership').val()) {
        $('#customer_manager').attr('disabled', 'disabled');
        $('#result-count').html('');
        return;
    }

    $('.progress').show();
    $.post('/api/orders/reassign/' + $('#show').val() + '/' + $('#dealership').val() + '/', {
        csrfmiddlewaretoken: getCookie('csrftoken')
    })
        .success(function(response) {
            $('#result-count').html(response.count);
            $('#customer_manager').removeAttr('disabled');

        })
        .always(function() {
            $('.progress').hide();
        });
}

function repopulateCustomerManagerList() {
    $('#customer_manager')
        .empty()
        .append(
            $('<option>').val('').html('Select Customer Manager')
        );

    let dealership_id = $('#dealership').val();

    if (dealership_id) {
        $.each(dealership_members[dealership_id], function(index, member) {
            $('#customer_manager').append(
                $('<option>').val(member.id).html(member.name)
            );
        });
    }

    $('#customer_manager').change();
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
