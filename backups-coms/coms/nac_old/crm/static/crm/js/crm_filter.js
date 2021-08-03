$(document).ready(function() {
    // TODO: can this be restricted to run only on certain pages?

    $('.select2-select-btn-all').click(function () {
        var select2_name = $(this).data('selectName');
        var $selected_element = $('.django-select2').filter("select[name='" + select2_name + "']");
        var all_values = $selected_element.find('option').map(function () {
            if (this.value) {
                return this.value;
            }
        }).get();

        var $select2_element = $selected_element.select2();
        $select2_element.val(all_values).trigger("change");
    });

    $('.select2-select-btn-none').click(function () {
        var select2_name = $(this).data('selectName');
        var $select2_element = $('.django-select2').filter("select[name='" + select2_name + "']").select2();
        $select2_element.val([]).trigger("change");
    });
});
