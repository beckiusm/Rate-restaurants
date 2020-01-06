$("table").DataTable({
    "responsive": true
});

$(document).on("click", "table td", (event) => { // go to restaurant when clicking table row
    let id = $(event.target).parent().prop("id");
    location.href = "/restaurants/" + id;
});

if (document.cookie.indexOf("token") === -1) { //
    console.log("ingen kaka");
    $("#login").text("Login");
    $("#login").attr("href", "/login");
}