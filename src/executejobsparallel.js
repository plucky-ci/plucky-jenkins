const {Task} = require('plucky-pipeliner');
const exec = require('child_process').exec;
const execFile = require('child_process').execFile;
const Jenkins = require('./jenkins');

class ExecuteJobsParallel extends Task {
	execute(state, next) {
		const {
			params
		} = state;
		if(params.jobs === 0) {
			return next(1, {status: "must have at least 1 job"});
		}
		const promiseList = [];
		params.jobs.forEach((job) => {
			const jenkins = new Jenkins(job.params);
			promiseList.push(new Promise((resolve, reject) => {
				jenkins.executeJob({jobName:job.jobName, params: params.params}, (error, result) => {
					if(error) {
						reject({status: error.output});
					}
					resolve({result});
				});
			}));
		});

		Promise.all(promiseList).then((result) => {
			resolve(0, {result});
		}).catch((status) => {
			reject(1, {status});
		});
	}
}

module.exports = ExecuteJobsParallel;