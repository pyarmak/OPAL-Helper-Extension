function EntryManager(id, count, order) {
    this._container = document.getElementById(id);
    this.init(count, order);
}
EntryManager.prototype = {
    _CURRENT_CLASS: 'current',
    _HIDDEN_CLASS: 'hidden',
    _container: null,
    _items: [],
    init: function (count, order) {
        this._container.className = 'loading';
        this._container.innerHTML = '';
        this._items = [];
        var self = this;
        chrome.storage.sync.get({history: []}, function (items) {
            let history = (order === 'ASC') ? items.history : items.history.reverse();
            history.splice(count);
            for (let item of history) {
                self._items.push({
                    elm: self._addElm(item),
                    data: item
                });
            }
            self._container.className = 'collection';
        });
    },
    _addElm: function (item) {
      var self = this;
      var link = document.createElement('a');
      link.setAttribute('class', 'collection-item');
      let video_link = document.createElement('a');
      var video = document.createElement('i');
      video.setAttribute('class', 'material-icons circle');
      video.innerHTML = 'play_circle_filled';
      link.href = item.url;
      link.title = 'Go to lecture page';
      link.target = '_blank';
      const title = (item.title) ? ` - ${item.title}` : '';
      link.innerHTML = item.sessionId + title;
      video_link.setAttribute('class', 'secondary-content');
      video_link.appendChild(video);
      video_link.setAttribute('title', 'Go to stream video');
      link.appendChild(video_link);

      link.addEventListener('click', e => ga('send', 'event', 'Popup', 'lecture'));

      video.addEventListener('click', function (e) {
        e.preventDefault();
        ga('send', 'event', 'Popup', 'video');
        chrome.tabs.create({url: item.vidLink});
      });

      this._container.appendChild(link);
      return link;

    }
};

window.addEventListener('load', function (e) {
  Options.load(function (options) {
    var em = new EntryManager('entries', options.ItemCount, options.Order);
  });

  document.getElementsByClassName('brand-logo')[0]
    .addEventListener('click', function (e) {
      var button = e.button;
      setTimeout(function () {
        chrome.tabs.create({
          url: 'https://opal.med.umanitoba.ca',
          selected: (button != 1)
        });
      }, 0);
    }, false);
}, false);

(function(i,s,o,g,r,a,m){i['GoogleAnalyticsObject']=r;i[r]=i[r]||function(){
  (i[r].q=i[r].q||[]).push(arguments)},i[r].l=1*new Date();a=s.createElement(o),
  m=s.getElementsByTagName(o)[0];a.async=1;a.src=g;m.parentNode.insertBefore(a,m)
})(window,document,'script','https://www.google-analytics.com/analytics_debug.js','ga');

ga('create', 'UA-47599004-4', 'auto');
ga('set', 'checkProtocolTask', function(){}); // Removes failing protocol check. @see: http://stackoverflow.com/a/22152353/1958200
ga('require', 'displayfeatures');
ga('send', 'pageview');
