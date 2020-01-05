$("#rateRestaurant").bind('rated', function (event, value) {
     $('#reviewScore').val(value); 
});

$("table").DataTable();