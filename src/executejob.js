const {Task} = require('plucky-pipeliner');
const exec = require('child_process').exec;
const execFile = require('child_process').execFile;
const Jenkins = require('./jenkins');

class ExecuteJob extends Task {
	handler(state, next) {
		const {
			params
		} = state;
		if(!params.url) {
			return next(1, {status: 'url must be provided'});
		}

		const jenkins = new Jenkins(params);
		jenkins.executeJob({jobName:params.jobName, params: params.params}, (error, result) => {
			if(error) {
				return next(1, {status: error.output});
			}
			next(0, {result});
		});

	}
}

module.exports = ExecuteJob;