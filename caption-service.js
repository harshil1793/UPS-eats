var request = require('request').defaults({ encoding: null });
var prompts = require('./prompts');

var VISION_URL = 'https://westcentralus.api.cognitive.microsoft.com/vision/v1.0/ocr';

/** 
 *  Gets the caption of the image from an image stream
 * @param {stream} stream The stream to an image.
 * @return {Promise} Promise with caption string if succeeded, error otherwise
 */
exports.getCaptionFromStream = function (stream) {
    return new Promise(
        function (resolve, reject) {
            var requestData = {
                url: VISION_URL,
                encoding: 'binary',
                headers: { 'content-type': 'application/octet-stream', 'Ocp-Apim-Subscription-Key' : prompts.visionKey }
            };

            stream.pipe(request.post(requestData, function (error, response, body) {
                if (error) {
                    reject(error);
                }
                else if (response.statusCode !== 200) {
                    reject(body);
                }
                else {
                    // resolve(extractCaption(JSON.parse(body)));
                    // console.log("url"+body);
                    resolve(extractRegions(JSON.parse(body)));
                    // console.log("stream"+resolve(extractTags(JSON.parse(body))));
                }
            }));
        }
    );
};

/** 
 * Gets the caption of the image from an image URL
 * @param {string} url The URL to an image.
 * @return {Promise} Promise with caption string if succeeded, error otherwise
 */
exports.getCaptionFromUrl = function (url) {
    return new Promise(
        function (resolve, reject) {
            var requestData = {
                url: VISION_URL,
                json: { 'url': url }
            };

            request.post(requestData, function (error, response, body) {
                if (error) {
                    reject(error);
                }
                else if (response.statusCode !== 200) {
                    reject(body);
                }
                else {
                    // console.log("url"+body);
                    // resolve(extractTags(JSON.parse(body)));
                }
            });
        }
    );
};

/**
 * Extracts the caption description from the response of the Vision API
 * @param {Object} body Response of the Vision API
 * @return {string} Description if caption found, null otherwise.
 */
function extractCaption(body) {
    if (body && body.description && body.description.captions && body.description.captions.length) {
        return body.description.captions[0].text;
    }

    return null;
}

function extractRegions(body) {
    // if (body && body.regions[0]) {
    //     console.log("LINES:   :    :    :    :"+body.regions[0].lines)[0];
    //     return body.regions.lines;
    // }
      console.log("LINES:   :    :    :    :"+body);

    return body;
}