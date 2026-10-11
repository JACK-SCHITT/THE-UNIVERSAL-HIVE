/* Unactivated shell shows the salute and nothing else.
   No location. No report. No delete. */
(function () {
  var KEY = "HIVE-DEMO-001";
  var LIMIT = 10 * 60 * 1000;
  var issued = sessionStorage.getItem("hive_key") === KEY;
  var at = Number(sessionStorage.getItem("hive_key_at") || 0);
  var live = issued && Date.now() - at < LIMIT;
  if (live) {
    var left = Math.max(0, LIMIT - (Date.now() - at));
    setTimeout(function () {
      sessionStorage.removeItem("hive_key");
      location.reload();
    }, left);
    return;
  }
  sessionStorage.removeItem("hive_key");
  sessionStorage.removeItem("hive_key_at");
  var src = location.pathname.indexOf("/demos/") !== -1 && !/\/demos\/index\.html$/.test(location.pathname) && !/\/demos\/$/.test(location.pathname)
    ? "../krackerjack-salute.jpg"
    : "krackerjack-salute.jpg";
  document.body.innerHTML = "";
  document.body.style.margin = "0";
  document.body.style.background = "#111";
  var img = document.createElement("img");
  img.src = src;
  img.alt = "The Kracker Jack Salute";
  img.style.cssText = "display:block;width:100%;height:100vh;object-fit:contain;background:#111";
  document.body.appendChild(img);
})();
