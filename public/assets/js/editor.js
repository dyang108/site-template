var converter = new showdown.Converter()
var preview = document.getElementById('preview')
var editor = ace.edit('editor')
var title = document.getElementById('title')
var category = document.getElementById('category')
var pwd = document.getElementById('pwd')
var postId = document.getElementById('post-id')
editor.session.setUseWorker(false)
editor.session.setMode('ace/mode/markdown')
editor.$blockScrolling = Infinity
editor.getSession().setUseWrapMode(true)
editor.session.on('change', function (e) {
  var text = '<h2>' + title.value + '</h2>\n' + editor.getValue()
  preview.innerHTML = converter.makeHtml(text)
})

postId.onchange = function () {
  for (let i = 0; i < allPosts.length; i++) {
    if (allPosts[i]._id === postId.value) {
      console.log(allPosts[i])
      editor.setValue(allPosts[i].body)
      title.value = allPosts[i].title
      category.value = allPosts[i].category
      break
    }
  }
}

function savePost () {
  var auth = pwd.value
  var postObj = {
    title: title.value,
    body: editor.getValue(),
    updated: new Date(),
    category: category.value
  }
  if (postId.value !== 'new') {
    postObj._id = postId.value
  }
  $.ajax({
    type: 'POST',
    url: '/edit-post',
    headers: {
      'Authorization': auth
    },
    contentType: 'application/json;  charset=utf-8',
    data: JSON.stringify(postObj),
    dataType: 'json',
    success: (data) => {
      console.log('hi')
      window.location = '/'
    },
    error: () => {
      window.alert('Incorrect password')
    }
  })
}

function deletePost () {
  var auth = pwd.value
  if (postId.value === 'new') {
    return
  }
  $.ajax({
    type: 'POST',
    url: '/delete-post',
    headers: {
      'Authorization': auth
    },
    contentType: 'application/json;  charset=utf-8',
    data: JSON.stringify({
      _id: postId.value
    }),
    dataType: 'json',
    success: (data) => {
      window.location = '/'
    },
    error: () => {
      window.alert('Incorrect password')
    }
  })
}
