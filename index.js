'use strict';

var Rx = require('rxjs/Rx');
var undef = require('ifnotundef');
var vsprintf = require('sprintf-js').vsprintf;
var slice = require('sliced');
var q = require('q');

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
        this.startedDate = new Date();

        this.set('waiting');
    }

    lift(operator) {
        const observable = new Rx.Observable();
        observable.source = this;
        observable.operator = operator;
        return observable;
    }

    next(options) {
        this.set(
            undef.child(options, 'status', this.status),
            undef.child(options, 'val', undefined),
            undef.child(options, 'detail', undefined)
        );

        super.next(this.get());
    }

    error(options) {
        this.set(
            'failed',
            undef.child(options, 'val', undefined),
            undef.child(options, 'detail', undefined)
        );

        super.error(this.get());
    }

    get() {
        return {
            status: this.status,
            startedDate: this.startedDate,
            modifiedDate: this.modifiedDate,
            endedDate: this.endedDate,
            failedDate: this.failedDate,
            val: this.val,
            detail: this.detail
        };
    }

    set(status, val, detail) {
        this.modifiedDate = new Date();
        this.status = status;
        this.val = val;
        this.detail = detail;
    }

    changeStatus(status, val, detail, err = false) {
        if (!err) this.next({status: status, val: val, detail: detail});
        else this.error({val: val, detail: detail});
    }

    start() {
        this.set('running');
    }

    running(val, detail) {
        this.changeStatus('running', val, parseDetail(detail, arguments));
    }

    done(val) {
        this.endedDate = new Date();
        this.changeStatus('done', val);
        this.complete();
    }

    failed(val, detail) {
        this.failedDate = new Date();
        this.changeStatus(undefined, val, parseDetail(detail, arguments), true);
    }

    bind(f, first = false) {
        if (this.bound.map((b) => b.f).indexOf(f) >= 0) {
            this.bound.filter((b) => b.f == f).forEach((b) => {
                b.active = true;
                b.first = first;
            });
        } else {
            var boundData = {f: f, active: true, first: first};
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

function parseDetail(detail, args) {

    if (!undef.check(detail)) {
        return;
    } else if (typeof detail !== 'string') {
        return detail;
    } else {
        return vsprintf(detail, slice(args, 2));
    }

}
