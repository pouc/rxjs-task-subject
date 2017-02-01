var promise = require('q');
var chai = require('chai');
var sinon = require('sinon');

chai.use(require('chai-as-promised'));
chai.use(require('sinon-chai'));
chai.use(require('chai-things'));

var expect = chai.expect;
var should = chai.should();

var exports = require('../index.js');

function check(done, f) {

	return promise().then(() => {
		try {
			return f();
		} catch (e) {
			return promise.reject(e);
		}
	}).then(() => {
		done();
	}).fail((err) => {
		done(err);
	}); 

}

describe('TaskSubject...', function() {

	it('should be defined', function() {
		expect(exports).to.not.be.undefined;
	});

    it('should be created', function() {
        
        var task = new exports();
        
        expect(task).to.not.be.undefined;
        expect(task.status).to.equal('waiting');

        task.start();

        expect(task.status).to.equal('running');
    });

    it('should alert once', function(done) {
        
        var task = new exports();
        var cb = sinon.spy();

        task.once(cb);
        task.once(cb);

        promise.all([
            task.running('a1'),
            task.running('b1')
        ]).then(function() {
            check(done, function() {
                expect(cb).to.have.been.calledOnce;
            })
        });

    });

    it('should alert thrice', function(done) {

        var task = new exports();
        var cb = sinon.spy();

        task.bind(cb);
        task.bind(cb);

        promise.all([
            task.running('a2'),
            task.running('b2'),
            task.running('c2')
        ]).then(function() {
            check(done, function() {
                expect(cb).to.have.been.calledThrice;
                task.unbind(cb);
            })
        });

    });

    it('should not alert', function(done) {

        var task = new exports();
        var cb = sinon.spy();

        task.bind(cb);
        task.unbind(cb);

        promise.all([
            task.running()
        ]).then(function() {
            check(done, function() {
                expect(cb).to.not.have.been.called;
            })
        });

    });

    it('should store status', function() {

        var task = new exports();
        task.running('aze', 'rty');

        expect(task.val).to.equal('aze');
        expect(task.detail).to.equal('rty');

    });

    it('should store printf status', function() {

        var task = new exports();
        task.running('aze', 'rty %s', 'toto');

        expect(task.val).to.equal('aze');
        expect(task.detail).to.equal('rty toto');

    });

    it('should be done', function() {

        var task = new exports();
        var cb = sinon.spy();

        task.done('yeah');

        expect(task.status).to.equal('done');
        expect(task.val).to.equal('yeah');
        expect(task.detail).to.be.undefined;

        task.once(cb);

        expect(cb).to.have.been.calledOnce;

        task.unbind(cb);
        task.bind(cb);

        expect(cb).to.have.been.calledOnce;

    });

    it('should be failed', function() {

        var task = new exports();
        task.failed('yeah');

        expect(task.status).to.equal('failed');
        expect(task.val).to.equal('yeah');
        expect(task.detail).to.be.undefined;

    });

});