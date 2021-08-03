$(document).ready(function() {
    if (!$('body').hasClass('caravans-skuimport')) return;

    $("table").find("tr").click(function (ev) {
        var el = $(this).find("td > input[type='checkbox']");
        if (el[0] != ev.target) {
            var current = el.prop('checked');
            el.prop('checked', !current);
        }
    });

    $("table").find("#toggle-checkboxes").click(function () {
        var checked = $(this).prop('checked');
        $("table").find("tr > td > input[type='checkbox']").prop('checked', checked);
    });

    // TODO: Why is this not jquery?
    //code pertaining to image upload
    var files,
        file,
        extension,
        input = document.getElementById("id_image_directory"),
        output = document.getElementById("file_output");

    input.addEventListener("change", function(e) {
        files = e.target.files;
        output.innerHTML = "";

        for (var i = 0, len = files.length; i < len; i++) {
            file = files[i];
            extension = file.name.split(".").pop();
            output.innerHTML += "<li class='type-" + extension + "'>" + file.name + "</li>";
        }
    }, false);
});

