console.log("Javascript is alive!");

window.addEventListener("load", initApp, false);

function initApp () {
    console.log("Initializing...");

    document.addEventListener("keydown", processKeyDown);


    $('span').on('mouseenter', function() {
        $(this).addClass('pulse');
        var e = $(this).find('.description');
        if (e.length) {
            e.css('opacity', 1);
            autosize(e);
        }
        /*
            var e = $('<textarea class="description"></textarea>');
            $(this).append(e);
            //var index = $('span').index(this));
            var index = $(this).index();
            var desc = '';
            if (text[index].tag === 'tip') {
                desc = '*** HOT TIP ***\r\r';
            }
            desc += text[index].text;
            e.text(desc);
            autosize(e);
        */
    });
    $('span').on('mouseleave', function() {
        $(this).removeClass('pulse');
        var e = $(this).find('.description');
        if (e.length) {
            e.css('opacity', 0);
        }
    });
}

function processKeyDown(ev) {
    switch (ev.keyCode)
    {
        default:
            console.log("Pressed key: " + ev.keyCode);
    }
}
