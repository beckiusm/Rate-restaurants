$("#rateRestaurant").bind('rated', function (event, value) {
    console.log(value);
    $('#reviewScore').val(value);
});

$("table").DataTable();

$(document).on("click", "table td", (event) => {
    let id = $(event.target).parent().attr("id");
    location.href = "/restaurants/" + id;
});