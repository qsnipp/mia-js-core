var Http = require('http')
    , Https = require('https')
    , Logger = require('mia-js-core/lib/logger')
    , Q = require('q')
    , Utils = require('mia-js-core/lib/utils')
    , Qext = Utils.Qext
    , Hyperquest = require('hyperquest')
    , HyperquestTimeout = require('hyperquest-timeout');

Q.stopUnhandledRejectionTracking();

function thisModule() {
    var self = this;

    var _queryToString = function (query) {
        var result = '';
        if (query) {
            for (var item in query) {
                if (query.hasOwnProperty(item)) {
                    if (result != '') {
                        result += '&';
                    }
                    //result += item + "=" + query[item];
                    result += encodeURI(item) + "=" + encodeURI(query[item]);

                }
            }
        }

        if (result != '') {
            result = '?' + result;
        }

        return result;
    };

    /**
     * Sends a http/http request
     * @param requestOptions :: {
     *      options : {
     *          see node docs, http://nodejs.org/api/http.html#http_class_http_clientrequest
     *      },
     *      protocol: {'http', 'https'} (default 'https')
     *      timeout: in ms
     *      outputStats: if 'true', output stats. Beware, that in this case the promise is resolved with an array: [data, stats] instead of single value.
     *  }
     * @param callback :: (err, data, {timeElapsed: ms})
     * @returns {Promise}
     */

    /*
     requestOptions.prefilter = false ==> Alle codes werden zurückgegeben

     requestOptions.acceptStatus = null; //äquivalent zu requestOptions.acceptStatus = [200] //default, wird als 200 interpretiert
     requestOptions.acceptStatus = 'all' //==> prefilter == false
     requestOptions.acceptStatus = [200, 204];
     */


    self.do = function (requestOptions) {
        requestOptions = requestOptions || {};
        return Qext.callNodeFunc({
            obj: self,
            func: _do
        }, requestOptions);
    };

    var _do = function (requestOptions, callback) {
        requestOptions = requestOptions || {};
        var acceptStatusCodes = requestOptions.acceptStatusCodes || [200];

        var timeOnStart;
        var protocol = requestOptions.protocol === 'http' ? Http : Https;
        if (!requestOptions.options) {
            callback({name: 'ApplicationException', err: "'requestOptions.options' is missing"});
            return;
        }
        if (!requestOptions.options.url && !requestOptions.options.hostname) {
            callback({name: 'ApplicationException', err: "'requestOptions.options.hostname' is missing"});
            return;
        }
        if (!requestOptions.options.url && !requestOptions.options.path) {
            callback({name: 'ApplicationException', err: "'requestOptions.options.path' is missing"});
            return;
        }

        if (!requestOptions.options.url) {
            var query = _queryToString(requestOptions.query);
            //add query to path
            requestOptions.options.path = requestOptions.options.path + query;
        }

        var postData;
        if (requestOptions.body) {
            postData = requestOptions.body;
            if (requestOptions.json === true) {
                postData = JSON.stringify(postData);
                requestOptions.options.headers = requestOptions.options.headers || {};
                requestOptions.options.headers['Content-Type'] = 'application/json';
            }
        }

        var url = requestOptions.options.url || requestOptions.protocol + "://" + requestOptions.options.hostname + requestOptions.options.path;

        var options = {
            method: requestOptions.options.method || "GET"
        };

        var output = '';
        var response;
        var req = Hyperquest(url, options)
            .on('data', function (chunk) {
                output += chunk;
            })
            .on('error', function (err) {
                Logger.error('External request error: ' + err);
                callback({
                    'status': 500,
                    name: 'ExternalError',
                    err: {code: 'ExternalDataRequestError', msg: 'Error calling external API'}
                });
            })
            .on('response', function (res) {
                response = res;
            })
            .on('end', function () {
                var timeElapsed = Date.now() - timeOnStart;

                if (requestOptions.outputType == null || requestOptions.outputType === 'json') {
                    try {
                        output = JSON.parse(output);
                    }
                    catch (err) {
                        Logger.error(err);
                        callback({
                            'status': 500,
                            name: 'ExternalError',
                            err: {
                                code: 'ExternalDataRequestError',
                                msg: 'External API did not return valid JSON document'
                            }
                        });
                        return;
                    }
                }

                if (acceptStatusCodes == 'all') {
                    if (requestOptions.detailed === true) {
                        callback(null, {
                            'status': response.statusCode,
                            'headers': response.headers,
                            'response': output,
                            'timeElapsed': timeElapsed
                        });
                        return;
                    }
                    else {
                        callback(null, output);
                        return;
                    }
                }
                else {
                    if (acceptStatusCodes.indexOf(response.statusCode) != -1) {
                        if (requestOptions.detailed === true) {
                            callback(null, {
                                'status': response.statusCode,
                                'headers': response.headers,
                                'response': output,
                                'timeElapsed': timeElapsed
                            });
                            return;
                        }
                        else { //null or false
                            callback(null, output);
                            return;
                        }
                    }
                    else {
                        Logger.error('External request to ' + requestOptions.options.hostname + ' timed out');
                        callback({
                            'status': 500,
                            name: 'ExternalError',
                            err: {
                                code: 'ExternalDataRequestError',
                                msg: 'External API returned status code ' + response.statusCode,
                                statusCode: response.statusCode
                            }
                        });
                        return;
                    }
                }
            }
        );

        HyperquestTimeout(req, requestOptions.timeout);


        timeOnStart = Date.now();

        if (postData) {
            req.write(postData);
        }

        //req.end(requestOptions.data);
    };

    self.http = function (options, callback) {
        options = options || {};
        options.protocol = 'http';
        self.do(options, callback);
    };

    self.https = function (options, callback) {
        options = options || {};
        options.protocol = 'https';
        self.do(options, callback);
    };

    return self;
};

module.exports = new thisModule();