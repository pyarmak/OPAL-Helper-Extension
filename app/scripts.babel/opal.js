'use strict';

function _getSessionInformation(searchText) {
  const labelTags = document.getElementsByTagName('label');
  for (const label of labelTags) {
    if (label.innerText === searchText) {
      return label.parentElement.nextSibling.nextSibling.innerText;
    }
  }
}

function getSessionTitle() {
  return _getSessionInformation('Session/Rotation');
}

function getSessionCourse() {
  return _getSessionInformation('Course/Program');
}

function addVideoButtons() {
  let aTags = document.getElementsByTagName('a');
  let searchText = 'session video';

  Options.load((options) => {
    for (const tag of aTags) {
      if (tag.innerText.toLowerCase() === searchText) {
        // tag.insertAdjacentHTML('afterend', '&nbsp;<button class="video_download">Download</button>');
        // tag.nextElementSibling.addEventListener('click', (e) => {
        //   e.preventDefault();
        //   let folder = (options.CustomDownloadsFolder) ? options.DownloadsFolder : 'DEFAULT';
        //   chrome.runtime.sendMessage({
        //     type: 'video_download',
        //     url: tag.href,
        //     dest: folder,
        //     title: getSessionTitle(),
        //     course: getSessionCourse()
        //   });
        //   createProgressBar(tag.nextElementSibling);
        // });
        tag.addEventListener('click', (e) => {
          e.preventDefault();
          let player = (options.CustomPlayer) ? options.Player : 'DEFAULT';
          chrome.runtime.sendMessage({
            type: 'lecture_page_video_play',
            url: tag.href,
            title: getSessionTitle(),
            player: player,
            course: getSessionCourse()
          });
        });
      }
    }
  });
}

function addResourceDownloadButton() {
  let labels = document.getElementsByTagName('label');
  let searchText = 'Learning Resources';

  for (const label of labels) {
    if (label.innerText === searchText) {
      let resourceContainer = label.parentElement.parentElement.nextElementSibling.firstElementChild;
      let buttonContainer = resourceContainer.children[resourceContainer.childElementCount - 2];
      buttonContainer.insertAdjacentHTML('afterend', '<button id="resource_download">Download All Using OPAL Helper</button>');
      buttonContainer.nextElementSibling.addEventListener('click', (e) => {
        e.preventDefault();
        let resources = [];
        for (let i = 0; i < resourceContainer.childElementCount - 3; i++) {
          const resource = resourceContainer.children[i].children[2];
          resources.push({
            title: resource.innerText.replace(resource.firstElementChild.innerText, ''),
            link: resource.href,
            course: getSessionCourse()
          });
        }
        chrome.runtime.sendMessage({
          type: 'resource_download',
          resources: resources,
          title: getSessionTitle(),
          course: getSessionCourse()
        });
      });
    }
  }
}

function processLecturePage() {
  addVideoButtons();
  addResourceDownloadButton();
}

function createProgressBar(element) {
  const wrapper = document.createElement('div');
  const progress = document.createElement('div');
  wrapper.setAttribute('class', 'progress-wrap progress');
  progress.setAttribute('class', 'progress-bar progress');
  wrapper.appendChild(progress);
  element.parentNode.replaceChild(wrapper, element);
}

function removeProgressBar() {
  let wrapper = document.getElementsByClassName('progress-wrap')[0];
  const complete = document.createElement('span');
  complete.setAttribute('id', 'download-complete');
  complete.innerText = 'Download Complete!';
  wrapper.parentNode.replaceChild(complete, wrapper);
}

function processVideoPage() {
  const myRegexp = /vlc\.playlist\.add\("(.*?)",/g;
  const url = myRegexp.exec(document.all[0].outerHTML)[1];

  Options.load(function (options) {
    let player = (options.CustomPlayer) ? options.Player : 'DEFAULT';
    chrome.runtime.sendMessage({
      type: 'video_play',
      url: url,
      player: player,
    });
  });

  window.setTimeout(function () {
    var theParent = document.getElementsByTagName('body')[0];
    var theKid = document.createElement('div');
    var closeBtn = document.createElement('span');
    closeBtn.setAttribute('class', 'closebtn');
    closeBtn.onclick = function () {
      this.parentElement.style.display = 'none'
    };
    closeBtn.innerHTML = '&times;';
    theKid.setAttribute('class', 'alert');
    theKid.innerHTML = 'OPAL Helper: Unable to reach host - please check on facebook for the latest host application package.';

    theKid.appendChild(closeBtn);

// append theKid to the end of theParent
    theParent.appendChild(theKid);

// prepend theKid to the beginning of theParent
    theParent.insertBefore(theKid, theParent.firstChild);
  }, 5000);

  var garbage = document.getElementById('videoOptions');
  garbage.parentElement.removeChild(garbage);
}

function moveProgressBar(percent) {
  const progressBar = document.getElementsByClassName('progress-bar')[0];
  progressBar.setAttribute('style', `width: ${percent}%`);
}

(function () {

  chrome.runtime.onMessage.addListener((message) => {
    switch (message.type) {
      case 'download_progress':
        moveProgressBar(message.value);
        break;
      case 'download_complete':
        removeProgressBar();
        break;
      default:
        console.log(message);
    }
  });

  const path = window.location.pathname;
  const userPattern = /\/user\/(.*)\//g;

  if (path.indexOf('editMultiEventTopic') > 0 || path.indexOf('dispatchEventTopic') > 0) {
    processLecturePage();
  } else if (path.indexOf('video') > 0) {
    processVideoPage();
  } else if (path.indexOf('user') > 0) {
    const username = userPattern.exec(path)[1];
    chrome.storage.local.set({
      username: username
    });
  }

})();
