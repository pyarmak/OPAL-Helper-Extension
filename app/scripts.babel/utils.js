function getSessionId(url) {
  const sessionRegexp = /session_Id=(.*?$)/g;
  return sessionRegexp.exec(url)[1];
}

function getEventId(url) {
  const eventRegexp = /eventId=(.*?&)/g;
  return eventRegexp.exec(url)[1];
}

function getWebLinkId(url) {
  const eventRegexp = /webLinkId=(.*?&)/g;
  return eventRegexp.exec(url)[1];
}

