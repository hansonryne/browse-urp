# Browse-urp
Firefox browser extension for the Burp API

## Installation Instructions
* Download and save respository
* Go to about:debugging in the FireFox URL bar
* Click Load Temporary Add-on
* Find it on your filesystem and go

## Usage Instructions
* Ensure the Burp Suite API is running (auth tokens are NOT supported yet)
* Ensure the extension is set up with the proper IP and port for the API
* Go to the tab with the page you want to scan
* Click "Scan This Tab"
* Update results in the extension window by clicking "Get Scan Results"

### Notes
* "Clear Storage" only clears the browser local storage in use by the extension.  (It will not delete the actual Burp scans)
* Notifications at the top of the extension window let you know the status of the scan.
