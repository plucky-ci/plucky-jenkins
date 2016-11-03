const Code = require('code');
const Lab = require('lab');
const lab = exports.lab = Lab.script();
const nock = require('nock');

const describe = lab.describe;
const it = lab.it;
const before = lab.before;
const after = lab.after;
const expect = Code.expect;

const ExecuteJobsParallel = require('../src/executejobsparallel');

const noop = ()=>{};

const mockJobStatus = (jobName) => {
	return nock('http://test.jenkins.com')
			.get(`/job/${jobName}/api/json`);
};

const mockStartJob = (jobName, params) => {
	const parameters = Object.keys(params).map((key)=>key+'='+encodeURIComponent(params[key])).join('&');
	const cmd = Object.keys(params).length===0?'build':'buildWithParameters';
	
	return nock('http://test.jenkins.com')
			.post(`/job/${jobName}/${cmd}/api/json?${parameters}`)
			.reply(200);
};

describe('PluckyJenkins', ()=>{
	it('should return return 0 and a result string', (done) => {
		const jenkins = new ExecuteJobsParallel();	
		const jobName = 'test';
		const jobStatus1 = mockJobStatus(jobName)
			.once().reply(200, {'inQueue':[], 'queueItem': [], 'builds': []});
		const jobStart = mockStartJob('test', {});
		const jobStatus2 = mockJobStatus(jobName)
			.twice().reply(200, {'inQueue':[], 'queueItem': [], 'builds': []});

		jenkins.execute({params: {
			jobs: [{ 
				url: 'http://test.jenkins.com', 
				auth: {
					type: "userpass",
					"userpass": {
						"username": "admin",
						"password": "very_secret"
					}
				},
				jobName: jobName
			}]
		}}, (code, val) => {
			expect(code).to.equal(0);
			expect(val.result).to.be.an.array();
			expect(val.result[0].result).to.equal('idle');
			done();
		});
	});

	it('should return return 1 and a status string', (done) => {
		const jenkins = new ExecuteJobsParallel();	
		const jobName = 'test';

		jenkins.execute({params: {
			jobs: []
		}}, (code, val) => {
			expect(code).to.equal(1);
			expect(val.status).to.be.a.string();
			done();
		});
	});

	it('should return return 1 and a status of a job fail', (done) => {
		const jenkins = new ExecuteJobsParallel();	
		const jobName = 'test';
		const jobStatus1 = mockJobStatus(jobName)
			.once().reply(200, {'inQueue':[], 'queueItem': [], 'builds': []});
		const jobStart = mockStartJob('test', {});
		const jobStatus2 = mockJobStatus(jobName)
			.twice().reply(200, {'builds': [{url:'http://test.jenkins.com/badbuildrequest/'}]});
		const jobStatus3 = nock('http://test.jenkins.com')
			.get(`/badbuildrequest/api/json`).
			reply(200, {result: 'FAILURE'});

		jenkins.execute({params: {
			jobs: [{ 
				url: 'http://test.jenkins.com', 
				auth: {
					type: "userpass",
					"userpass": {
						"username": "admin",
						"password": "very_secret"
					}
				},
				jobName: jobName
			}]
		}}, (code, val) => {
			expect(code).to.equal(1);
			expect(val.status).to.be.a.string();
			done();
		});
	});
});
