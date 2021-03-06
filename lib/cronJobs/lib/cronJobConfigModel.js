var _ = require('lodash');
var BaseModel = require("mia-js-core/lib/baseModel");

function thisModule() {

    var model = BaseModel.extend({
            data: {
                //cronJob name
                identity: {
                    type: String,
                    required: true,
                    public: true,
                    index: true
                },
                maxInstanceNumberTotal: {
                    type: Number
                },
                maxInstanceNumberPerServer: {
                    type: Number
                },
                allowedHosts: {
                    type: Array,
                    subType: String,
                    index: true
                },
                time: {
                    hour: {
                        type: String,
                        required: true
                    },
                    minute: {
                        type: String,
                        required: true
                    },
                    second: {
                        type: String,
                        required: true
                    },
                    dayOfMonth: {
                        type: String,
                        required: true
                    },
                    dayOfWeek: {
                        type: String,
                        required: true
                    },
                    month: {
                        type: String,
                        required: true
                    },
                    timezone: {
                        type: String,
                        required: true
                    }
                },
                isSuspended: {
                    type: Boolean,
                    default: false,
                    index: true
                },
                debugOutput: {
                    type: Boolean,
                    default: false,
                    index: true
                }
            }
        },
        {
            disabled: false, // Enable /disable model
            identity: 'generic-cronJobConfigModel', // Model name
            version: '1.0', // Version number
            created: '2015-07-09T19:00:00', // Creation date
            modified: '2015-07-09T19:00:00' // Last modified date
        });

    return model;
};

module.exports = thisModule();
