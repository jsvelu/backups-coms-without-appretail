
$(function () {
    $('.progress').hide();
    // $('#model').change(onChange);
    // $('#model1').change(onChange);

    $('#model1').change(function(){
        $('#series1')
        .empty()
        .append(
            $('<option>').val('').html('Select Series Manager')
        );

    let model_id = $('#model1').val();

    if(model_id)
        {
        	
        	$.each( series_list[model_id], function( index, value ){
        			 
        	$('#series1').append(
                $('<option>').val(value.production_unit).html(value.name)
            );
        });
        	$('#series1').removeAttr('disabled');
        }
    }).change();

    $('#series1').change(function(){
        
        $('#mytest').empty().append("<thead bgcolor='#ADD8E6'> <th> Month </th> <th> Open/ Close </th> </thead><tbody></tbody>");

         let month_id = $('#series1').val();


    if(month_id)
        {
        	$.each( month_list[month_id], function( index, value ){
        			 
 
        $('table tr:last')
        	if(value.open)
        	{
        		printval="Open";
        		$('#mytest tbody').append("<tr bgcolor='white'><td>" + value.month + "</td><td>" + printval + "</td></tr>");
        	}else
        	{
        		printval="Closed";
        		$('#mytest tbody').append("<tr bgcolor='pink'><td>" + value.month + "</td><td>" + printval + "</td></tr>");
        	}
            
        });
        }

     
    }).change();

     

     
});

 
 

 
 