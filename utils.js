module.exports.faceBox = function(box, metadata) {
    return {
        width: Math.round(box.width*2 + box.x < metadata.width ? box.width * 2 : metadata.width - box.x),
        height: Math.round(box.height*2 + box.y < metadata.height ? box.height * 2 : metadata.height - box.y),
        left: Math.round(box.x - box.width/2 > 0 ? box.x - box.width/2 : 0),
        top: Math.round(box.y - box.height/2 > 0 ? box.y - box.height/2 : 0)
    }
}