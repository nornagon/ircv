exports = window.chat ?= {}

##
# Handles user commands, including providing help messages and determining if a
# command can be run in the current context.
##
class UserCommandHandler extends MessageHandler
  constructor: (@chat) ->
    @_handlers = {}
    @_init()
    super

  getCommands: ->
    Object.keys @_handlers

  getCommand: (command) ->
    @_handlers[command]

  listenTo: (emitter) ->
    emitter.on 'command', (e) =>
      if @canHandle e.name
        @handle e.name, e, e.args...

  handle: (type, context, args...) ->
    if not @_isValidUserCommand type
      # the command must be a developer command
      super type, context, args...
      return
    command = @_handlers[type]
    command.tryToRun context, args...

  _isValidUserCommand: (type) ->
    type of @_handlers

  ##
  # Creates all user commands. The "this" parameter in the run() and
  # parseArgs() functions is {UserCommand}.
  ##
  _init: ->
    @_addCommand 'join',
      description: 'joins the channel, the current channel is used by default'
      params: ['opt_channel']
      requires: ['connection']
      parseArgs: ->
        @channel ?= @chan
      run: ->
        @chat.join @conn, @channel

    @_addCommand 'part',
      description: "closes the current window and disconnects from the channel"
      params: ['opt_reason...']
      requires: ['connection', 'channel']
      run: ->
        unless @win.isPrivate()
          @conn.irc.part @chan, @reason
        @chat.removeWindow(@win)

    @_addCommand 'win',
      description: 'switches windows'
      params: ['windowNum']
      parseArgs: ->
        @windowNum = parseInt @windowNum
      run: ->
        @chat.switchToWindowByIndex @windowNum

    @_addCommand 'say',
      description: 'sends text to the current channel'
      params: ['text...']
      requires: ['connection', 'channel', 'connected']
      run: ->
        @conn.irc.doCommand 'PRIVMSG', @chan, @text
        @displayMessage 'privmsg', @conn.irc.nick, @text

    @_addCommand 'me',
      description: 'sends text to the current channel, spoken in the 3rd person'
      extends: 'say'
      parseArgs: ->
        @text = "\u0001ACTION #{@text}\u0001"

    @_addCommand 'nick',
      description: 'sets your nick'
      params: ['nick']
      parseArgs: ->
        @nick = html.escape @nick
      run: ->
        @chat.setNick @conn?.name, @nick

    @_addCommand 'server',
      description: 'connects to the server, port 6667 is used by default, ' +
          "reconnects to the current server if no server is specified"
      params: ['opt_server', 'opt_port']
      requires: ['online']
      parseArgs: ->
        @port ?= parseInt(@server) || 6667
        @port = parseInt(@port)
        @server ?= @conn?.name
        return @port and @server
      run: ->
        @chat.connect @server, @port

    @_addCommand 'connect',
      extends: 'server'

    @_addCommand 'quit',
      description: 'disconnects from the current server'
      params: ['opt_reason...']
      requires: ['connection']
      run: ->
        @chat.closeConnection @conn

    @_addCommand 'names',
      description: 'lists nicks in the current channel'
      requires: ['connection', 'channel', 'connected']
      run: ->
        if @win.isPrivate()
          msg = "You're in a private conversation with #{@chan}."
        else
          names = (v for k,v of @conn.irc.channels[@chan].names).sort()
          msg = "Users in #{@chan}: #{JSON.stringify names}"
        @win.message '', msg, 'notice names'

    @_addCommand 'help',
      description: "displays information about a command, lists all commands " +
          "if no command is specified"
      params: ["opt_command"]
      run: ->
        @command = @chat.userCommands.getCommand @command
        if @command
          @command.displayHelp()
        else
          commands = @chat.userCommands.getCommands()
          @win.messageRenderer.displayHelp commands

    @_addCommand 'raw',
      description: "sends a raw event to the IRC server, use the -c flag to " +
          "make the command apply to the current channel"
      params: ['command', 'opt_args...']
      usage: '<command> [-c] [arguments...]'
      requires: ['connection']
      parseArgs: ->
        @args = if @args then @args.split ' ' else []
      run: ->
        command = chat.customCommandParser.parse @chan, @command, @args...
        @conn.irc.doCommand command...

    @_addCommand 'load',
      description: "loads a script by opening a file browser dialog"
      run: ->
        script.loader.createScriptFromFileSystem (script) =>
          @chat.emit 'script_loaded', script

    @_addCommand 'topic',
      description: "sets the topic of the current channel, displays the " +
          "current topic if no topic is specified"
      params: ['opt_topic...']
      requires: ['connection', 'channel']
      run: ->
        @conn.irc.doCommand 'TOPIC', @chan, @topic

    @_addCommand 'kick',
      description: "removes the nick from the current channel"
      params: ['nick', 'opt_reason...']
      requires: ['connection', 'channel']
      run: ->
        @conn.irc.doCommand 'KICK', @chan, @nick, @reason

    @_addCommand 'mode',
      # TODO when used with no args, display current modes
      description: "sets the mode for the given user, your nick is used if " +
          "no nick is specified"
      params: ['opt_nick', 'mode']
      requires: ['connection']
      parseArgs: ->
        @nick ?= @conn.irc.nick
      run: ->
        if @isOwnNick() and @mode in ['+o', '+O', '-r']
          @displayMessage 'error', "You can't give yourself #{@mode} status"
        else if @chan
          @conn.irc.doCommand 'MODE', @chan, @mode, @nick
        else
          @conn.irc.doCommand 'MODE', @mode, @nick

    @_addCommand 'op',
      description: "gives operator status"
      params: ['nick']
      extends: 'mode'
      parseArgs: -> @mode = '+o'

    @_addCommand 'deop',
      description: "removes operator status"
      params: ['nick']
      extends: 'mode'
      parseArgs: -> @mode = '-o'

    @_addCommand 'voice',
      description: "gives voice"
      params: ['nick']
      extends: 'mode'
      parseArgs: -> @mode = '+v'

    @_addCommand 'devoice',
      description: "removes voice"
      params: ['nick']
      extends: 'mode'
      parseArgs: -> @mode = '-v'

    @_addCommand 'away',
      description: "sets your status to away, a response is " +
          "automatically sent when people /msg or WHOIS you"
      params: ['opt_response...']
      requires: ['connection']
      parseArgs: ->
        unless stringHasContent @response
          @response = "I'm currently away from my computer"
        true
      run: ->
        @conn.irc.doCommand 'AWAY', @response

    @_addCommand 'back',
      description: "sets your status to no longer being away"
      requires: ['connection']
      run: -> @conn.irc.doCommand 'AWAY', @response

    @_addCommand 'msg',
      description: "sends a private message"
      params: ['nick', 'message...']
      requires: ['connection']
      run: ->
        @conn.irc.doCommand 'PRIVMSG', @nick, @message
        @displayDirectMessage()

    @_addCommand 'about',
      description: "displays information about this IRC client"
      run: ->
        @win.messageRenderer.displayAbout()

    @_addCommand 'join-server',
      description: "use the IRC connection of another device, allowing you " +
          "to be logged in with the same nick on multiple devices. " +
          "Connects to the device that called /make-server if no arguments " +
          "are given"
      requires: ['online']
      params: ['opt_addr', 'opt_port']
      parseArgs: ->
        parsedPort = parseInt(@port)
        return false if (@port || @addr) and not (parsedPort || @addr)
        connectInfo = @chat.storage.serverDevice
        @port = parsedPort || connectInfo?.port
        @addr ?= connectInfo?.addr
        true
      run: ->
        if @port and @addr
          if @addr is @chat.remoteConnection.getConnectionInfo().addr
            @displayMessage 'error', "this device is the server and cannot " +
                "connect to itself. Call /join-server on other devices to " +
                "have them connect to this device or call /make-server on " +
                "another device to make it the server"
          else
            @chat.remoteConnectionHandler.isManuallyConnecting()
            @chat.remoteConnection.connectToServer { port: @port, addr: @addr }
        else
          @displayMessage 'error', "No server exists. Use /make-server " +
              "on the device you wish to become the server."

    @_addCommand 'make-server',
      description: "makes this device a server to which other devices can " +
          "connect. Connected devices use the IRC connection of this device"
      requires: ['online']
      run: ->
        state = @chat.remoteConnection.getState()
        if @chat.remoteConnectionHandler.shouldBeServerDevice()
          @displayMessage 'error', "this device is already acting as a " +
              "server"
        else if not api.listenSupported()
          @displayMessage 'error', "this command cannot be used with your " +
              "current version of Chrome because it does not support " +
              "chrome.socket.listen"
        else if state is 'no_addr'
          @displayMessage 'error', "this device can not be used as a " +
              "server at this time because it cannot find its own IP address"
        else if state is 'no_port'
          @displayMessage 'error', "this device can not be used as a " +
              "server at this time because no valid port was found"
        else if state is 'finding_port'
          @chat.remoteConnection.waitForPort => @run
        else
          @chat.storage.becomeServerDevice @chat.remoteConnection.getConnectionInfo()
          @chat.remoteConnectionHandler.determineConnection()

    @_addCommand 'network-info',
      description: "displays network information including " +
          "port, ip address and remote connection status"
      run: ->
        @displayMessage 'breakgroup'
        if @chat.remoteConnection.isServer()
          numClients = @chat.remoteConnection.devices.length
          if numClients > 0
            @displayMessage 'notice', "acting as a server for " +
                @chat.remoteConnection.devices.length + " other " +
                pluralize 'device', @chat.remoteConnection.devices.length
          else
            @displayMessage 'notice', "Acting as a server device. No clients " +
                "have connected."

        else if @chat.remoteConnection.isClient()
          @displayMessage 'notice', "connected to server device " +
              @chat.remoteConnection.serverDevice.addr + " on port " +
              @chat.remoteConnection.serverDevice.port

        else
          @displayMessage 'notice', "not connected to any other devices"

        state = @chat.remoteConnection.getConnectionInfo().getState()
        return unless state is 'found_port'
        @displayMessage 'breakgroup'
        connectionInfo = @chat.remoteConnection.getConnectionInfo()
        @displayMessageWithStyle 'notice', "Port: #{connectionInfo.port}", 'no-pretty-format'
        @displayMessage 'breakgroup'
        @displayMessage 'notice', "IP addresses:"
        for addr in connectionInfo.possibleAddrs
          @displayMessageWithStyle 'notice', "    #{addr}", 'no-pretty-format'

    @_addCommand 'autostart',
      description: "sets whether the application will run on startup, " +
          "toggles if no arguments are given"
      usage: '[ON|OFF]'
      params: ['opt_state']
      parseArgs: ->
        unless @state
          @enabled = undefined
          return true
        @state = @state.toLowerCase()
        return false unless @state is 'on' or @state is 'off'
        @enabled = @state is 'on'
        true
      run: ->
        willAutostart = @chat.storage.setAutostart @enabled
        if willAutostart
          @displayMessage 'notice', "CIRC will now automatically " +
              "run on startup"
        else
          @displayMessage 'notice', "CIRC will no longer " +
              "automatically run on startup"

  _addCommand: (name, commandDescription) ->
    command = new chat.UserCommand name, commandDescription
    commandToExtend = @_handlers[commandDescription.extends]
    command.describe commandToExtend.description if commandToExtend
    command.setChat @chat
    @_handlers[name] = command

exports.UserCommandHandler = UserCommandHandler