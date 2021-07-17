// for the canvas element:
// mousedown
// mousemove
// mouseup
console.log("script is linked");
(function () {
    var canvas = $("#canvas");
    var ctx = document.getElementById("canvas").getContext("2d");
    var x;
    var y;

    //later I have to hide the input lookup >>toDataURL

    canvas.on("mousedown", (e) => {
        console.log("mouse is down");
        ctx.moveTo(x, y);
        x = e.offsetX;
        y = e.offsetY;
        ctx.beginPath();
        canvas.on("mousemove", (e) => {
            console.log("mouse is moving");
            x = e.offsetX;
            y = e.offsetY;
            ctx.lineTo(x, y);
            ctx.stroke();
            let dataURL = canvas[0].toDataURL();
            $("#hiddenInput").val(dataURL);
            console.log("dataURL: ", dataURL);
        });
        $(document).on("mouseup", () => {
            console.log("mouse is up");
            canvas.off("mousemove");
        });
    });

    $("#sub_btn").on("click", () => {
        console.log("submit button was clicked :) ");
        const firstName = $(`input[name = "first"]`).val();
        const lastName = $(`input[name = "last"]`).val();
        console.log("firstName: ", firstName);
        console.log("lastName: ", lastName);
        console.log("hiddenInput: ", `$("input[name = 'hiddenInput']")`);
    });
})();
