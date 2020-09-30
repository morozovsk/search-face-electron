const fs = require('fs');
const utils = require('./utils')
const jimp = require('jimp');

module.exports = async function(sourceDir, targetDir) {
    cv.FS_createDataFile('/', 'res10_300x300_ssd_deploy.prototxt', fs.readFileSync('/var/www/php-opencv-examples/models/ssd/res10_300x300_ssd_deploy.prototxt'), true, false, false);
    cv.FS_createDataFile('/', 'res10_300x300_ssd_iter_140000.caffemodel', fs.readFileSync('/var/www/php-opencv-examples/models/ssd/res10_300x300_ssd_iter_140000.caffemodel'), true, false, false);
    var net = cv.readNetFromCaffe('res10_300x300_ssd_deploy.prototxt', 'res10_300x300_ssd_iter_140000.caffemodel');

    var files = fs.readdirSync(sourceDir);

    let bestMatches = []
    for (let j in files) {
        let file = sourceDir + files[j];

        if (!fs.statSync(file).isFile()) continue;

        let img = cv.matFromImageData((await jimp.read(file)).bitmap)

        cv.cvtColor(img, img, cv.COLOR_RGBA2RGB);
        //cvUtils.printMat(img);

        var size = img.size();

        var minSide = Math.min(size.width, size.height);
        var divider = minSide / 300;
        var resized = new cv.Mat();
        cv.resize(img, resized, new cv.Size(size.width / divider, size.height / divider)); // 1200x300

        let blob = cv.blobFromImage(resized, 1, new cv.Size(), new cv.Scalar(104, 177, 123), true,false); // convert image to 4 dimensions matrix

        //cvUtils.printMat(blob);
        net.setInput(blob);

        var r = net.forward();

        var scalar = new cv.Scalar(0, 0, 255);

        var foundFaces = []
        for (let i = 0; i < r.matSize[2]; i++) {
            let confidence = cvUtils.matAtIdx(r, [0, 0, i, 2]);

            if (confidence > 0.9) {
                //console.log(confidence);
                let startX = cvUtils.matAtIdx(r, [0, 0, i, 3]) * img.cols;
                let startY = cvUtils.matAtIdx(r, [0, 0, i, 4]) * img.rows;
                let endX = cvUtils.matAtIdx(r, [0, 0, i, 5]) * img.cols;
                let endY = cvUtils.matAtIdx(r, [0, 0, i, 6]) * img.rows;

                let box = {x:startX, y:startY, width:endX-startX, height:endY-startY}
                await utils.cropFaceToFile(file, box, targetDir+files[j].split('.')[0]+`_${i}.png`)
                foundFaces.push({
                    score: Math.round(confidence * 100),
                    file: files[j].split('.')[0]+`_${i}.png`,
                    box: box
                });
            }
        }

        bestMatches.push({file:files[j], foundFaces:foundFaces})
    }

    fs.writeFileSync('bestMatches.json', JSON.stringify(bestMatches, null, "\t"))

    return bestMatches
}