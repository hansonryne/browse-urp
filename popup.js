// Send GET request to REST API for either scan results or issues list.
function httpGet(theUrl)
{
  var xmlHttp = new XMLHttpRequest();
  xmlHttp.onreadystatechange = function() {
    if (xmlHttp.readyState == 4 && xmlHttp.status == 200) {
      resText = JSON.parse(xmlHttp.responseText);
      if (resText.hasOwnProperty("scan_status")) {
        populateResults(resText);
      } else {
        buildPage(resText);
      }
    }
  }
  xmlHttp.open( "GET", theUrl, true ); // false for synchronous request
  xmlHttp.send( null );
}


// Set POST request to REST API in order to start Burp scan.
function httpPost(theUrl, target)
{
  var xmlHttp = new XMLHttpRequest();
  xmlHttp.onreadystatechange = function() {
    if (xmlHttp.readyState == 4 && xmlHttp.status == 201) {
      // Save scan ID to local storage for accessing later
      let res = xmlHttp.getResponseHeader("Location");
      burpAddress = document.getElementById("burp-address").value;
      burpPort = document.getElementById("burp-port").value;
      browser.storage.local.set({[target]: res}).then(() => {
        console.log("saved");
      });
      httpGet(`http://${burpAddress}:${burpPort}/v0.1/scan/${res}`);
    }
  }
  xmlHttp.open( "POST", theUrl, true ); // false for synchronous request
  xmlHttp.setRequestHeader('Content-Type', 'application/json');
  xmlHttp.send( JSON.stringify ({
    "scope":{"include":[{"rule":target,"type":"SimpleScopeDef"}]},
    "urls":[target]
  }));
}

function buildPage(data) {
  res = data;
  for (x in res) {
    let element = document.createElement("div");
    element.id = `test_ele ${x}`;
    element.innerText = "Issue Type: ";
    document.body.appendChild(element);
    sub = document.createElement("div");
    sub.innerHTML = res[x].description;
    document.getElementById(`test_ele ${x}`).appendChild(sub);
  }
}

function startScan(url, target) {
  res = httpPost(url, target);
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

  console.log(paths);

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

  console.log(txt);
  return txt;

}

function populateResults(data) {
  res = data;

  if (res["scan_status"] === "initializing" || res["scan_status"] === "crawling" || res["scan_status"] === "auditing") {
    let stat = "Scan is still running"
    document.getElementById("status").innerHTML = stat;

  } else {
    let stat = "Scan is finished"
    document.getElementById("status").innerHTML = stat;
  }
  txt = compileResults(res)
  table = "<table border=1>" + txt + "</table>"
  document.getElementById("results").innerHTML = table;

  /*let txt = ""
  if (res["scan_status"] === "initializing" || res["scan_status"] === "crawling" || res["scan_status"] === "auditing") {
    let stat = "Scan is still running"
    document.getElementById("status").innerHTML = stat;
    txt += "<table border='1'>"
    res.issue_events.forEach((item) => {
      Object.entries(item).forEach(([key, val]) => {
        if (key === "issue") {
          Object.entries(val).forEach(([k, v]) => {
            txt += "<tr>"
            if (k === "name") {
              txt += "<td>Issue Detected:</td><td>" + `${JSON.stringify(v)}` + "</td>";
            }
            if (k === "path") {
              txt += "<td>Path</td><td>" + `${JSON.stringify(v)}` + "</td>"
            }
            txt += "</tr>"
          });
        }
      });
    });
    txt += "</table>"
    document.getElementById("results").innerHTML = txt;
  } else {
    let stat = "Scan is finished"
    document.getElementById("status").innerHTML = stat;
    txt += "<table border='1'>"
    res.issue_events.forEach((item) => {
      Object.entries(item).forEach(([key, val]) => {
        if (key === "issue") {
          Object.entries(val).forEach(([k, v]) => {
            if (k === "name") {
              txt += "<tr><td>" + `${k}:` + "</td><td>" + `${JSON.stringify(v)}` + "</td></tr>";
            }
          });
        }
      });
    });
    txt += "</table>"
    document.getElementById("results").innerHTML = txt;
  }
  */

}

function onGotIds(item) {
  console.log(item);
}

function getScanData(item) {
  let gettingActiveTab = browser.tabs.query({active: true, currentWindow: true});
  gettingActiveTab.then((tabs) => {
    burpAddress = document.getElementById("burp-address").value;
    burpPort = document.getElementById("burp-port").value;
    targetAddress = tabs[0].url
    console.log("ITEM");
    console.log(item);
    httpGet(`http://${burpAddress}:${burpPort}/v0.1/scan/${item[targetAddress]}`)
  });
}

document.addEventListener("click", (e) => {

  let gettingActiveTab = browser.tabs.query({active: true, currentWindow: true});
  let gettingScanIds = browser.storage.local.get(null);
  burpAddress = document.getElementById("burp-address").value;
  burpPort = document.getElementById("burp-port").value;

  if (e.target.id === "get-issues") {
    gettingActiveTab.then((tabs) => {
      httpGet(`http://${burpAddress}:${burpPort}/v0.1/knowledge_base/issue_definitions`)
    });
  }

  if (e.target.id === "start-scan") {
    gettingActiveTab.then((tabs) => {
      targetAddress = tabs[0].url
      startScan(`http://${burpAddress}:${burpPort}/v0.1/scan`, targetAddress)
    });
  }

  if (e.target.id === "get-scan-id") {
    gettingScanIds.then(onGotIds);
  }

  if (e.target.id === "clear-storage") {
    let clearingStorage = browser.storage.local.clear();
    clearingStorage.then(() => console.log("cleared"));
  }

  if (e.target.id === "get-scan-results") {
    gettingScanIds.then(getScanData);
  }

});
