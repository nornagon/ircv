// Generated by CoffeeScript 1.4.0
(function() {
  var MockMessageHandler, exports, _ref,
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  exports = (_ref = window.test) != null ? _ref : window.test = {};

  MockMessageHandler = (function(_super) {

    __extends(MockMessageHandler, _super);

    function MockMessageHandler() {
      return MockMessageHandler.__super__.constructor.apply(this, arguments);
    }

    MockMessageHandler.prototype._handlers = {
      eat: function() {},
      drink: function() {}
    };

    return MockMessageHandler;

  })(MessageHandler);

  exports.MockMessageHandler = MockMessageHandler;

}).call(this);
