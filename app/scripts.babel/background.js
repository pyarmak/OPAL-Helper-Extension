'use strict';

const minVer = '0.5.0';
const websiteUrl = 'https://pyarmak.github.io/OPAL-Helper-Host/';
let resourceMap = [];

function getOptions(cb) {
  chrome.storage.local.get({
    options: {
      ItemCount: 10,
      Order: 'DESC',
      CustomPlayer: false,
      Player: null,
      CustomDownloadsFolder: false,
      DownloadsFolder: null,
      Convert: false,
      ExcludeDoc: true
    }
  }, function (items) {
    cb(items.options);
  });
}

chrome.runtime.onInstalled.addListener(details => {
  const ver = (typeof details.previousVersion === 'number') ? details.previousVersion.toString() : details.previousVersion;
  if (compareVersions(ver, minVer) < 0) {
    console.log(`Previous version (${details.previousVersion}) does not meet the minimum requirement: ${minVer}`);
    chrome.notifications.create({
      type: 'basic',
      iconUrl: 'images/icon-128.png',
      title: 'Host application out of date',
      message: 'Click this notification to download the latest version from the website...',
      requireInteraction: true
    }, (notificationId) => {
      chrome.notifications.onClicked.addListener((nid) => {
        if (nid === notificationId) chrome.tabs.create({url: websiteUrl}, () => chrome.notifications.clear(nid));
      });
    });
  }
});

function checkAndAdd(arr, name) {
  let found = arr.find((el, i, self) => {
    if (el.sessionId === name.sessionId) {
      self.copyWithin(i, i + 1);
      self[self.length - 1] = el;
      return true;
    }
    return false;
  });
  if (found === undefined) arr.push(name);
  return arr;
}

function openOptions() {
  if (chrome.runtime.openOptionsPage) {
    // New way to open options pages, if supported (Chrome 42+).
    return chrome.runtime.openOptionsPage();
  } else {
    return chrome.tabs.create({url: chrome.extension.getURL('options.html')});
  }
}

function itemExists(arr, item) {
  return arr.some(el => el.sessionId === item.sessionId);
}

function updateHistory(url, sessionId, title = '') {
  chrome.storage.sync.get({
    history: []
  }, function (items) {
    var item = {
      vidLink: url,
      sessionId: sessionId,
      title: title,
      url: 'https://opal.med.umanitoba.ca/curriculumExplorer/editMultiEventTopic.mvc?readOnly=true&eventId=' + getEventId(url)
    };
    if (items.history.length > 50 && !itemExists(items.history, item)) items.history.shift();
    checkAndAdd(items.history, item);
    chrome.storage.sync.set({
      history: items.history
    }, function () {
      console.log('OPAL Helper: History saved');
    });
  });
}

chrome.runtime.onMessage.addListener((data, sender) => {
  window.port = chrome.runtime.connectNative('com.opal.helper'); //TODO: version check host application and panic if shit goes wrong
  port.onDisconnect.addListener(function () {
    console.log('Disconnected from host');
  });

  const handleVideoPlay = function () {
    ga('send', 'pageview');
    ga('send', 'event', 'Videos', 'play', data.course);
    console.log('Playing a video directly...');
    if (!data.player || data.player.length === 0) {
      console.log('OPAL Helper: No player set. Closing tab and redirecting to options page...');
      return openOptions();
    }

    if (sender.tab) updateHistory(sender.tab.url, getSessionId(sender.tab.url));

    port.postMessage({type: 'play', url: data.url, player: data.player});

    port.onMessage.addListener(function (msg) {
      if (msg.Error === true) return console.log('ERROR: ' + msg.Message);
      console.log('Played: ' + msg.Message);
      // if (sender.tab)
      //   chrome.tabs.remove(sender.tab.id, function () {
      //     console.log('OPAL Helper: Cleaned up useless tab');
      //   });
    });

  };

  const handleVideoDownload = function () {
    ga('send', 'pageview');
    ga('send', 'event', 'Videos', 'download', data.course);
    if (!data.dest || data.dest.length === 0) {
      console.log('OPAL Helper: No download location set. Closing tab and redirecting to options page...')
      return openOptions();
    }
    console.log('Starting video download...');
    chrome.cookies.get({url: sender.tab.url, name: 'AUTH_TOKEN'}, (cookie) => {
      const url = `http://opal.med.umanitoba.ca/curriculumExplorer/sessionVideoUrl.mvc?eventId=${getEventId(data.url)}webLinkId=${getWebLinkId(data.url)}format=vlc&token=${cookie.value}&theatre=`;
      chrome.storage.local.get('username', (user) => {
        port.postMessage({
          type: 'download',
          url: url,
          dest: data.dest,
          name: `${getSessionId(data.url)}-lecture-video.mp4`,
          username: user.username
        });
        updateHistory(data.url, getSessionId(data.url), data.title);
        let notificationId = null;
        port.onMessage.addListener(function (msg) {
          if (msg.Error === true) return console.log('ERROR: ' + msg.Message);
          if (msg.Message !== 'DONE') {
            chrome.tabs.sendMessage(sender.tab.id, {type: 'download_progress', value: msg.Message});
            if (notificationId !== null) {
              chrome.notifications.update(notificationId, {
                progress: Number(msg.Message)
              });
            } else {
              chrome.notifications.create({
                type: 'progress',
                iconUrl: 'images/icon-128.png',
                title: 'Downloading',
                message: data.title,
                progress: Number(msg.Message)
              }, (nid) => notificationId = nid);
            }
          } else {
            chrome.tabs.sendMessage(sender.tab.id, {type: 'download_complete', value: url});
            chrome.notifications.create({
              type: 'basic',
              iconUrl: 'images/icon-128.png',
              title: 'Download Complete',
              message: `Finished downloading ${data.title}`
            });
          }
        });
      });
    });
  };

  const handleLecturePageVideoPlay = function () {
    ga('send', 'pageview');
    ga('send', 'event', 'Videos', 'play', data.course);
    console.log('Playing a video from the lecture page...');
    chrome.cookies.get({url: sender.tab.url, name: 'AUTH_TOKEN'}, (cookie) => {
      const url = encodeURI(`http://opal.med.umanitoba.ca/curriculumExplorer/sessionVideoUrl.mvc?eventId=${getEventId(data.url)}webLinkId=${getWebLinkId(data.url)}format=vlc&token=${cookie.value}&theatre=`);
      console.log(url);
      port.postMessage({type: 'play', url: url, player: data.player});
      updateHistory(data.url, getSessionId(data.url), data.title);
      port.onMessage.addListener(function (msg) {
        if (msg.Error === true) return console.log('ERROR: ' + msg.Message);
        console.log('Played: ' + msg.Message);
      });
    });
  };

  const handleResourceDownload = function () {
    ga('send', 'pageview');
    ga('send', 'event', 'Resources', 'download', data.course);
    for (let resource of data.resources) {
      let name = `OPALhelper/resources/${resource.course}/${resource.title}`;
      chrome.downloads.download({
        url: resource.link
      }, (id) => resourceMap[id] = name);
    }
  };

  switch (data.type) {
    case 'video_download':
      handleVideoDownload();
      break;
    case 'lecture_page_video_play':
      handleLecturePageVideoPlay();
      break;
    case 'video_play':
      handleVideoPlay();
      break;
    case 'resource_download':
      handleResourceDownload();
      break;
    default:
      return console.log('OPAL Helper: Got an unknown request type: ' + data.type);
  }
});

function getFilePathExtension(path) {
	let filename = path.split('\\').pop().split('/').pop();
	return filename.substr(( Math.max(0, filename.lastIndexOf('.')) || Infinity) + 1);
}

chrome.downloads.onDeterminingFilename.addListener(function (downloadItem, suggest) {
  if (downloadItem.byExtensionId !== chrome.runtime.id) return;
  const ext = getFilePathExtension(downloadItem.finalUrl);
  const filename = `${resourceMap[downloadItem.id]}.${ext}`;
  suggest({ filename: filename });
});

chrome.downloads.onChanged.addListener((downloadDelta) => {
  if (!downloadDelta.state || downloadDelta.state.current !== 'complete') return;
  chrome.downloads.search({ id: downloadDelta.id }, downloadItems => {
    let downloadItem = downloadItems[0];
    if (downloadItem.byExtensionId !== chrome.runtime.id) return;
    getOptions(function (options) {
      if (options.Convert) {
        let ext = getFilePathExtension(downloadItem.filename);
        if (ext === 'doc' || ext === 'docx') {
          if (options.ExcludeDoc) return;
        }
        port.postMessage({type: 'convert', url: downloadItem.filename});
        port.onMessage.addListener(function (msg) {
          if (msg.Error === true) return console.log('ERROR: ' + msg.Message);
          console.log('Converted: ' + msg.Message);
        });
      }
    });
  });
});

// chrome.webRequest.onCompleted.addListener(
//     function(details) {
//       if (details.url.indexOf('dispatchEventTopic') > 0) {
//         // chrome.tabs.sendMessage(details.tabId, {type: 'process_lecture_page'});
//         chrome.tabs.executeScript(details.tabId, {frameId: details.frameId, file: 'scripts/opal.js'});
//       }
//     }, {
//         urls: ['https://opal.med.umanitoba.ca/*']
//     }, []
// );

(function (i, s, o, g, r, a, m) {
  i['GoogleAnalyticsObject'] = r;
  i[r] = i[r] || function () {
    (i[r].q = i[r].q || []).push(arguments)
  }, i[r].l = 1 * new Date();
  a = s.createElement(o),
    m = s.getElementsByTagName(o)[0];
  a.async = 1;
  a.src = g;
  m.parentNode.insertBefore(a, m)
})(window, document, 'script', 'https://www.google-analytics.com/analytics.js', 'ga');

ga('create', 'UA-47599004-4', 'auto');
ga('set', 'checkProtocolTask', function () {
}); // Removes failing protocol check. @see: http://stackoverflow.com/a/22152353/1958200
ga('require', 'displayfeatures');
ga('send', 'pageview');
