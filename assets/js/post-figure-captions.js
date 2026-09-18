(function () {
    var body = document.querySelector('.post-body');
    if (!body) return;
    var imgs = Array.prototype.slice.call(body.querySelectorAll('img[title]'));
    for (var i = 0; i < imgs.length; i++) {
        var img = imgs[i];
        var host = img.parentNode;
        var onlyChild = host.tagName === 'P' && host.childNodes.length === 1;

        var figure = document.createElement('figure');
        figure.className = 'post-figure';
        var figcaption = document.createElement('figcaption');
        figcaption.textContent = img.title;
        img.removeAttribute('title');

        host.parentNode.insertBefore(figure, host);
        figure.appendChild(img);
        figure.appendChild(figcaption);
        if (onlyChild) host.remove();
    }
})();
