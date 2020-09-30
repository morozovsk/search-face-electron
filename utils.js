const jimp = require('jimp');
const fs = require('fs');
const nativeImage = require('electron').nativeImage;

module.exports.faceBox = function(box, metadata) {
    return {
        width: Math.round(box.width*2 + box.x < metadata.width ? box.width * 2 : metadata.width - box.x),
        height: Math.round(box.height*2 + box.y < metadata.height ? box.height * 2 : metadata.height - box.y),
        left: Math.round(box.x - box.width/2 > 0 ? box.x - box.width/2 : 0),
        top: Math.round(box.y - box.height/2 > 0 ? box.y - box.height/2 : 0)
    }
}

/*module.exports.loadImage = async (file) => {
    //return tf.node.decodeImage(fs.readFileSync(file));
    return jimp.read(file).then(img => {
        const p = [];
        img.scan(0, 0, img.bitmap.width, img.bitmap.height, (x, y, idx) => {
            p.push(img.bitmap.data[idx + 0]);
            p.push(img.bitmap.data[idx + 1]);
            p.push(img.bitmap.data[idx + 2]);
        });

        return tf.tensor3d(p, [img.bitmap.height, img.bitmap.width, 3], 'int32');
    });
};*/

module.exports.cropFaceToFile = async (sourceFile, box, targetFile) => {
    let img = nativeImage.createFromPath(sourceFile);
    let faceBox = this.faceBox(box, img.getSize())
    fs.writeFileSync(targetFile, img.crop({x:faceBox.left, y:faceBox.top, width:faceBox.width, height:faceBox.height}).toPNG());
}

module.exports.cropFaceToBase64 = async (sourceFile, box) => {
    let img = nativeImage.createFromPath(sourceFile);
    let faceBox = this.faceBox(box, img.getSize())
    return img.crop({x:faceBox.left, y:faceBox.top, width:faceBox.width, height:faceBox.height}).toDataURL();
}

/*module.exports.cropFaceToFile = async (sourceFile, box, targetFile) => {
    let img = await jimp.read(sourceFile);
    let faceBox = this.faceBox(box, img.bitmap)
    img.crop(faceBox.left, faceBox.top, faceBox.width, faceBox.height).write(targetFile);
}*/

/*module.exports.cropFaceToBase64 = async (sourceFile, box) => {
    let img = await jimp.read(sourceFile);
    let faceBox = this.faceBox(box, img.bitmap)
    return imageBuf = img.crop(faceBox.left, faceBox.top, faceBox.width, faceBox.height).getBase64Async("image/png");
}*/

/*module.exports.cropFaceToFile = async (sourceFile, box, targetFile) => {
    let img = sharp(sourceFile);
    let faceBox = this.faceBox(box, await img.metadata())
    img.extract(faceBox).toFile(targetFile);
}

module.exports.cropFaceToBase64 = async (sourceFile, box) => {
    let img = sharp(sourceFile);
    let faceBox = this.faceBox(box, await img.metadata())
    let imageBuf = await img.extract(faceBox).toBuffer();
    return imageBuf = 'data:image/png;base64,' + imageBuf.toString('base64')
}*/

module.exports.detectFaces = async (netDet, img) => {
    let cv = require('@opencv.js/wasm');
    var blob = cv.blobFromImage(img, 1, {width: 192, height: 144}, [104, 117, 123, 0], false, false);
    netDet.setInput(blob);
    var out = netDet.forward();

    var faces = [];
    for (var i = 0, n = out.data32F.length; i < n; i += 7) {
        var confidence = out.data32F[i + 2];
        var left = out.data32F[i + 3] * img.cols;
        var top = out.data32F[i + 4] * img.rows;
        var right = out.data32F[i + 5] * img.cols;
        var bottom = out.data32F[i + 6] * img.rows;
        left = Math.min(Math.max(0, left), img.cols - 1);
        right = Math.min(Math.max(0, right), img.cols - 1);
        bottom = Math.min(Math.max(0, bottom), img.rows - 1);
        top = Math.min(Math.max(0, top), img.rows - 1);

        if (confidence > 0.5 && left < right && top < bottom) {
            faces.push({box:{x: left, y: top, width: right - left, height: bottom - top}, confidence})
        }
    }
    blob.delete();
    out.delete();
    return faces;
}

module.exports.face2vec = (netRecogn, face) => {
    var blob = cv.blobFromImage(face, 1.0 / 255, {width: 96, height: 96}, [0, 0, 0, 0], true, false)
    netRecogn.setInput(blob);

    var vec = netRecogn.forward();

    blob.delete();
    return vec;
}