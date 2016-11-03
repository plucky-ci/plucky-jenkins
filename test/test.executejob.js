const Code = require('code');
const Lab = require('lab');
const lab = exports.lab = Lab.script();
const nock = require('nock');

const describe = lab.describe;
const it = lab.it;
const before = lab.before;
const after = lab.after;
const expect = Code.expect;

const ExecuteJob = require('../src/executejob');

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
		const jenkins = new ExecuteJob();	
		const jobName = 'test';
		const jobStatus1 = mockJobStatus(jobName)
			.once().reply(200, {'inQueue':[], 'queueItem': [], 'builds': []});
		const jobStart = mockStartJob('test', {});
		const jobStatus2 = mockJobStatus(jobName)
			.twice().reply(200, {'inQueue':[], 'queueItem': [], 'builds': []});

		jenkins.handler({ 
			params: { 
				url: 'http://test.jenkins.com', 
				auth: {
					type: "userpass",
					"userpass": {
						"username": "admin",
						"password": "very_secret"
					}
				},
				jobName: jobName
			}
		}, (code, val) => {
			expect(code).to.equal(0);
			expect(val.result).to.be.equal('idle');
			done();
		});
	});

	it('should return return 0 and a result string when requesting buildWithParams', (done) => {
		const jenkins = new ExecuteJob();	
		const jobName = 'test';
		const jobStatus1 = mockJobStatus(jobName)
			.once().reply(200, {'inQueue':[], 'queueItem': [], 'builds': []});
		const jobStart = mockStartJob('test', {});
		const jobStatus2 = mockJobStatus(jobName)
			.twice().reply(200, {'inQueue':[], 'queueItem': [], 'builds': []});

		jenkins.handler({ 
			params: { 
				url: 'http://test.jenkins.com', 
				auth: {
					type: "userpass",
					"userpass": {
						"username": "admin",
						"password": "very_secret"
					}
				},
				jobName: jobName,
				params: {console_VERSION:'1.0.0'}
			}
		}, (code, val) => {
			expect(code).to.equal(0);
			expect(val.result).to.be.equal('idle');
			done();
		});
	});

	it('should return return 1 and a status if jenkins returns bad requests', (done) => {
		const jenkins = new ExecuteJob();	
		const jobName = 'test';
		const jobStatus1 = mockJobStatus(jobName)
			.once().reply(400, 'bad request');

		jenkins.handler({ 
			params: { 
				url: 'http://test.jenkins.com', 
				auth: {
					type: "userpass",
					"userpass": {
						"username": "admin",
						"password": "very_secret"
					}
				},
				jobName: jobName
			}
		}, (code, val) => {
			expect(code).to.equal(1);
			expect(val.status).to.be.an.object();
			expect(val.status.payload.message).to.be.equal('bad request');
			done();
		});
	});
});
