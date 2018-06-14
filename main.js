(function() {
  console.log("[LFG Clipboard (%o)] Running...", chrome.runtime.id);

  // A lot of this is very brittle because it's based on the DOM.

  /*
  <div class="gamertag-block">
    <a href="#" class="gamertag context-link" data-stattooltip="true" data-platform="4" data-id="" data-character="">name#12345</a>
    <a title="Send message" class="chat-link icon-link context-link-wrapper need-claimed-gamertag-to-message" href="#">
      <i class="fa fa-envelope-o"></i>
    </a>

    <!-- add copy element here -->

  </div>
  */

  const intervalMs = 3000;
  const attribute1 = 'data-gamertag';
  const className1 = 'gamertag-block';
  const className2 = 'tab';
  const className3 = 'icon-link';
  const classSentinel1 = 'lfg-clipboard';
  const classSentinel2 = 'lfg-clipboard-tab';

  // https://stackoverflow.com/a/43483323
  const copyNameToClipboard = function(name) {
    function handler(event) {
      event.clipboardData.setData('text/plain', name);
      event.preventDefault();
      document.removeEventListener('copy', handler, true);
    }

    document.addEventListener('copy', handler, true);
    const result = document.execCommand('copy');
    if (result) {
      console.log("[LFG Clipboard (%o)] Successfully copied %o to the clipboard!", chrome.runtime.id, name);
    } else {
      console.log("[LFG Clipboard (%o)] Failed to copy %o to the clipboard!", chrome.runtime.id, name);
    }
  };

  const handleClick = function (event) {
    const name =
      event.target.parentElement.classList.contains(classSentinel2)
        ? event.target.parentElement.previousElementSibling.innerText
        : event.target.parentElement.parentElement.firstChild.innerText;

    copyNameToClipboard(name);
  };

  const createClipboardElement = function(isTab) {
    const element = isTab
      ? document.createElement('span')
      : document.createElement('a');

    element.title = "Copy to clipboard";    
    element.onclick = handleClick;

    if (isTab) {
      element.className = classSentinel1 + ' ' + classSentinel2;
      element.setAttribute('style', "display: inline - block; padding: 0 7px; position: relative; font - size: 13px; left: 4px;");      
    } else {      
      element.className = classSentinel1 + ' ' + className3;
      element.href = "javascript:void(0)";
    }

    const i = document.createElement('i');
    i.className = 'fa fa-copy';

    element.appendChild(i);
    return element;
  };

  const containsClipboardElement = function(element) {
    const children = element.children;
    for (let i = 0; i < children.length; i++) {
      const child = children[i];
      if (child.classList.contains(classSentinel1)) {
        return true;
      }
    }
    return false;
  };

  const printFlat = function (root) {
    console.log("[] root: %o", root);
    const children = root.children;
    for (let i = 0; i < children.length; i++) {
      const child = children[i];
      console.log("[] child: %o", child);
    }
  };

  const runLoop = function () {
    let countAdded = 0;

    const listElements = document.getElementsByClassName(className1);
    [].forEach.call(listElements, function(element) {
      if (!containsClipboardElement(element)) {
        const anchor = createClipboardElement(false);
        element.appendChild(anchor);
        countAdded++;
      }
    });

    const tabElements = document.getElementsByClassName(className2);
    [].forEach.call(tabElements, function (tabElement) {
      if (tabElement.hasAttribute(attribute1)) {
        const element = tabElement.firstElementChild;
        if (!containsClipboardElement(element)) {
          const anchor = createClipboardElement(true);
          element.insertBefore(anchor, element.children[1]);
          countAdded++;
        }
      }
    });

    if (countAdded > 0) {
      console.log("[LFG Clipboard (%o)] Added %o elements...", chrome.runtime.id, countAdded);
    }
  };

  // ----

  runLoop();
  setInterval(runLoop, intervalMs);
})();