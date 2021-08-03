$(document).ready(function() {
    if (!$('body').hasClass('warranty-claim')) return;

    $( "#id_item" ).autocomplete({
        source: "../lookup?op=match_item&term=" + $( "#id_item" ).text(),
        minLength: 2,
        select: function (event, ui) {
            // Set autocomplete element to display the label
            this.value = ui.item.label;

            // Store value in hidden field
            $('#hdn_item_id').val(ui.item.id);

            // Prevent default behaviour
            return false;
        }
    });

    $('input[type=file]').change(function() {
        form_id_str = '#frm_edit_claim_' + $(this).attr('id').replace('file_upload_', '');
        $(form_id_str).submit();
    });

    $(".lnk-claim-images").on("click", function() {
        $('#imagemodal_' + $(this).attr('id').replace('lnk_claim_images_', '')).modal('show');
    });

});