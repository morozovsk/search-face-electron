const {clipboard, remote, ipcRenderer} = require('electron')
const $ = require('jquery')
const fs = require('fs')
const path = require('path')
const utils = require('./utils')

var file = '';
var dir = '';
//var fs = remote.require('fs')

//document.getElementById("search").addEventListener('change',
$("#file").change(function () {
    //console.log(this.files[0])
    $('#preview').attr('src', this.files[0].path)
    /*let form = document.getElementById('form');
    let formData = new FormData(form)
    console.log(formData)*/
    //ipcRenderer.send('asynchronous-message', 'ping')
});

$("#dir").change(function () {
    //console.log(this.files[0])
    //$('#preview').attr('src', this.files[0].path)
    /*let form = document.getElementById('form');
    let formData = new FormData(form)
    console.log(formData)*/
    //ipcRenderer.send('asynchronous-message', 'ping')
    $('#dirValue').text(this.files[0].path)
});

/*const submit = document.getElementById("submit");

submit.addEventListener('click', async () => {
    console.log(1)
    return false
});*/

$("#form").submit(function () {
    let formData = new FormData(this)
    if (formData.get('file').path) {
        file = formData.get('file').path
    }

    if (formData.get('dir').path) {
        dir = formData.get('dir').path

        if (!fs.statSync(dir).isDirectory()) {
            dir = path.dirname(dir) + '/'
        }
    }

    if (file && dir) {
        ipcRenderer.send('faceRecognition', {file, dir})
    }

    return false
})

ipcRenderer.on('faceRecognition', async (event, bestMatches) => {
    //let bestMatches = JSON.parse(fs.readFileSync('bestMatches.json'))
    let table = '<table class="table">'
    for (let i in bestMatches) {
        table += '<tr>'
        let imageBuf = await utils.cropFaceToBase64(file, bestMatches[i].searchedFace.box);
        table += `<td class="alert-info"><img src="${imageBuf}"><br>${bestMatches[i].searchedFace.score}%</td>`

        for (let j in bestMatches[i].foundFaces) {
            let foundFace = bestMatches[i].foundFaces[j]
            let imageBuf = await utils.cropFaceToBase64(dir + foundFace.file, foundFace.box);
                let alert = foundFace.score === 100 ? 'dark' : foundFace.score >= 50 ? 'success' : foundFace.score >= 40 ? 'warning' : 'danger'
            if (foundFace.score >= 30) {
                table += `<td class="alert-${alert}"><img src="${imageBuf}"><br>${foundFace.score}%`
                    + `<br><a target="_blank" href="${dir + foundFace.file}">${foundFace.file}</a></td>`
            }
        }
        table += '</tr>'
    }
    table += '</table>'
    $('#result').html(table)
})
