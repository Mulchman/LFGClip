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

  const attributeClip = "lfgclip-name";
  const attributeChatStyle = "display: inline-block; padding: 0 7px; position: relative; font-size: 13px; left: 4px;";
  const getTitle = (name) => ("Copy '" + name + "' to clipboard");
  const intervalMs = 3000;
  const sentinelList = "lfgclip-sentinel-list";
  const sentinelChat = "lfgclip-sentinel-chat";
  const xpathList = "//*[contains(@class, 'gamertag-block')]";
  const xpathListName = ".//*[contains(@class, 'gamertag')]";
  const xpathChat = "//*[contains(@class, 'tab') and ./@data-gamertag]";

  // https://stackoverflow.com/a/43483323
  function copyNameToClipboard(name) {
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
  }

  function handleClick() {
    const name = this.getAttribute(attributeClip);
    copyNameToClipboard(name);
  }

  function createClipElement(name, isChat) {
    const element = isChat
      ? document.createElement('span')
      : document.createElement('a');

    element.title = getTitle(name);
    element.onclick = handleClick;
    element.setAttribute(attributeClip, name);

    if (isChat) {
      element.className = sentinelChat;
      element.setAttribute('style', attributeChatStyle);
    } else {
      element.className = sentinelList + ' icon-link context-link-wrapper';
      element.href = "javascript:void(0)";
    }

    const i = document.createElement('i');
    i.className = 'fa fa-copy';

    element.appendChild(i);
    return element;
  }

  function getElementsByXPath(path) {
    const retval = [];

    const elements = document.evaluate(path, document, null, XPathResult.ANY_TYPE, null);
    let iterator = elements.iterateNext();
    while (iterator) {
      retval.push(iterator);
      iterator = elements.iterateNext();
    }

    return retval;
  }

  function getNameFromListElement(element) {
    const path = xpathListName;
    const result = document.evaluate(path, element, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null);
    const name = result.singleNodeValue ? result.singleNodeValue.textContent.trim() : null;

    return name;
  }

  function getNameFromChatElement(element) {
    const name = element.getAttribute('data-gamertag');
    return name;
  }

  function elementHasSentinel(element, sentinel) {
    return element.classList.contains(sentinel);
  }

  function runLoopList() {
    let count = 0;
    const gamertags = getElementsByXPath(xpathList);
    for (let i = 0; i < gamertags.length; i++) {
      const gamertag = gamertags[i];

      if (elementHasSentinel(gamertag, sentinelList)) {
        continue;
      }

      const name = getNameFromListElement(gamertag);
      if (name) {
        const clipElement = createClipElement(name, false);
        gamertag.appendChild(clipElement);
        gamertag.classList.add(sentinelList);

        count += 1;
      }
    }

    return count;
  }

  function runLoopChat() {
    let count = 0;
    const gamertags = getElementsByXPath(xpathChat);
    for (let i = 0; i < gamertags.length; i++) {
      const gamertag = gamertags[i];

      if (elementHasSentinel(gamertag, sentinelChat)) {
        continue;
      }

      const name = getNameFromChatElement(gamertag);
      if (name) {
        const clipElement = createClipElement(name, true);

        const subElement = gamertag.firstElementChild;
        subElement.insertBefore(clipElement, subElement.children[1]);

        gamertag.classList.add(sentinelChat);
        count += 1;
      }
    }

    return count;
  }

  function runLoop() {
    let count = 0;
    count += runLoopList();
    count += runLoopChat();

    if (count > 0) {
      console.log("[LFG Clipboard (%o)] Added %o elements...", chrome.runtime.id, count);
    }
  }

  // ----

  runLoop();
  setInterval(runLoop, intervalMs);
})();