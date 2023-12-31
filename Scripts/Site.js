﻿$(function () {
    $(".articleImg, .readlesslink, .readmorelink, .desc").on("click", function (event) {
        event.preventDefault();
        toggleReadmore($(this).closest("article"));
    });

    $(".addthis_toolbox").click(function (event) { event.preventDefault(); return false; });

    function toggleReadmore(article) {
        var readmore = article.find(".readmore");

        if (readmore.length == 0)
            return;

        var readmorelink = article.find(".readmorelink");
        var readlesslink = article.find(".readlesslink");

        if (readmore.is(":visible")) {
            readmore.slideToggle(500, function () {
                readlesslink.hide();
                readmorelink.show();
            });

        } else {
            readmore.slideToggle(500);
            readmorelink.hide();
            readlesslink.show();
        }
    }

});

