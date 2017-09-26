var Options = {
    load: function (cb) {
        chrome.storage.local.get({
            options: {
                ItemCount: 10,
                Order: 'DESC',
                CustomPlayer: false,
                Player: null,
                CustomDownloadsFolder: false,
                DownloadsFolder: null
            }
        }, function (items) {
            cb(items.options);
        });
    },
    save: function (options) {
        chrome.storage.local.set({options: options}, function () {
            console.log('OPAL Helper: Options saved');
        });
    }
};
