module.exports = Ec2Platform;

function Ec2Platform(config) {
	var AWS = require('aws-sdk');
	if(config)
		AWS.config = config;

	this.ec2 = new AWS.EC2();
}

Ec2Platform.prototype.startInstance = function(params, callback) {
	// TODO: do something to params?
	this.ec2.runInstances(params, function(err, data) {
		if (err)
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
