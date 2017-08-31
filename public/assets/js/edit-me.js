var pwd = document.getElementById('pwd')
var editor = ace.edit('editor')
editor.session.setUseWorker(false)
editor.session.setMode('ace/mode/json')
editor.$blockScrolling = Infinity
editor.getSession().setUseWrapMode(true)

function saveMe () {
  var auth = pwd.value
  var text = editor.getValue()
  try {
    var val = JSON.parse(text)
    if (typeof val === 'object') {
      $.ajax({
        type: 'POST',
        url: '/edit-me',
        headers: {
          'Authorization': auth
        },
        contentType: 'application/json;  charset=utf-8',
        data: text,
        dataType: 'json',
        success: (data) => {
          window.location = '/'
        },
        error: () => {
          window.alert('Incorrect password  ')
        }
      })
    } else {
      alert('Invalfdsid JSON')
    }
  } catch (e) {
    alert('Invalid JSON', e)
  }
}