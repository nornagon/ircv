// Generated by CoffeeScript 1.4.0
(function() {
  var Notification, exports, _ref;

  exports = (_ref = window.mocks) != null ? _ref : window.mocks = {};

  Notification = (function() {

    Notification.useMock = function() {
      webkitNotifications.createNotification = function() {
        return new Notification();
      };
      chrome.app.window = {
        current: function() {
          return {
            drawAttention: (function() {}),
            focus: (function() {})
          };
        }
      };
      return this.numActive = 0;
    };

    function Notification() {}

    Notification.prototype.show = function() {
      return Notification.numActive++;
    };

    Notification.prototype.cancel = function() {
      Notification.numActive--;
      return typeof this.onclose === "function" ? this.onclose() : void 0;
    };

    Notification.prototype.click = function() {
      return typeof this.onclick === "function" ? this.onclick() : void 0;
    };

    return Notification;

  })();

  exports.Notification = Notification;

}).call(this);
