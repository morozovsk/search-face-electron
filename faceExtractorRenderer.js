const {clipboard, remote, ipcRenderer} = require('electron')
const $ = require('jquery')
const fs = require('fs')
const path = require('path')
const sharp = require('sharp');
const utils = require('./utils')

var sourceDir = '/var/www/tfjs-examples/images/';
var targetDir = '/var/www/tfjs-examples/images/1/';
//var fs = remote.require('fs')

//document.getElementById("search").addEventListener('change',

/*const submit = document.getElementById("submit");

submit.addEventListener('click', async () => {
    console.log(1)
    return false
});*/

$("#sourceDir").change(function () {
    $('#sourceDirVal').text(path.dirname(this.files[0].path)+'/')
});

$("#targetDir").change(function () {
    $('#targetDirVal').text(path.dirname(this.files[0].path)+'/')
});

/*$("#targetDir").click(function () {
   console.log(remote.dialog.showSaveDialogSync({modal: true}, {properties: ['openFile', 'openDirectory']}))
});*/

$("#form").submit(function () {
    let formData = new FormData(this)
    if (formData.get('sourceDir').path) {
        sourceDir = formData.get('sourceDir').path
        if (!fs.statSync(sourceDir).isDirectory()) {
            sourceDir = path.dirname(sourceDir) + '/'
        }
    }

    if (formData.get('targetDir').path) {
        targetDir = formData.get('targetDir').path

        if (!fs.statSync(targetDir).isDirectory()) {
            targetDir = path.dirname(targetDir) + '/'
        }
    }

    if (sourceDir && targetDir) {
        ipcRenderer.send('faceExtractor', {sourceDir, targetDir})
        //console.log({sourceDir, targetDir})
    }

    return false
})

ipcRenderer.on('faceExtractor', async (event, bestMatches) => {
    //let bestMatches = JSON.parse(fs.readFileSync('bestMatches.json'))
    let table = '<table class="table">'
    for (let i in bestMatches) {
        table += '<tr>'
        table += `<td class="alert-info"><img src="${sourceDir+bestMatches[i].file}"><br><a target="_blank" href="${sourceDir+bestMatches[i].file}">${bestMatches[i].file}</a></td>`

        for (let j in bestMatches[i].foundFaces) {
            let foundFace = bestMatches[i].foundFaces[j]
            let alert = foundFace.score === 100 ? 'dark': foundFace.score >= 50 ? 'success' : foundFace.score >= 40 ? 'warning' : 'danger'
            if (foundFace.score >= 30) {
                table += `<td class="alert-${alert}"><img src="${targetDir+foundFace.file}"><br>${foundFace.score}%</td>`
            }
        }
        table += '</tr>'
    }
    table += '</table>'
    $('#result').html(table)
})
