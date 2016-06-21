function showFromCommand() {
  schedule = document.getElementById('from_cl_container');
  schedule.style.display = 'block';

  get_command = document.getElementById('to_cl_container');
  get_command.style.display = 'none';

  select(document.getElementById('from_command_toggle'))
  deselect(document.getElementById('get_command_toggle'))
}

function showGetCommand() {
  schedule = document.getElementById('from_cl_container');
  schedule.style.display = 'none';

  get_command = document.getElementById('to_cl_container');
  get_command.style.display = 'block';

  select(document.getElementById('get_command_toggle'))
  deselect(document.getElementById('from_command_toggle'))
}

function select(e) {
  e.className = e.className.concat(" selected")
}

function deselect(e) {
  e.className = e.className.replace(/\s*selected\s*/g, '')
}

document.addEventListener('DOMContentLoaded', function() {
  showGetCommand()

  document.getElementById('from_command_toggle').addEventListener('click', showFromCommand)
  document.getElementById('get_command_toggle').addEventListener('click', showGetCommand)
})
