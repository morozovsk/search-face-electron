const {clipboard, remote, ipcRenderer} = require('electron')
const $ = require('jquery')
const fs = require('fs')
const path = require('path')
const sharp = require('sharp');
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
        let img = sharp(file);
        let imageBuf = await img.extract(utils.faceBox(bestMatches[i].searchedFace.box, await img.metadata())).toBuffer();
        table += `<td class="alert-info"><img src="data:image/png;base64,${imageBuf.toString('base64')}"><br>${bestMatches[i].searchedFace.score}%</td>`

        for (let j in bestMatches[i].foundFaces) {
            let foundFace = bestMatches[i].foundFaces[j]
            let img = sharp(dir + foundFace.file);
            let faceBox = utils.faceBox(foundFace.box, await img.metadata())
            let imageBuf = await img.extract(faceBox).toBuffer();
            let alert = foundFace.score === 100 ? 'dark': foundFace.score >= 50 ? 'success' : foundFace.score >= 40 ? 'warning' : 'danger'
            if (foundFace.score >= 30) {
                table += `<td class="alert-${alert}"><img src="data:image/png;base64,${imageBuf.toString('base64')}"><br>${foundFace.score}%`
                    +`<br><a target="_blank" href="${dir+foundFace.file}">${foundFace.file}</a></td>`
            }
        }
        table += '</tr>'
    }
    table += '</table>'
    $('#result').html(table)
})
