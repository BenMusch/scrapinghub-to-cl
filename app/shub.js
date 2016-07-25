var command = "scrapy crawl ";
const STATS_URL = "https://storage.scrapinghub.com/jobs/";
const SCHEDULE_URL = "https://app.scrapinghub.com/api/run.json";

/**
 * Set the value of the element to the next 'Loading...' text
 *
 * @param {object} element the element whose value will be changed
 */
function load(element) {
  if (element.value.indexOf('Loading') == -1) {
    element.value = 'Loading...';
  } else {
    count = (element.value.match(/\./g) || []).length;

    switch(count) {
      case 1:
        element.value = 'Loading..';
        break;
      case 2:
        element.value = 'Loading...';
        break;
      case 3:
        element.value = 'Loading.';
        break;
      default:
        element.value = 'Loading...';
    }
  }
}

/**
 * Parse the scrapinghub command into a FormData object
 *
 * @param {String} command the scrapy crawl... command to be parsed
 * @param {function} callback function that receives the FormData object
 */
function parseCommand(command, callback) {
  data = new FormData();

  command = command.replace(/\s*scrapy\s*crawl\s*/g, '');
  data.append('spider', command.split(" ")[0]);

  args = command.match(/-a\s*[\w\d]+\s*=\S+/g);

  for (i = 0; i < args.length; i++) {
    key = /-a\s*([\w\d]+)\s*=\S+/g.exec(args[i])[1];
    val = /-a\s*[\w\d]+\s*=(\S+)/g.exec(args[i])[1];
    data.append(key, val);
  }

  typeof callback === 'function' && callback(data);
}

/**
 * Schedules a ScrapingHub job in the current project based on the value in the
 * from_cl textarea field
 */
function scheduleJob() {
  from_cl = document.getElementById('from_cl');

  parseCommand(from_cl.value, data => {
    getProjectId(projectId => {
      getApiKey(apiKey => {
        data.append('project', projectId);

        errback = data => from_cl.value = 'An error occurred. ' + data['message']
        callback = data => from_cl.value = 'Scheduled: ' + data['jobid']
        onLoad = () => load(from_cl)

        response = makeRequest(SCHEDULE_URL, 'POST', data, apiKey, callback, errback, onLoad);
      })
    })
  })
}

/**
 * Turns ScrapingHub job data into a scrapy crawl command
 *
 * @param {object} data ScrapingHub job data
 * @param {function} callback receives the generated command as an argument
 */
function getCommand(data, callback) {
  var data = data;
  command += data.spider;
  for (var arg in data.spider_args) {
    command += " -a " + arg + "=" + data.spider_args[arg];
  }
  typeof callback === 'function' && callback(command);
}

/**
 * Get the project id of the currenly open window
 *
 * @param {function} callback receives the projectId as an argument
 */
function getProjectId(callback) {
  chrome.tabs.query({currentWindow: true, active: true}, tabs => {
    url = tabs[0].url;
    // matches /p/{project id}/
    pid = /\/p\/(\d+)\/*/g.exec(url)[1];
    typeof callback === 'function' && callback(pid);
  })
}

/**
 * Get the job id of the currenly open window
 *
 * @param {function} callback receives the jobId as an argument
 */
function getJobId(callback) {
  chrome.tabs.query({currentWindow: true, active: true}, tabs => {
    url = tabs[0].url;
    // matches /{project id}/job/{spider id}/{job id}
    jobId = url.match(/\d+\/\d+\/\d+/g)[0];
    typeof callback === 'function' && callback(jobId);
  })
}

/**
 * Get the job data from the ScrapingHub API of the currently open job
 *
 * @param {function} callback receives the JSON response as an argument
 */
function getJobData(apiKey, callback) {
  getJobId(() => {
    statsUrl = STATS_URL + jobId + "?format=json&apikey=" + apiKey + "&add_summary=1";

    to_cl = document.getElementById('to_cl');

    errback = () => to_cl.value = 'An error occurred'
    onLoad = () => load(to_cl)
    data = makeRequest(statsUrl, 'GET', null, null, callback, errback, onLoad);
  })
}

/**
 * Get the ScrapingHub api key of the currenly open window
 *
 * @param {function} callback receives the api key as an argument
 */
function getApiKey(callback) {
  chrome.tabs.executeScript(
    {code: codeForPageVariable('apikey')}, (result) => {
      if (typeof result != 'undefined') {
        typeof callback === 'function' && callback(result[0]);
      }
    }
  )
}

/**
 * Make an XHR to the passed url with the passed infomation
 *
 * @param {String} url the URL to make an argument to
 * @param {String} method the HTTP method (e.g. 'GET')
 * @param {FormData} body the data to send in the request
 * @param {String} auth the basic auth key header, if any
 * @param {function} callback receives the response as an argument on successful
 * requests
 * @param {function} errback receives the response as an argument on failed
 * requests
 * @param {function} onLoad runs every .25 seconds until the response loads
 */
function makeRequest(url, method, body, auth, callback, errback, onLoad) {
  xmlHttp = new XMLHttpRequest();
  xmlHttp.open(method, url);

  if (auth && (auth != '')) {
    xmlHttp.setRequestHeader('Authorization', 'Basic ' + auth);
  }

  xmlHttp.send(body);
  loading = setInterval(onLoad, 250);

  xmlHttp.onreadystatechange = () => {
    clearInterval(loading);
    responseData = JSON.parse(xmlHttp.responseText);
    if (xmlHttp.readyState === XMLHttpRequest.DONE &&
        xmlHttp.status.toString()[0] === '2') {
      callback(responseData);
    } else {
      errback(responseData);
    }
  }
}

/**
 * Gets the javascript code to execute to get the passed value from the stored
 * structured data on the ScrapingHub page
 *
 * @param {string} varName the name of the variable to generate the code to
 * receive
 *
 * @return {string} the Javascript code to execute to receive the passed
 * variable
 */
function codeForPageVariable(varName) {
  re = new RegExp(varName + "\\s*:\\s*'.+'", "g");
  return "document.getElementsByTagName('head')[0].innerHTML.match(" +
    re.toString() + ")[0].split(' ')[1].replace(/'/g, '');"
}

document.addEventListener('DOMContentLoaded', function() {
  document.getElementById('schedule').addEventListener('click', scheduleJob);
})

document.addEventListener('DOMContentLoaded', function() {
  document.getElementById('get_command').addEventListener('click', getApiKey(
    function(apiKey) {
      getJobData(apiKey, (data) => {
        getCommand(data[0], (command) => {
          document.getElementById('to_cl').value = command;
        })
      })
    })
  )
})
