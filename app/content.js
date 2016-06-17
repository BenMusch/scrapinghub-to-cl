// function showScheduler() {
//   console.log('From command')
//   schedule = document.getElementById('from_cl_container');
//   schedule.style.display = 'block';
//
//   get_command = document.getElementById('to_cl_container');
//   get_command.style.display = 'none';
// }
//
//
// function showGetCommand() {
//   console.log('Get command')
//   schedule = document.getElementById('from_cl_container');
//   schedule.style.display = 'none';
//
//   get_command = document.getElementById('to_cl_container');
//   get_command.style.display = 'block';
// }
//
// document.addEventListener('DOMContentLoaded', function() {
//   showGetCommand()
//
//   document.getElementById('from_command_toggle').addEventListener('click', showScheduler())
//   document.getElementById('to_command_toggle').addEventListener('click', showGetCommand())
// })

var command = "scrapy crawl ";

function getCommand(data, callback) {
  console.log(data)
  var data = data
  command += data.spider;
  for (var arg in data.spider_args) {
    command += " -a " + arg + "=" + data.spider_args[arg];
  }
  typeof callback === 'function' && callback(command);
}

function getJobData(apiKey, callback) {
  chrome.tabs.query({currentWindow: true, active: true}, function(tabs) {
    url = tabs[0].url
    // matches /{project id}/job/{spider id}/{job id}
    jobIds = url.match(/\d+\/job\/\d+\/\d+/g)[0].split("/"); 
    jobId = jobIds[0] + '/' + jobIds[2] + '/' + jobIds[3];
    statsUrl = "https://storage.scrapinghub.com/jobs/" + jobId + "?format=json";
    statsUrl += "&apikey=" + apiKey + "&add_summary=1";
    data = makeRequest(statsUrl);
    typeof callback === 'function' && callback(data);
  })
}

function getApiKey(data, callback) {
  chrome.tabs.executeScript(
    {code: codeForPageVariable('apikey')},
    function(result) {
      typeof callback === 'function' && callback(result[0]);
    }
  )
}

function makeRequest(url) {
  xmlHttp = new XMLHttpRequest();
  xmlHttp.open("GET", url, false);
  xmlHttp.send(null);
  return JSON.parse(xmlHttp.response)[0];
}

function codeForPageVariable(varName) {
  var re = new RegExp(varName + "\\s*:\\s*'.+'", "g");
  return "document.getElementsByTagName('head')[0].innerHTML.match(" +
    re.toString() + ")[0].split(' ')[1].replace(/'/g, '')";
}

document.addEventListener('DOMContentLoaded', function() {
  e = document.getElementById('get_command');
  e.addEventListener('click', getApiKey({},
    function(apiKey) {
      getJobData(apiKey, function(data) {
        getCommand(data, function(command) {
          document.getElementById('to_cl').innerHTML = command;
        })
      })
    }))
})
