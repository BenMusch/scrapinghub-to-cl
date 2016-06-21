var command = "scrapy crawl ";
var formData;

/* parse a scrapinghub command into a FormData object for the schedule API */
function parseCommand(command, callback) {
  data = new FormData()

  command = command.replace(/\s*scrapy\s*crawl\s*/g, '')
  data.append('spider', command.split(" ")[0])

  args = command.match(/-a\s*[\w\d]+\s*=\S+/g)

  console.log(args)
  for (i = 0; i < args.length; i++) {
    key = /-a\s*([\w\d]+)\s*=\S+/g.exec(args[i])[1]
    val = /-a\s*[\w\d]+\s*=(\S+)/g.exec(args[i])[1]
    console.log(key)
    console.log(val)
    data.append(key, val)
  }

  typeof callback === 'function' && callback(data);
}

function scheduleJob() {
  parseCommand(document.getElementById('from_cl').value, function(data) {
    getProjectId(function(projectId) {
      getApiKey(function(apiKey) {
        data.append('project', projectId)
        formData = data
        console.log(data)
        url = 'https://app.scrapinghub.com/api/run.json'
        response = makeRequest(url, "POST", data, apiKey)
      })
    })
  })
}

/* given data about the job from the API, generates a scrapy crawl command */
function getCommand(data, callback) {
  var data = data
  command += data.spider;
  for (var arg in data.spider_args) {
    command += " -a " + arg + "=" + data.spider_args[arg];
  }
  typeof callback === 'function' && callback(command);
}

function getProjectId(callback) {
  chrome.tabs.query({currentWindow: true, active: true}, function(tabs) {
    url = tabs[0].url
    // matches /{project id}/job/{spider id}/{job id}
    pid = /\/p\/(\d+)\/*/g.exec(url)[1]
    typeof callback === 'function' && callback(pid);
  })
}

function getJobId(callback) {
  chrome.tabs.query({currentWindow: true, active: true}, function(tabs) {
    url = tabs[0].url
    // matches /{project id}/job/{spider id}/{job id}
    jobIds = url.match(/\d+\/job\/\d+\/\d+/g)[0].split("/"); 
    jobId = jobIds[0] + '/' + jobIds[2] + '/' + jobIds[3];
    typeof callback === 'function' && callback(jobId);
  })
}

/* given an apikey, gets the job data for the current tab from the API*/
function getJobData(apiKey, callback) {
  getJobId(function() {
    statsUrl = "https://storage.scrapinghub.com/jobs/" + jobId + "?format=json";
    statsUrl += "&apikey=" + apiKey + "&add_summary=1";
    data = makeRequest(statsUrl);
    typeof callback === 'function' && callback(data);
  })
}

/* gets the apikey of the current user */
function getApiKey(callback) {
  chrome.tabs.executeScript(
    {code: codeForPageVariable('apikey')},
    function(result) {
      if (typeof result != 'undefined') {
        typeof callback === 'function' && callback(result[0]);
      }
    }
  )
}

function makeRequest(url, method="GET", body=null, auth='') {
  xmlHttp = new XMLHttpRequest();
  xmlHttp.open(method, url, false);
  if (auth != '') {
    xmlHttp.setRequestHeader('Authorization', 'Basic ' + auth)
  }
  xmlHttp.send(body);
  return JSON.parse(xmlHttp.response)[0];
}

function codeForPageVariable(varName) {
  var re = new RegExp(varName + "\\s*:\\s*'.+'", "g");
  return "document.getElementsByTagName('head')[0].innerHTML.match(" +
    re.toString() + ")[0].split(' ')[1].replace(/'/g, '')";
}

document.addEventListener('DOMContentLoaded', function() {
  e = document.getElementById('schedule');
  e.addEventListener('click', scheduleJob)
})

document.addEventListener('DOMContentLoaded', function() {
  e = document.getElementById('get_command');
  e.addEventListener('click', getApiKey({},
    function(apiKey) {
      getJobData(apiKey, function(data) {
        getCommand(data, function(command) {
          document.getElementById('to_cl').innerHTML = command;
        })
      })
    })
  )
})
