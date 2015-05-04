module.exports = function(plumber, config) {
	return new Ec2Platform(plumber, config);
};

function Ec2Platform(plumber, config) {
	var AWS = require('aws-sdk');
	if(config)
		AWS.config = config;

	this.ec2 = new AWS.EC2();
}

Ec2Platform.prototype.instanceId = function(callback) {
	// get the ID for the running instance (machine), as returned by startInstance
	var self = this;

	if(typeof self._instanceId != "string") {
		var request = require("request");
		request('http://169.254.169.254/latest/meta-data/instance-id', function(error, response, body) {
			if(!error && response.statusCode == 200) {
				self._instanceId = body;
				callback(null, body);
			}
			else
				callback(error, null);
		});
	}
	else
		callback(null, self._instanceId);
};

Ec2Platform.prototype.startInstance = function(params, callback) {
	// TODO: do something to params?
	this.ec2.runInstances(params, function(err, data) {
		if(err)
			callback(err, null);
		else {
			var instanceId = data.Instances[0].InstanceId;
			callback(null, instanceId);
		}
	});
};

Ec2Platform.prototype.stopInstance = function(instanceId) {
	var params = {
		InstanceIds: [instanceId],
		DryRun: false
	};

	this.ec2.terminateInstances(params, function(err, data) {
		if(err)
			callback(err, null);
		else {
			callback(null, true);
		}
	});
};
