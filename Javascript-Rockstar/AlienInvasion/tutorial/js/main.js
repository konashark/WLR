console.log("Javascript is alive!");

window.addEventListener("load", initApp, false);

function initApp () {

    $('span').on('mouseenter', function() {
        $(this).addClass('pulse');
        var e = $(this).find('.description');
        if (e.length) {
            e.css({'opacity': 1, 'z-index': 99 });
            autosize(e);
        }
    });

    $('span').on('mouseleave', function() {
        $(this).removeClass('pulse');
        var e = $(this).find('.description');
        if (e.length) {
            e.css({'opacity': 0, 'z-index': 1 });
        }
    });
}
