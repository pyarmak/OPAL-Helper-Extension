function checkOptionExists(option) {
  return option && option.length !== 0;
}

function updateNag(name, optionEnabled, optionValue) {
  console.log(`Name: ${name}\nEnabled: ${optionEnabled}\nValue: ${checkOptionExists(optionValue)}`);
  if (optionEnabled === true && !checkOptionExists(optionValue)) {
    document.getElementById(`${name}-nag`).setAttribute('style', 'display: block');
    document.getElementById(`${name}Field`).setAttribute('class', 'item nagging-color nagging-border');
  } else {
    document.getElementById(`${name}-nag`).setAttribute('style', 'display: none');
    document.getElementById(`${name}Field`).setAttribute('class', 'item');
    document.getElementById(name).value = optionValue;
  }
}

window.addEventListener('load', function (e) {
  Options.load(function (options) {
    let player = options.Player;
    let folder = options.DownloadsFolder;
    Array.prototype.slice.call(document.querySelectorAll('input[type="range"]'))
      .forEach(function (elm) {
        elm.value = options[elm.id];
        var output = document.getElementById(elm.id + '_val');
        output.textContent = elm.value;
        elm.addEventListener('change', function (e) {
          options[e.target.id] = parseInt(e.target.value, 10);
          output.textContent = e.target.value;
          Options.save(options);
        }, false);
      });
    Array.prototype.slice.call(document.querySelectorAll('input[name="Order"]'))
      .forEach(function (elm) {
        if (options.Order === elm.value) {
          elm.checked = true;
        }
        elm.addEventListener('click', function (e) {
          options.Order = elm.value;
          Options.save(options);
        }, false);
      });
    document.querySelectorAll('input[type="checkbox"]').forEach((elm) => {
      let field = elm.parentNode.parentNode.parentNode.nextSibling;
      let name = field.id.substring(0, 1).toUpperCase() + field.id.substring(1);
      let optionName = `Custom${name}`;
      elm.checked = options[optionName];
      elm.addEventListener('click', (e) => {
        options[optionName] = elm.checked;
        Options.save(options);
        updateCustomFields();
        updateNag('player', options.CustomPlayer, player);
        updateNag('downloadsFolder', options.CustomDownloadsFolder, folder);
      });
    });
    updateCustomFields();
    updateNag('player', options.CustomPlayer, player);
    updateNag('downloadsFolder', options.CustomDownloadsFolder, folder);
    bindTextInputListeners(options);
  });
}, false);

function updateCustomFields() {
  let checkboxes = document.getElementsByClassName('switch');
  for (let box of checkboxes) {
    let enabled = false;
    enabled = box.firstChild.firstElementChild.checked;
    let fieldset = box.parentElement.parentElement;
    for (let field of fieldset.childNodes) {
      if (field.nodeType === Node.ELEMENT_NODE && field.tagName === 'INPUT') {
        if (!enabled) field.setAttribute('disabled', '');
        else field.removeAttribute('disabled');
      }
    }
  }
}

function bindTextInputListeners(options) {
  document.getElementById('player').addEventListener('keyup', function (e) {
    let timeout;
    if (timeout) window.clearTimeout(timeout);
    timeout = window.setTimeout(function () {
      options.Player = e.target.value;
      updateNag('player', options.CustomPlayer, options.Player);
      Options.save(options);
    }, 1000);
  }, false);
  document.getElementById('downloadsFolder').addEventListener('keyup', function (e) {
    let timeout;
    if (timeout) window.clearTimeout(timeout);
    timeout = window.setTimeout(function () {
      options.DownloadsFolder = e.target.value;
      updateNag('downloadsFolder', options.CustomDownloadsFolder, options.DownloadsFolder);
      Options.save('downloadsFolder', options);
    }, 1000);
  }, false)
}

(function(i,s,o,g,r,a,m){i['GoogleAnalyticsObject']=r;i[r]=i[r]||function(){
  (i[r].q=i[r].q||[]).push(arguments)},i[r].l=1*new Date();a=s.createElement(o),
  m=s.getElementsByTagName(o)[0];a.async=1;a.src=g;m.parentNode.insertBefore(a,m)
})(window,document,'script','https://www.google-analytics.com/analytics.js','ga');

ga('create', 'UA-47599004-4', 'auto');
ga('set', 'checkProtocolTask', function(){}); // Removes failing protocol check. @see: http://stackoverflow.com/a/22152353/1958200
ga('require', 'displayfeatures');
ga('send', 'pageview');

