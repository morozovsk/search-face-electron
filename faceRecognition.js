const fs = require('fs');
const utils = require('./utils')
const jimp = require('jimp');

module.exports = async function(searchedFile, searchedDir) {
    cv.FS_createDataFile('/', 'res10_300x300_ssd_deploy.prototxt', fs.readFileSync('/var/www/php-opencv-examples/models/ssd/res10_300x300_ssd_deploy.prototxt'), true, false, false);
    cv.FS_createDataFile('/', 'res10_300x300_ssd_iter_140000.caffemodel', fs.readFileSync('/var/www/php-opencv-examples/models/ssd/res10_300x300_ssd_iter_140000.caffemodel'), true, false, false);
    cv.FS_createDataFile('/', 'openface.nn4.small2.v1.t7', fs.readFileSync('/var/www/data/models/openface.nn4.small2.v1.t7'), true, false, false);
    var netDet = cv.readNetFromCaffe('res10_300x300_ssd_deploy.prototxt', 'res10_300x300_ssd_iter_140000.caffemodel');
    //var netDet = cv.readNetFromCaffe('res10_300x300_ssd_deploy_opencv.prototxt', 'res10_300x300_ssd_iter_140000_fp16.caffemodel');
    var netRecogn = cv.readNet('openface.nn4.small2.v1.t7');

    var foundFacesWithDescriptors = {};

    var files = fs.readdirSync(searchedDir);

    for (let j in files) {
        if (!fs.statSync(searchedDir + files[j]).isFile()) continue
        //console.log(files[j]);

        let src = cv.matFromImageData((await jimp.read(searchedDir + files[j])).bitmap);
        let img = new cv.Mat();
        cv.cvtColor(src, img, cv.COLOR_RGBA2BGR);

        let foundFaces = await utils.detectFaces(netDet, img);
        //console.log(foundDetections);
        if (foundFaces.length) {
            for (let i in foundFaces) {
                let face = src.roi(foundFaces[i].box)
                cv.cvtColor(face, face, cv.COLOR_RGBA2RGB);
                foundFacesWithDescriptors[files[j] + '/' + i] = {
                    file: files[j],
                    box: foundFaces[i].box,
                    descriptor: utils.face2vec(netRecogn, face).clone()
                }
            }
        }
    }

    let src = cv.matFromImageData((await jimp.read(searchedFile)).bitmap);
    let img = new cv.Mat();
    cv.cvtColor(src, img, cv.COLOR_RGBA2BGR);

    //console.log('-----------------------------------')

    let searchedFaces = await utils.detectFaces(netDet, img);
    //fs.writeFileSync('searchedFaces.json', JSON.stringify(searchedFaces, null, "\t"))
    //fs.writeFileSync('foundFaces.json', JSON.stringify(foundFacesWithDescriptors, null, "\t"))

    let bestMatches = []
    for (let i in searchedFaces) {
        let face = src.roi(searchedFaces[i].box)
        cv.cvtColor(face, face, cv.COLOR_RGBA2RGB);
        let descriptor = utils.face2vec(netRecogn, face)

        let scores = {}
        for (let label in foundFacesWithDescriptors) {
            var score = descriptor.dot(foundFacesWithDescriptors[label].descriptor);

            scores[label] = score;
        }

        let foundFaces = []
        Object.keys(scores).sort((a, b) => {
            return scores[b] - scores[a]
        }).forEach((label, i) => {
            if (i < 5) {
                foundFaces.push({
                    score: Math.round((scores[label]) * 100),
                    box: foundFacesWithDescriptors[label].box,
                    file: foundFacesWithDescriptors[label].file
                });
            }
        })

        bestMatches.push({searchedFace: {box:searchedFaces[i].box, score: Math.round(searchedFaces[i].confidence * 100)}, foundFaces:foundFaces})
    }

    //console.log(bestMatches)
    //fs.writeFileSync('bestMatches.json', JSON.stringify(bestMatches, null, "\t"))

    return bestMatches
};
