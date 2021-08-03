$(document).ready(function() {
    $('input[type="submit"]').addClass('btn');
    $('[title]').tooltip();

    // close the slider on click
    $(document).on('click', function (event) {
        if (!$(event.target).closest('#slidingNavContainer').length &&
                !$(event.target).closest('#slidingNavButton').length) {
            $('#slidingNavContainer').removeClass('open');
        }
    });

    $("#lnk_help").on("click", function() {
        var frametarget = $(this).attr('href');
        $('#iframe_help').attr("src", frametarget );
        $('#dv_help_modal').modal({show: true});
        return false;
    });
});