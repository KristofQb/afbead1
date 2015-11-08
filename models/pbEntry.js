var Waterline = require('waterline');

module.exports = Waterline.Collection.extend({
    identity: 'pbEntry',
    connection: 'disk',
    attributes: {
        prefix: {
            type: 'string',
            required: false
        },
        forename: {
            type: 'string',
            required: true
        },
        surname: {
            type: 'string',
            required: true
        },
        suffix: {
            type: 'string',
            required: false
        },
        number: {
            type: 'int',
            required: false
        },
        permanentaddress: {
            type: 'string',
            required: false
        },
        user: {
            model: 'user'
        }
    }
});