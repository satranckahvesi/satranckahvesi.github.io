(function () {
    var STORAGE_KEY = 'satranckahvesi-theme';
    var root = document.documentElement;
    var btn = document.querySelector('.theme-toggle');
    if (!btn) return;

    var media = window.matchMedia ? window.matchMedia('(prefers-color-scheme: dark)') : null;

    function isDark() {
        var explicit = root.getAttribute('data-theme');
        if (explicit === 'dark') return true;
        if (explicit === 'light') return false;
        return !!(media && media.matches);
    }

    function updateLabel() {
        btn.setAttribute('aria-label', isDark() ? 'Aydınlık temaya geç' : 'Karanlık temaya geç');
    }
    updateLabel();

    btn.addEventListener('click', function () {
        var next = isDark() ? 'light' : 'dark';
        root.setAttribute('data-theme', next);
        try { sessionStorage.setItem(STORAGE_KEY, next); } catch (e) {}
        updateLabel();
    });
})();
