const fs = require('fs');
const faceapi = require('face-api.js');
const tf = require('@tensorflow/tfjs-node');

module.exports = async function(searchedFile, searchedDir) {
    await faceapi.nets.ssdMobilenetv1.loadFromDisk('./weights');
    await faceapi.nets.faceLandmark68Net.loadFromDisk('./weights');
    await faceapi.nets.faceRecognitionNet.loadFromDisk('./weights');

    var foundFacesWithDescriptors = {};

    var files = fs.readdirSync(searchedDir);

    for (let j in files) {
        if (!fs.statSync(searchedDir + files[j]).isFile()) continue
        //console.log(files[j]);
        let img = tf.node.decodeImage(fs.readFileSync(searchedDir + files[j]));

        if (img.shape.length !== 3 || img.shape[2] !== 3) {
            console.log(img);
            continue;
        }

        let foundDetections = await faceapi.detectAllFaces(img, new faceapi.SsdMobilenetv1Options({minConfidence: 0.5})).withFaceLandmarks().withFaceDescriptors();
        //console.log(foundDetections);
        if (foundDetections.length && typeof foundDetections[0].descriptor !== 'undefined') {
            //descriptors.push(Object.values(foundDetections[0].descriptor));
            //descriptors2person.push(parseInt(i));
            for (let i in foundDetections) {
                let face = foundDetections[i].detection.box.round()
                foundFacesWithDescriptors[files[j] + '/' + i] = {
                    file:files[j],
                    face: {x:face.x, y:face.y, width:face.width, height:face.height},
                    descriptor: foundDetections[i].descriptor
                }
            }
        }
    }

    var img = tf.node.decodeImage(fs.readFileSync(searchedFile));
    //console.log(img1)

    var searchedDetections = await faceapi.detectAllFaces(img, new faceapi.SsdMobilenetv1Options({minConfidence: 0.5})).withFaceLandmarks().withFaceDescriptors();

    //console.log(searchedDetections[0].detection.score);

    //let FaceMatcher = new faceapi.FaceMatcher(descriptors_with_labels)
    let bestMatches = []
    for (let i in searchedDetections) {
        let distances = {}
        for (let label in foundFacesWithDescriptors) {
            var distance = faceapi.euclideanDistance(searchedDetections[i].descriptor, foundFacesWithDescriptors[label].descriptor);
            distances[label] = distance

            if (distance < 0.5) {
                //console.log(distance);
            }
        }
        var foundFaces = []
        Object.keys(distances).sort((a, b) => {
            return distances[a] - distances[b]
        }).forEach((label, i) => {
            if (i < 5) {
                foundFaces.push({
                    score: Math.round((1 - distances[label]) * 100),
                    box: foundFacesWithDescriptors[label].face,
                    file: foundFacesWithDescriptors[label].file
                });
            }
        })

        //let bestMatch = FaceMatcher.findBestMatch(searchedDetections[i].descriptor);
        //console.log(bestMatch);
        //console.log(faces[bestMatch.label])
        let face = searchedDetections[i].detection.box.round()
        bestMatches.push({searchedFace: {box:{x:face.x, y:face.y, width:face.width, height:face.height}, score: Math.round(searchedDetections[i].detection.score * 100)}, foundFaces:foundFaces})
        //bestMatches.push({distance: bestMatch.distance, file: bestMatch.label.split('/')[0], searchedFace: searchedDetections[i].detection.box, foundFace: faces[bestMatch.label]})
    }

    //console.log(bestMatches)
    //fs.writeFileSync('bestMatches.json', JSON.stringify(bestMatches, null, "\t"))

    return bestMatches
};
