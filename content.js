var curCommand = ""

var getCommand = function(data) {
  if (curCommand == "") {
    data = data[0]
    curCommand = "scrapy crawl " + data["spider"]
    for (var arg in data["spider_args"]) {
      curCommand += " -a " + arg + " " + data["spider_args"][arg]
    }
  }
}

var getJobData = function() {
  var apiKey = getPageVariable("apikey")
  var baseUrl = getPageVariable("hubstorage")
  var projectId = getPageVariable("currentProject")
  url = window.location.href
  jobIds = url.match(/job\/\d+\/\d+/g)[0].split("/")
  var jobId = jobIds[1] + '/' + jobIds[2]
  statsUrl = baseUrl + "/jobs/" + projectId +"/" + jobId + "?format=json"
  statsUrl += "&apikey=" + apiKey + "&add_summary=1"
  return $.ajax({async: false, type: 'GET', url: statsUrl})
}

var getPageVariable = function(varName) {
  re = new RegExp(varName + "\\s*=\\s*\".+\"", "g")
  variable = $('body').text().match(re)[0]
  return variable.split(" ")[2].replace(/"/g, '')
}


$(document).ready(
  function() {
    getJobData().done(function( data ) {
      getCommand(data)
      commandButton = "<div class='ng-scope'><button class='btn btn-info' id='to_cl'>To CL</button></div>"
      $("div[id='actions']").append(commandButton)
      e = document.getElementById('to_cl')
      e.addEventListener('click', function() { alert(curCommand) })
    })
  }
)
