(function() {
  console.log("[LFG Clipboard] Running...");

  const attributeClip = "lfgclip-name";
  const attributeChatStyle = "display: inline-block; padding: 0 7px; position: relative; font-size: 13px; left: 4px;";
  const getTitle = (name) => ("Copy '" + name + "' to clipboard");
  const intervalMs = 3000;
  const sentinelList = "lfgclip-sentinel-list";
  const sentinelChat = "lfgclip-sentinel-chat";
  const xpathList = "//*[contains(@class, 'gamertag-block')]";
  const xpathListName = ".//*[contains(@class, 'gamertag')]";
  const xpathChat = "//*[contains(@class, 'tab') and ./@data-gamertag]";

  function copyNameToClipboard(name) {
    const copyFrom = document.createElement('textarea');
    copyFrom.textContent = name;

    const body = document.getElementsByTagName('body')[0];
    body.appendChild(copyFrom);
    copyFrom.select();
    document.execCommand('copy');
    body.removeChild(copyFrom);
    console.log("[LFG Clipboard] Copied %o to the clipboard.", name);
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
      console.log("[LFG Clipboard] Added %o element(s).", count);
    }
  }

  // ----

  runLoop();
  setInterval(runLoop, intervalMs);
})();