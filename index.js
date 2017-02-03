'use strict';

var Rx = require('rxjs/Rx');
var undef = require('ifnotundef');
var vsprintf = require('sprintf-js').vsprintf;
var slice = require('sliced');
var q = require('q');

class TaskSubjectInfo {
    constructor(statusOrTaskSubjectInfo, val, detail) {
        this.startedDate = new Date();
        this.set(statusOrTaskSubjectInfo, val, detail);
    }

    static create(statusOrTaskSubjectInfo, val, detail) {
        return new TaskSubjectInfo(statusOrTaskSubjectInfo, val, detail);
    }

    set(statusOrTaskSubjectInfo, val, detail) {
        this.modifiedDate = new Date();
        if (statusOrTaskSubjectInfo instanceof TaskSubjectInfo) {
            this.status = statusOrTaskSubjectInfo.status;
            this.val = statusOrTaskSubjectInfo.val;
            this.detail = statusOrTaskSubjectInfo.detail;
            this.startedDate = statusOrTaskSubjectInfo.startedDate;
        } else {
            this.status = statusOrTaskSubjectInfo;
            this.val = val;
            this.detail = detail;
        }
    }
}

/**
 *
 * [![GitHub version](https://badge.fury.io/gh/pouc%2Frxjs-task-subject.svg)](https://badge.fury.io/gh/pouc%2Frxjs-task-subject)
 * [![npm version](https://badge.fury.io/js/rxjs-task-subject.svg)](https://badge.fury.io/js/rxjs-task-subject)
 * [![NPM monthly downloads](https://img.shields.io/npm/dm/rxjs-task-subject.svg?style=flat)](https://npmjs.org/package/rxjs-task-subject)
 * [![Build Status](https://travis-ci.org/pouc/rxjs-task-subject.svg?branch=master)](https://travis-ci.org/pouc/rxjs-task-subject)
 * [![Dependency Status](https://gemnasium.com/badges/github.com/pouc/rxjs-task-subject.svg)](https://gemnasium.com/github.com/pouc/rxjs-task-subject)
 * [![Coverage Status](https://coveralls.io/repos/github/pouc/rxjs-task-subject/badge.svg?branch=master)](https://coveralls.io/github/pouc/rxjs-task-subject?branch=master)
 * [![Known Vulnerabilities](https://snyk.io/test/github/pouc/rxjs-task-subject/badge.svg)](https://snyk.io/test/github/pouc/rxjs-task-subject)
 *
 * A extension of ReplaySubject to add useful features like time tracking, details, ...
 *
 * @module rxjs-task-subject
 * @typicalname template
 * @author Lo&iuml;c Formont
 *
 * @license MIT Licensed
 *
 * @example
 * ```javascript
 * var TaskSubject = require("rxjs-task-subject");
 * ```
 */
module.exports = class TaskSubject extends Rx.ReplaySubject {

    constructor() {
        super();

        this.bound = [];
        this.info = TaskSubjectInfo.create('waiting');
    }

    lift(operator) {
        const observable = new Rx.Observable();
        observable.source = this;
        observable.operator = operator;
        return observable;
    }

    next(options) {
        if (options instanceof TaskSubjectInfo) {
            this.set(options);
        } else {
            this.set('running', options);
        }

        super.next(this.get());
    }

    error(options) {
        if (options instanceof TaskSubjectInfo) {
            this.set(options);
        } else {
            this.set('failed', options);
        }

        super.error(this.get());
    }

    toPromise(PromiseCtor) {
        return super
            .toPromise(PromiseCtor)
            .then(
                (ret) => ret.val,
                (err) => { throw err.detail; }
            );
    }

    get() {
        return TaskSubjectInfo.create(this.info);
    }

    set(statusOrTaskSubjectInfo, val, detail) {
        this.info.set(statusOrTaskSubjectInfo, val, detail);
    }

    changeStatus(status, val, detail, err) {
        if (!undef.if(err, false)) this.next(TaskSubjectInfo.create(status, val, detail));
        else this.error(TaskSubjectInfo.create(status, val, detail));
    }

    start() {
        this.set('running');
    }

    running(val, detail) {
        this.changeStatus('running', val, parseDetail(detail, arguments));
    }

    done(val) {
        this.changeStatus('done', val);
        this.complete();
    }

    failed(val, detail) {
        this.changeStatus('failed', val, parseDetail(detail, arguments), true);
    }

    bind(f, first) {
        var myFirst = undef.if(first, false);

        if (this.bound.map((b) => b.f).indexOf(f) >= 0) {
            this.bound.filter((b) => b.f == f).forEach((b) => {
                b.active = true;
                b.first = myFirst;
            });
        } else {
            var boundData = {f: f, active: true, first: myFirst};
            this.bound.push(boundData);

            this
                .filter(() => boundData.active)
                .filter(() => {
                    if (boundData.first) {
                        boundData.active = false;
                        return true;
                    } else {
                        return true;
                    }
                })
                .subscribe(f, f);
        }
    }

    unbind(f) {
        this.bound.filter((b) => b.f == f).forEach((b) => {
            b.active = false;
        });
    }

    once(f) {
        this.bind(f, true);
    }

};

module.exports.TaskSubjectInfo = TaskSubjectInfo;

function parseDetail(detail, args) {

    if (!undef.check(detail)) {
        return;
    } else if (typeof detail !== 'string') {
        return detail;
    } else {
        return vsprintf(detail, slice(args, 2));
    }

}
