let Context = require('./Context.js');
let debug = require('debug')('PP:pagelink');

module.exports = class PipeLink {
  constructor(fn, ID) {
    this._originalHandler = fn;
    this._handler = fn;
    this._id = ID;
    this.name = fn.name;
    this._context = undefined;
  }
  setEnv(env) {
    this._env = env;
    return this;
  }
  setCatch() {
    this.isCatch = true;
    return this;
  }

  setCache() {
    this.isCache = true;
    return this;
  }

  mixContext(context) {
    const handler = this._handler;
    this.context = context;
    this._handler = function() {
      let args = [].slice.call(arguments);
      args[1] = context;
      return handler.apply(context, args);
    }
    return this;
  }

  static getNewLink(fn, ID) {
    return new PipeLink(fn, ID);
  }

  static getCleanupLink(ID) {
    let link = new PipeLink(cleanUpLink, ID);
    link.name = 'cleanUpLink';
    return link;
  }
  static getDebugLink(ID) {
    let link = new PipeLink(cleanUpLink, ID);
    link.name = 'debugLink';
    return link;
  }
  static cloneLink(link) {
    let newLink = new PipeLink(link._originalHandler);
    newLink.name = link.name;
    newLink._env = link._env;
    newLink._id = link._id;
    newLink.isCatch = link.isCatch;
    newLink.isCache = link.isCache;
    return newLink;
  }
}

function cleanUpLink(data, context) {
  Context.cleanUp(context);
  return data;
}

function debugLink(data, context) {
  console.log("PRINT DEBUG");
  return data;
}
