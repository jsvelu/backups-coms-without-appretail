$(document).ready(function() {
    if (!$('body').hasClass('crm-addactivity')) return;

    $("#dv_dealer_rep").hide();

    $("#id_lead_activity_type").change(function() {
        var activity_type = $("#id_lead_activity_type option:selected").text();
        if (activity_type == "Sales Staff Appointment")
        {
            $("#dv_dealer_rep").fadeIn(305);
        }
        else
        {
            $("#dv_dealer_rep").fadeOut(500);
        }
    });
});