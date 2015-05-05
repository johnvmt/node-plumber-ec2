module.exports = function(plumber, config) {
	return new Ec2Platform(plumber, config);
};

var Utils = require("./Utils");

function Ec2Platform(plumber, config) {
	var AWS = require('aws-sdk');
	if(config)
		AWS.config = config;

	if(typeof config.region == "string")
		this.region = config.region;

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

Ec2Platform.prototype.instanceCost = function(params, callback) {
	var region = (typeof params.region === "string") ? params.region : this.region;
	if(typeof region !== "string")
		callback("region_not_defined", null);
	else {
		var instanceInfo = this._instanceInfo(params.InstanceType, region);
		if (typeof instanceInfo === "undefined")
			callback("not_found", null);
		else {
			var instanceCost = Utils.objectGet(instanceInfo, ["valueColumns", 0, "prices"]);
			if (typeof instanceCost !== "object")
				callback("parse_error", null);
			else {
				var currency = Utils.objectGet(Object.keys(instanceCost), [0]); // get the first key (currency)
				if (typeof currency !== "string")
					callback("parse_error_currency", null);
				else {
					callback(null, {
						currency: currency,
						cost: instanceCost[currency],
						timePeriod: 3600
					});
				}
			}
		}
	}
};

Ec2Platform.prototype._instanceInfo = function(size, region) {
	var prices = require("./prices.json");

	var instances = Utils.objectGet(prices, [
		"config",
		"regions",
		function(regionObj) {
			return regionObj.region == region
		},
		"instanceTypes",
		function(types) {
			// filter out unused instance types
			var filter = Utils.objectGet(types, [
				"sizes",
				function(type) {
					return type.size == size
				}
			]);
			return (typeof filter == "object" && filter.length >= 1);
		},
		"sizes",
		function(type) {
			return type.size == size;
		}
	]);

	var findNonEmpty = function(array) {
		if(Array.isArray(array)) {
			var length = array.length;
			for (var ctr = 0; ctr < length; ctr++) {
				if (array[ctr] != null)
					return array[ctr];
			}
		}
		else
			return undefined;
	};

	return findNonEmpty(findNonEmpty(findNonEmpty(instances)));
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
