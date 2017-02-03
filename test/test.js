var promise = require('q');
var chai = require('chai');
var sinon = require('sinon');
var Rx = require('rxjs/Rx');

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
        expect(task.info.status).to.equal('waiting');

        task.start();

        expect(task.info.status).to.equal('running');
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

        expect(task.info.val).to.equal('aze');
        expect(task.info.detail).to.equal('rty');

    });

    it('should store printf status', function() {

        var task = new exports();
        task.running('aze', 'rty %s', 'toto');

        expect(task.info.val).to.equal('aze');
        expect(task.info.detail).to.equal('rty toto');

    });

    it('should be done', function() {

        var task = new exports();
        var cb = sinon.spy();

        task.done('yeah');

        expect(task.info.status).to.equal('done');
        expect(task.info.val).to.equal('yeah');
        expect(task.info.detail).to.be.undefined;

        task.once(cb);

        expect(cb).to.have.been.calledOnce;

        task.unbind(cb);
        task.bind(cb);

        expect(cb).to.have.been.calledOnce;

    });

    it('should be failed', function() {

        var task = new exports();
        task.failed('yeah');

        expect(task.info.status).to.equal('failed');
        expect(task.info.val).to.equal('yeah');
        expect(task.info.detail).to.be.undefined;

    });
    
    it('should subscribe', function() {

        var task1 = new exports();
        
        [1, 2, 3, 4, 5].forEach(val => {
            task1.running(val);
        });
        
        task1.done('toto');
        
        var task2 = new exports();
        var cb = sinon.spy();
        
        task1.subscribe(task2);
        task2.bind(cb);
        
        expect(cb).to.have.callCount(6);
        
        expect(task1.info.status).to.equal('done');
        expect(task2.info.status).to.equal('done');
        
        expect(task1.info.val).to.equal('toto');
        expect(task2.info.val).to.equal('toto');

    });
    
    it('should subscribe (advanced)', function() {

        var task1 = new exports();
        
        [1, 2, 3, 4, 5].forEach(val => {
            task1.running(val);
        });
        

        var task2 = new exports();
        var cb = sinon.spy();
        
        task1.subscribe(task2);
        task2.bind(cb);
        
        task2.running(123);
        
        expect(task1.info.status).to.equal('running');
        expect(task2.info.status).to.equal('running');
        
        expect(task1.info.val).to.equal(5);
        expect(task2.info.val).to.equal(123);
        
        task1.running(456);
        
        expect(task1.info.val).to.equal(456);
        expect(task2.info.val).to.equal(456);
        
        task1.done('toto');
        
        expect(cb).to.have.callCount(8);
        
        expect(task1.info.status).to.equal('done');
        expect(task2.info.status).to.equal('done');
        
        expect(task1.info.val).to.equal('toto');
        expect(task2.info.val).to.equal('toto');

    });
    
    it('should subscribe through promises', function() {
       
        var task1 = new exports();

        Rx.Observable
            .from(promise.delay(100).then(() => promise.resolve('GOOD')))
            .subscribe(task1);
        
        var task2 = new exports();
       
        Rx.Observable
            .from(promise.delay(100).then(() => promise.reject('FAIL')))
            .catch((err) => {
                return Rx.Observable.from(task1.toPromise());
            })
            .subscribe(task2);
            
        return promise.all([
            expect(task1.toPromise()).to.eventually.equal('GOOD'),
            expect(task2.toPromise()).to.eventually.equal('GOOD')
        ]);
       
    });

});