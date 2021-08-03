$(document).ready(function() {
    if (!$('body').hasClass('portal-photomanager')) return;

    var context = null;
    var hidden_context = null;
    var canvas = null;
    var hidden_canvas = null;

    function read_image() {
        if ( this.files && this.files[0] ) {
            var file_reader= new FileReader();
            file_reader.onload = function(e) {
                var display_image = new Image();
                display_image.onload = function() {
                    put_image_on_canvas(context, display_image, 120, 90);
                    put_image_on_canvas(hidden_context, display_image, 1024, 768);

                    var image_data = hidden_canvas[0].toDataURL("img/png");
                    image_data = image_data.replace('data:image/png;base64,', '');
                    $("#hdn_pic_data").val(image_data);
               };
               display_image.src = e.target.result;
            };
            file_reader.readAsDataURL( this.files[0] );
        }
    }

    function put_image_on_canvas(canvas_context, img, canvas_width, canvas_height)
    {
        canvas_context.clearRect(0, 0, canvas_width, canvas_height);

        if (img.height <= canvas_height && img.width <= canvas_width) {
            canvas_context.canvas.width = img.width;
            canvas_context.canvas.height = img.height;
            canvas_context.drawImage(img, 0, 0);
        }
        else if ((img.height/img.width) * canvas_width/canvas_height >= 1.0) {
            canvas_context.canvas.width = img.width * (canvas_height/img.height);
            canvas_context.canvas.height = canvas_height;
            canvas_context.drawImage(img, 0, 0, img.width * (canvas_height/img.height), canvas_height);
        }
        else {
            canvas_context.canvas.width = canvas_width;
            canvas_context.canvas.height = img.height * (canvas_height / img.width);
            canvas_context.drawImage(img, 0, 0, canvas_width, img.height * (canvas_height / img.width));
        }
    }

    canvas  = $("#my_canvas");
    context = canvas[0].getContext("2d");

    hidden_canvas  = $("#my_canvas_hidden");
    hidden_context = hidden_canvas[0].getContext("2d");

    $("#file_upload")[0].addEventListener("change", read_image, false);

    $('.a-delete-image').click(function(e) {
        e.preventDefault();
        $('#hdn_op').val('delete');
        $('#hdn_deletable_image_id').val($(this).attr('id').replace('a_delete_image', ''));
        $('#listing_form').submit();
    });

    $(".image-manager-thumbnail").on("click", function() {
        $('#imagepreview').attr('src', $(this).attr('src'));
        $('#imagemodal').modal('show');
    });

    $('#btn_save').click(function(e) {
        e.preventDefault();
        $('#hdn_op').val('update');
        $('#listing_form').submit();
    });
});