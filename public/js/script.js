$("table").DataTable({
    "responsive": true
});

$(document).on("click", "table td", (event) => { // go to restaurant when clicking table row
    let id = $(event.target).parent().prop("id");
    location.href = "/restaurants/" + id;
});

$("#nav-edit-tab").click(() => {
    $.getJSON("http://localhost:3000/api/restaurants", (data) => {
        $.each(data, (key, value) => {
            $("#editListNames").append($("<option></option>").attr("value", value.id).text(value.id + " - " +value.name));
        });
    });
});

$("#nav-delete-tab").click(() => {
    $.getJSON("http://localhost:3000/api/restaurants", (data) => {
        $.each(data, (key, value) => {
            $("#deleteListNames").append($("<option></option>").attr("value", value.id).text(value.id + " - " +value.name));
        });
    });
});

$("#editForm").on("change", (event) => {
    let id = event.target.value;
    $.getJSON(`http://localhost:3000/api/restaurants/${id}`, data => {
        $.each(data[0], (key, value) => {
            console.log(key);
            $("#edit"+key).val(value);
        });
    });
});

$("#deleteForm").on("change", (event) => {
    let id = event.target.value;
    $.getJSON(`http://localhost:3000/api/restaurants/${id}`, data => {
        $.each(data[0], (key, value) => {
            console.log(key);
            $("#delete"+key).val(value);
        });
    });
});