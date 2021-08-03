$(document).ready(function() {
    // Turn an <a href="..."> into a POST with the CSRF token
    $('.transformGetToCsrfPost').click(function() {
        var urlParts = $(this).attr('href').split('?');
        var url = urlParts[0];
        var params = $.deparam(urlParts[1] || '');
        if (params['csrfmiddlewaretoken'] === undefined) {
            params['csrfmiddlewaretoken'] = Cookies.get('csrftoken');
        }

        var $form = $('<form method="post" style="display: none;" />').attr('action', url);
        for (var i in params) {
            $form.append(
                $('<input type="hidden" />')
                    .attr('value', params[i])
                    .attr('name', i)
            );
        }
        $('body').append($form);
        $form.submit();

        return false;
    });

    // bootstrap styling hacks
    $('input[type="submit"]').addClass('btn');
    $('[title]').tooltip();
});
