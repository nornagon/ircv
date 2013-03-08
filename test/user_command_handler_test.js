// Generated by CoffeeScript 1.4.0
(function() {
  var __slice = [].slice;

  describe('A user command handler', function() {
    var context, getWindow, handle, handler, onJoin, onMe, onMessage, onMode, win;
    win = onMode = onJoin = onMe = handler = void 0;
    onMessage = jasmine.createSpy('onMessage');
    context = {
      determineWindow: function() {
        return win;
      },
      storage: {},
      displayMessage: function() {}
    };
    getWindow = function() {
      return {
        message: onMessage,
        target: '#bash',
        conn: {
          name: 'freenode.net',
          irc: {
            state: 'connected',
            nick: 'ournick',
            channels: {}
          }
        }
      };
    };
    handle = function() {
      var args, name;
      name = arguments[0], args = 2 <= arguments.length ? __slice.call(arguments, 1) : [];
      return handler.handle.apply(handler, [name, {}].concat(__slice.call(args)));
    };
    beforeEach(function() {
      mocks.navigator.useMock();
      onMessage.reset();
      win = getWindow();
      handler = new chat.UserCommandHandler(context);
      onJoin = spyOn(handler._handlers.join, 'run');
      onMe = spyOn(handler._handlers.me, 'run');
      return onMode = spyOn(handler._handlers.mode, 'run');
    });
    it("can handle valid user commands", function() {
      var command, _i, _len, _ref, _results;
      _ref = ['join', 'win'];
      _results = [];
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        command = _ref[_i];
        _results.push(expect(handler.canHandle(command)).toBe(true));
      }
      return _results;
    });
    it("can't handle invalid user commands", function() {
      var command, commands, _i, _len, _results;
      commands = ['not_a_command', 'neitheristhis'];
      _results = [];
      for (_i = 0, _len = commands.length; _i < _len; _i++) {
        command = commands[_i];
        _results.push(expect(handler.canHandle(command)).toBe(false));
      }
      return _results;
    });
    it('runs commands that have valid args and can be run', function() {
      handle('join');
      return expect(onJoin).toHaveBeenCalled();
    });
    it("doesn't run commands that can't be run", function() {
      win.conn.irc.state = 'disconnected';
      handle('me', 'hi!');
      return expect(onMe).not.toHaveBeenCalled();
    });
    it("displays a help message when a command is run with invalid args", function() {
      handle('join', 'channel', 'key', 'extra_arg');
      expect(onJoin).not.toHaveBeenCalled();
      return expect(onMessage.mostRecentCall.args[1]).toBe('JOIN [channel] [key], joins the ' + 'channel with the key if provided, reconnects to the current channel if no channel is specified.');
    });
    it("allows commands to extend eachother for easy aliasing", function() {
      handle('me', 'hey guy!');
      expect(onMe).toHaveBeenCalled();
      return expect(handler._handlers.me.text).toBe('\u0001ACTION hey guy!\u0001');
    });
    it("supports the mode command", function() {
      handle('mode');
      expect(onMode).toHaveBeenCalled();
      onMode.reset();
      handle('mode', 'channel', 'invalid mode');
      expect(onMode).not.toHaveBeenCalled();
      handle('mode', '+sm-v', 'nick1', 'nick2', 'nick3');
      return expect(onMode).toHaveBeenCalled();
    });
    it("supports the away command", function() {
      var onAway;
      onAway = spyOn(handler._handlers.away, 'run');
      handle('away');
      expect(onAway).toHaveBeenCalled();
      handle('away', "I'm", "busy");
      return expect(onAway).toHaveBeenCalled();
    });
    it("supports the op command", function() {
      var onOp;
      onOp = spyOn(handler._handlers.op, 'run');
      handle('op', 'othernick');
      return expect(onOp).toHaveBeenCalled();
    });
    it("only runs /join-server when online", function() {
      var onJoinServer;
      onJoinServer = spyOn(handler._handlers['join-server'], 'run');
      handle('join-server');
      expect(onJoinServer).toHaveBeenCalled();
      mocks.navigator.goOffline();
      handler._handlers['join-server'].run.reset();
      handle('join-server');
      return expect(onJoinServer).not.toHaveBeenCalled();
    });
    return describe("handles the command autostart", function() {
      beforeEach(function() {
        return context.storage.setAutostart = jasmine.createSpy('setAutostart');
      });
      it("enables autostart with 'autostart on'", function() {
        handle('autostart', 'on');
        return expect(context.storage.setAutostart).toHaveBeenCalledWith(true);
      });
      it("disables autostart with 'autostart off'", function() {
        handle('autostart', 'off');
        return expect(context.storage.setAutostart).toHaveBeenCalledWith(false);
      });
      it("toggles autostart with 'autostart'", function() {
        handle('autostart');
        return expect(context.storage.setAutostart).toHaveBeenCalledWith(void 0);
      });
      return it("doesn't accept invalid input", function() {
        handle('autostart', 'offf');
        handle('autostart', 'bob');
        expect(context.storage.setAutostart).not.toHaveBeenCalled();
        handle('autostart', 'oFf');
        return expect(context.storage.setAutostart).toHaveBeenCalled();
      });
    });
  });

}).call(this);
