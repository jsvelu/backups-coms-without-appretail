$(document).ready(function() {
    if (!$('body').hasClass('warranty-listing')) return;

    $( "#id_chassis" ).autocomplete({
        source: "lookup?op=match_chassis&term=" + $( "#id_chassis" ).text(),
        minLength: 2,
        select: function (event, ui) {
            // Set autocomplete element to display the label
            this.value = ui.item.label;

            // Store value in hidden field
            $('#hdn_order_id').val(ui.item.id);

            // Prevent default behaviour
            return false;
        }
    });

    $('#btn_chassis_next').on('click', function(){
        if ($('#hdn_order_id').val().trim().length > 0)
            window.location.href = 'claim/' + $('#hdn_order_id').val();
        else
            show_chassis_select();
    });


    function show_chassis_select() {
        $( "#dlg_select_chassis" ).dialog( "open" );
    }

    $("#dlg_select_chassis").dialog({
        modal: true,
        autoOpen: false,
        buttons: {
            Ok: function () {
                $(this).dialog("close");
            }
        }
    });

    $('a[data-toggle="tab"]').on('shown.bs.tab', function(e){
        //save the latest tab using a cookie:
        Cookies.set('last_tab', $(e.target).attr('href'));
    });

      //activate latest tab, if it exists:
    var last_tab = Cookies.get('last_tab');

    if (!last_tab) {
        last_tab = "#chassis";
    }

    $('ul.nav-tabs').children().removeClass('active');
    $('a[href='+ last_tab +']').parents('li:first').addClass('active');
    $('div.tab-content').children().removeClass('active').removeClass('in');
    $(last_tab).addClass('active').addClass('in');

});