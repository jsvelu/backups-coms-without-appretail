$(document).ready(function() {
    if (!$('body').hasClass('crm-emailbroadcast')) return;

    function format_am_pm(date) {
        var hours = date.getHours();
        var minutes = date.getMinutes();
        var ampm = hours >= 12 ? 'pm' : 'am';
        hours = hours % 12;
        hours = hours ? hours : 12; // the hour '0' should be '12'
        minutes = minutes < 10 ? '0' + minutes : minutes;
        var time_string = hours + ':' + minutes + ' ' + ampm;
        return time_string;
    }

    $('#select_email_template').change(function(){
        template_id = $(this).children(":selected")[0].value;
        if (template_id != '')
        {
            $.get( "../get_email_template/?id=" + template_id, function(data ) {
                $('#email_subject').val(data.subject);
                CKEDITOR.instances['email_body'].setData(data.message);
            });
        }
    });

    $('input[type=file]').change(function() {
        $("form").submit();
    });

    $("input:radio[name=schedule_selection]").click(function(e){

        if($(this).val() == 'now') {
            $("#dtp_schedule").attr("disabled", "disabled");
            $("#txt_test_recipient").hide();
    	}

        if($(this).val() == 'time') {
            $("#dtp_schedule").removeAttr("disabled");
            $("#txt_test_recipient").hide();
        }

        if($(this).val() == 'test') {
            $("#txt_test_recipient").show();
        }
    });

    $('#dtp_schedule').datetimepicker({
        timeInput: true,
        dateFormat: 'dd/mm/yy',
	    timeFormat: "hh:mm tt",
        showOn: "button",
        buttonImage: "/static/crm/images/calendar.png",
        buttonImageOnly: true,
        buttonText: "Select date and time"
    });

    var current_date = new Date();
    var now_string = ("0" + current_date.getDate()).slice(-2) + "/"
                + ("0" + (current_date.getMonth() + 1)).slice(-2) + "/"
                + current_date.getFullYear() + " "
                + format_am_pm(current_date);
    $('#dtp_schedule').val(now_string);

    CKEDITOR.replace('email_body');
});
