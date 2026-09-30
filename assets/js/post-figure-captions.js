(function () {
    var body = document.querySelector('.post-body');
    if (!body) return;
    var imgs = Array.prototype.slice.call(body.querySelectorAll('img'));
    for (var i = 0; i < imgs.length; i++) {
        var img = imgs[i];
        if (img.closest('figure')) continue;
        var host = img.parentNode;
        var onlyChild = host.tagName === 'P' && host.childNodes.length === 1;

        var figure = document.createElement('figure');
        figure.className = 'post-figure';

        // Caption: the title attribute, or else an italic-only paragraph right
        // after a standalone image.
        var captionHTML = null, captionText = null, captionEl = null;
        if (img.title) {
            captionText = img.title;
            img.removeAttribute('title');
        } else if (onlyChild) {
            var next = host.nextElementSibling;
            if (next && next.tagName === 'P' && next.children.length === 1 &&
                next.firstElementChild.tagName === 'EM' &&
                next.textContent.trim() === next.firstElementChild.textContent.trim()) {
                captionHTML = next.firstElementChild.innerHTML;
                captionEl = next;
            }
        }

        host.parentNode.insertBefore(figure, host);
        figure.appendChild(img);
        if (captionText !== null || captionHTML !== null) {
            var figcaption = document.createElement('figcaption');
            if (captionHTML !== null) figcaption.innerHTML = captionHTML;
            else figcaption.textContent = captionText;
            figure.appendChild(figcaption);
        }
        if (captionEl) captionEl.remove();
        if (onlyChild) host.remove();
    }
})();
