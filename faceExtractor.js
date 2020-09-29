const fs = require('fs');
const faceapi = require('face-api.js');
const utils = require('./utils')

module.exports = async function(sourceDir, targetDir) {
    await faceapi.nets.ssdMobilenetv1.loadFromDisk('./weights');
    await faceapi.nets.faceLandmark68Net.loadFromDisk('./weights');
    await faceapi.nets.faceRecognitionNet.loadFromDisk('./weights');


    var files = fs.readdirSync(sourceDir);

    let bestMatches = []
    for (let j in files) {
        let file = sourceDir + files[j];

        if (!fs.statSync(file).isFile()) continue;

        let img = await utils.loadImage(file)

        // get all faces with descriptors
        let foundFacesWithDescriptors = await faceapi.detectAllFaces(img, new faceapi.SsdMobilenetv1Options({minConfidence: 0.5})).withFaceLandmarks().withFaceDescriptors();

        var foundFaces = []
        for (let i in foundFacesWithDescriptors) {
            //console.log(box);
            await utils.cropFaceToFile(file, foundFacesWithDescriptors[i].detection.box, targetDir+files[j].split('.')[0]+`_${i}.png`)
            foundFaces.push({
                score: Math.round(foundFacesWithDescriptors[i].detection.score * 100),
                file: files[j].split('.')[0]+`_${i}.png`,
                box: foundFacesWithDescriptors[i].detection.box
            });

            //box = detections[i].alignedRect.box;
            //console.log(box);
        }

        bestMatches.push({file:files[j], foundFaces:foundFaces})
    }

    fs.writeFileSync('bestMatches.json', JSON.stringify(bestMatches, null, "\t"))

    return bestMatches
};
