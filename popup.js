// Send GET request to REST API for either scan results or issues list.
function getResults(theUrl) {
  var xmlHttp = new XMLHttpRequest();

  xmlHttp.onreadystatechange = function() {
    if (xmlHttp.readyState == 4 && xmlHttp.status == 200) {
      resText = JSON.parse(xmlHttp.responseText);
      populateResults(resText);
    }
  }

  xmlHttp.open( "GET", theUrl, true );
  xmlHttp.send( null );
}


// Send POST request to REST API in order to start Burp scan.
function startScan(theUrl, target) {
  var xmlHttp = new XMLHttpRequest();

  xmlHttp.onreadystatechange = function() {
    if (xmlHttp.readyState == 4 && xmlHttp.status == 201) {
      // Save scan ID to local storage for accessing later
      let scanId = xmlHttp.getResponseHeader("Location");
      burpAddress = document.getElementById("burp-address").value;
      burpPort = document.getElementById("burp-port").value;
      browser.storage.local.set({[target]: scanId}).then(() => {
		document.getElementById('status').innerHTML = "<h3>Scan started</h3>";
      });
    }
  }
  xmlHttp.open( "POST", theUrl, true );
  xmlHttp.setRequestHeader('Content-Type', 'application/json');
  xmlHttp.send( JSON.stringify ({
    "scope":{"include":[{"rule":target,"type":"SimpleScopeDef"}]},
    "urls":[target]
  }));
}

function compileResults(scanData) {
  let paths = {};

  scanData.issue_events.forEach((issue_found) => {
    paths[issue_found.issue.path] = {};
  });

  scanData.issue_events.forEach((issue_found) => {
    Object.entries(issue_found).forEach(([key, val]) => {
      if (key === "issue") {
        Object.entries(val).forEach(([k, v]) => {
          if (k === "name") {
            paths[issue_found.issue.path][v] = {"Confidence": issue_found.issue.confidence, "Severity": issue_found.issue.severity};
          }
        });
      }
    });
  });


  let txt = ""
  Object.entries(paths).forEach((path) => {
    txt += "<tr><td colspan=2><b><big>" + `${JSON.stringify(path[0])}` + "</big></b></td></tr>";
    Object.entries(path[1]).forEach((issue) => {
      txt += "<tr>"
      txt += "<td>" + `${JSON.stringify(issue[0])}` + "</td>"
      txt += "<td><table>"
      Object.entries(issue[1]).forEach((detail) => {
        txt += "<tr><td><small>" + detail[0] + ": " + detail[1] + "</small></td></tr>"
      });
      txt += "</table></td>"
      txt += "</tr>"
    });
  });

  return txt;

}

function populateResults(data) {
  res = data;

  if (res["scan_status"] === "initializing" || res["scan_status"] === "crawling" || res["scan_status"] === "auditing") {
    let stat = "<h3>Scan is still running</h3>"
    document.getElementById("status").innerHTML = stat;
  } else {
    let stat = "<h3>Scan is finished</h3>"
    document.getElementById("status").innerHTML = stat;
  }

  txt = compileResults(res)
  table = "<table border=1>" + txt + "</table>"
  document.getElementById("results").innerHTML = table;
}

function getScanData(item) {
  let gettingActiveTab = browser.tabs.query({active: true, currentWindow: true});
  gettingActiveTab.then((tabs) => {
    burpAddress = document.getElementById("burp-address").value;
    burpPort = document.getElementById("burp-port").value;
    targetAddress = tabs[0].url
    getResults(`http://${burpAddress}:${burpPort}/v0.1/scan/${item[targetAddress]}`)
  });
}

document.addEventListener("click", (e) => {

  if (e.target.id === "start-scan") {
    let gettingActiveTab = browser.tabs.query({active: true, currentWindow: true});
    gettingActiveTab.then((tabs) => {
      targetAddress = tabs[0].url
	  burpAddress = document.getElementById("burp-address").value;
	  burpPort = document.getElementById("burp-port").value;
      startScan(`http://${burpAddress}:${burpPort}/v0.1/scan`, targetAddress)
    });
  }

  if (e.target.id === "get-scan-results") {
    let gettingScanIds = browser.storage.local.get(null);
    gettingScanIds.then(getScanData);
  }

  if (e.target.id === "clear-storage") {
    let clearingStorage = browser.storage.local.clear();
    clearingStorage.then(() => document.getElementById('status').innerHTML = "<h3>Cleared Local Storage</h3>");
  }

});
