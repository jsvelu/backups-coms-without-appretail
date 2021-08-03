$(document).ready(function() {
    if (!$('body').hasClass('orders-bom')) return;

    $("#id_date_error_dialog").dialog({
        autoOpen: false,
        height: 200,
        width: 300,
        modal: true,
        buttons: {
            Close: function () {
                $(this).dialog("close");
            }
        }
    });

    $('a[data-toggle="tab"]').on('shown.bs.tab', function (e) {
        $("#hdn_supplier_tab").val($(e.target).attr('href').replace('#supplier', ''));
    });

    $("#id_start_date").change(function () {
        if ($("#id_end_date").val() == "") {
            $("#id_end_date").val($("#id_start_date").val());
        }
    });

    $("#btn_show").click(function (e) {
        if ($("#id_start_date").val().localeCompare($("#id_end_date").val()) > 0) {
            $("#id_date_error_dialog").dialog("open");
            e.preventDefault();
        }
        else {
            $("#main_form").submit();
        }
    });

});