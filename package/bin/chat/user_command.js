// Generated by CoffeeScript 1.4.0
(function() {
  var UserCommand, exports, _ref,
    __slice = [].slice;

  exports = (_ref = window.chat) != null ? _ref : window.chat = {};

  /*
   * Represents a user command, like /kick or /say.
  */


  UserCommand = (function() {

    function UserCommand(name, description) {
      this.description = description;
      this.name = name;
      this.describe(this.description);
      this._hasValidArgs = false;
    }

    /*
       * Describe the command using the following format:
       * * description - a description of what the command does; used with /help
       *       <command>
       * * category - what category the command falls under. This is used with /help
       * * params - what parameters the command takes, 'opt_<name>' for optional,
       *       '<name>...' for variable
       *##
       * * validateArgs - returns a truthy variable if the given arguments are valid.
       * * requires - what the command requires to run (e.g. a connections to an IRC
       *       server)
       * * usage - manually set a usage message, one will be generated if not specified
       * * run - the function to call when the command is run
    */


    UserCommand.prototype.describe = function(description) {
      var _ref1, _ref2, _ref3, _ref4, _ref5, _ref6, _ref7;
      if ((_ref1 = this._description) == null) {
        this._description = description.description;
      }
      if ((_ref2 = this._params) == null) {
        this._params = description.params;
      }
      if ((_ref3 = this._requires) == null) {
        this._requires = description.requires;
      }
      if ((_ref4 = this._validateArgs) == null) {
        this._validateArgs = description.validateArgs;
      }
      if ((_ref5 = this._usage) == null) {
        this._usage = description.usage;
      }
      if ((_ref6 = this.run) == null) {
        this.run = description.run;
      }
      return (_ref7 = this.category) != null ? _ref7 : this.category = description.category;
    };

    /*
       * Try running the command. A command can fail to run if its requirements
       * aren't met (e.g. needs a connection to the internet) or the specified
       * arguments are invalid. In these cases a help message is displayed.
       * @param {Context} context Which server/channel the command came from.
       * @param {Object...} args Arguments for the command.
    */


    UserCommand.prototype.tryToRun = function() {
      var args, context;
      context = arguments[0], args = 2 <= arguments.length ? __slice.call(arguments, 1) : [];
      this.setContext(context);
      if (!this.canRun()) {
        if (this.shouldDisplayFailedToRunMessage()) {
          this.displayHelp();
        }
        return;
      }
      this.setArgs.apply(this, args);
      if (this._hasValidArgs) {
        return this.run();
      } else {
        return this.displayHelp();
      }
    };

    UserCommand.prototype.setChat = function(chat) {
      this.chat = chat;
    };

    UserCommand.prototype.setContext = function(context) {
      this.win = this.chat.determineWindow(context);
      if (this.win !== window.chat.NO_WINDOW) {
        this.conn = this.win.conn;
        return this.chan = this.win.target;
      }
    };

    UserCommand.prototype.setArgs = function() {
      var args;
      args = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
      return this._hasValidArgs = this._tryToAssignArgs(args) && (!this._validateArgs || !!this._validateArgs());
    };

    UserCommand.prototype._tryToAssignArgs = function(args) {
      var i, param, params, _i, _len;
      this.args = [];
      this._removeTrailingWhiteSpace(args);
      if (!this._params) {
        return args.length === 0;
      }
      this._resetParams();
      this._truncateVariableArgs(args);
      params = this._truncateExtraOptionalParams(args.length);
      if (args.length !== params.length) {
        return false;
      }
      for (i = _i = 0, _len = params.length; _i < _len; i = ++_i) {
        param = params[i];
        this[this._getParamName(param)] = args[i];
      }
      this.args = args;
      return true;
    };

    UserCommand.prototype._resetParams = function() {
      var param, _i, _len, _ref1, _results;
      _ref1 = this._params;
      _results = [];
      for (_i = 0, _len = _ref1.length; _i < _len; _i++) {
        param = _ref1[_i];
        _results.push(this[this._getParamName(param)] = void 0);
      }
      return _results;
    };

    UserCommand.prototype._removeTrailingWhiteSpace = function(args) {
      var i, _i, _ref1, _results;
      _results = [];
      for (i = _i = _ref1 = args.length - 1; _ref1 <= 0 ? _i <= 0 : _i >= 0; i = _ref1 <= 0 ? ++_i : --_i) {
        if (args[i] === '') {
          _results.push(args.splice(i, 1));
        } else {
          break;
        }
      }
      return _results;
    };

    /*
       * Join all arguments that fit under the variable argument param.
       * Note: only the last argument is allowd to be variable.
    */


    UserCommand.prototype._truncateVariableArgs = function(args) {
      var _ref1;
      if (args.length < this._params.length) {
        return args;
      }
      if (this._isVariable(this._params[this._params.length - 1])) {
        args[this._params.length - 1] = (_ref1 = args.slice(this._params.length - 1)) != null ? _ref1.join(' ') : void 0;
        return args.length = this._params.length;
      }
    };

    UserCommand.prototype._truncateExtraOptionalParams = function(numArgs) {
      var extraParams, i, param, params, _i, _ref1;
      extraParams = this._params.length - numArgs;
      if (extraParams <= 0) {
        return this._params;
      }
      params = [];
      for (i = _i = _ref1 = this._params.length - 1; _ref1 <= 0 ? _i <= 0 : _i >= 0; i = _ref1 <= 0 ? ++_i : --_i) {
        param = this._params[i];
        if (extraParams > 0 && this._isOptional(param)) {
          extraParams--;
        } else {
          params.splice(0, 0, param);
        }
      }
      return params;
    };

    /*
       * When a command can't run, determine if a helpful message should be
       * displayed to the user.
    */


    UserCommand.prototype.shouldDisplayFailedToRunMessage = function() {
      if (this.win === window.chat.NO_WINDOW) {
        return false;
      }
      return this.name !== 'say';
    };

    /*
       * Commands can only run if their requirements are met (e.g. connected to the
       * internet, in a channel, etc) and a run method is defined.
    */


    UserCommand.prototype.canRun = function(opt_context) {
      var requirement, _i, _len, _ref1;
      if (opt_context) {
        this.setContext(opt_context);
      }
      if (!this.run) {
        return false;
      }
      if (!this._requires) {
        return true;
      }
      _ref1 = this._requires;
      for (_i = 0, _len = _ref1.length; _i < _len; _i++) {
        requirement = _ref1[_i];
        if (!this._meetsRequirement(requirement)) {
          return false;
        }
      }
      return true;
    };

    UserCommand.prototype._meetsRequirement = function(requirement) {
      var _ref1;
      switch (requirement) {
        case 'online':
          return isOnline();
        case 'connection':
          return !!this.conn && isOnline();
        case 'channel':
          return !!this.chan;
        default:
          return ((_ref1 = this.conn) != null ? _ref1.irc.state : void 0) === requirement;
      }
    };

    UserCommand.prototype.displayHelp = function(win) {
      if (win == null) {
        win = this.win;
      }
      return win.message('', this.getHelp(), 'notice help');
    };

    UserCommand.prototype.getHelp = function() {
      var descriptionText, usageText, _ref1;
      descriptionText = this._description ? ", " + this._description : '';
      if (this._usage) {
        usageText = ' ' + this._usage;
      }
      if (usageText == null) {
        usageText = ((_ref1 = this._params) != null ? _ref1.length : void 0) > 0 ? " " + (this._getUsage()) : '';
      }
      return this.name.toUpperCase() + usageText + descriptionText + '.';
    };

    UserCommand.prototype._getUsage = function() {
      var param, paramDescription, paramName, _i, _len, _ref1;
      paramDescription = [];
      _ref1 = this._params;
      for (_i = 0, _len = _ref1.length; _i < _len; _i++) {
        param = _ref1[_i];
        paramName = this._getParamName(param);
        if (this._isOptional(param)) {
          paramName = "[" + paramName + "]";
        } else {
          paramName = "<" + paramName + ">";
        }
        paramDescription.push(paramName);
      }
      return paramDescription.join(' ');
    };

    UserCommand.prototype._getParamName = function(param) {
      if (this._isOptional(param)) {
        param = param.slice(4);
      }
      if (this._isVariable(param)) {
        param = param.slice(0, +(param.length - 4) + 1 || 9e9);
      }
      return param;
    };

    UserCommand.prototype._isOptional = function(param) {
      return param.indexOf('opt_') === 0;
    };

    UserCommand.prototype._isVariable = function(param) {
      return (param != null ? param.slice(param.length - 3) : void 0) === '...';
    };

    UserCommand.prototype.isOwnNick = function(nick) {
      var _ref1;
      if (nick == null) {
        nick = this.nick;
      }
      return irc.util.nicksEqual((_ref1 = this.conn) != null ? _ref1.irc.nick : void 0, nick);
    };

    UserCommand.prototype.displayDirectMessage = function(nick, message) {
      var _ref1;
      if (nick == null) {
        nick = this.nick;
      }
      if (message == null) {
        message = this.message;
      }
      if (((_ref1 = this.conn) != null ? _ref1.windows[nick] : void 0) != null) {
        return this._displayDirectMessageInPrivateChannel(nick, message);
      } else {
        return this._displayDirectMessageInline(nick, message);
      }
    };

    /*
       * Used with /msg. Displays the message in a private channel.
    */


    UserCommand.prototype._displayDirectMessageInPrivateChannel = function(nick, message) {
      var context;
      context = {
        server: this.conn.name,
        channel: nick
      };
      return this.chat.displayMessage('privmsg', context, this.conn.irc.nick, message);
    };

    /*
       * Used with /msg. Displays the private message in the current window.
       * Direct messages always display inline until the user receives a response.
    */


    UserCommand.prototype._displayDirectMessageInline = function(nick, message) {
      return this.displayMessageWithStyle('privmsg', nick, message, 'direct');
    };

    UserCommand.prototype.displayMessage = function() {
      var args, context, type, _ref1, _ref2;
      type = arguments[0], args = 2 <= arguments.length ? __slice.call(arguments, 1) : [];
      context = {
        server: (_ref1 = this.conn) != null ? _ref1.name : void 0,
        channel: this.chan
      };
      return (_ref2 = this.chat).displayMessage.apply(_ref2, [type, context].concat(__slice.call(args)));
    };

    /*
       * Displays a message with a custom style. This is useful for indicating that
       * a message be rendered in a special way (e.g. no pretty formatting).
    */


    UserCommand.prototype.displayMessageWithStyle = function() {
      var args, e, style, type, _i, _ref1;
      type = arguments[0], args = 3 <= arguments.length ? __slice.call(arguments, 1, _i = arguments.length - 1) : (_i = 1, []), style = arguments[_i++];
      e = (function(func, args, ctor) {
        ctor.prototype = func.prototype;
        var child = new ctor, result = func.apply(child, args);
        return Object(result) === result ? result : child;
      })(Event, ['message', type].concat(__slice.call(args)), function(){});
      e.setContext((_ref1 = this.conn) != null ? _ref1.name : void 0, this.chan);
      e.addStyle(style);
      return this.chat.emit(e.type, e);
    };

    UserCommand.prototype.handleCTCPRequest = function(nick, type) {
      var delimiter, message;
      this.displayDirectMessage(nick, "CTCP " + type);
      delimiter = irc.CTCPHandler.DELIMITER;
      message = delimiter + type + delimiter;
      return this.conn.irc.doCommand('PRIVMSG', nick, message);
    };

    /*
       * Used to set the arguments for MODE shortcut commands.
       * @param {string} type E.g. /op, /voice, etc.
    */


    UserCommand.prototype.setModeArgs = function(type) {
      this.nicks = [this.nick];
      this.target = this.chan;
      return this.mode = type;
    };

    /*
       * Determine if the given string is a valid mode expression.
       * TODO: This can be improved. (e.g. ++ and +a++ shouldn't be valid)
       * @param {string} mode E.g. +o, -o, +v, etc.
    */


    UserCommand.prototype.isValidMode = function(mode) {
      var _ref1;
      return (_ref1 = mode != null ? mode[0] : void 0) === '+' || _ref1 === '-';
    };

    UserCommand.prototype.listInstalledScripts = function() {
      var names;
      names = this.chat.scriptHandler.getScriptNames();
      if (names.length === 0) {
        return "No scripts are currently installed";
      } else {
        return "Installed scripts: " + (getReadableList(names));
      }
    };

    return UserCommand;

  })();

  exports.UserCommand = UserCommand;

}).call(this);
