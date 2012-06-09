escapeHTML = (html) ->
	escaped = {
		'&': '&amp;',
		'<': '&lt;',
		'>': '&gt;',
		'"': '&quot;',
	}
	String(html).replace(/[&<>"]/g, (chr) -> escaped[chr])

display = (text) ->
	# Gruber's url-finding regex
	rurl = /\b((?:[a-z][\w-]+:(?:\/{1,3}|[a-z0-9%])|www\d{0,3}[.]|[a-z0-9.\-]+[.][a-z]{2,4}\/)(?:[^\s()<>]+|\(([^\s()<>]+|(\([^\s()<>]+\)))*\))+(?:\(([^\s()<>]+|(\([^\s()<>]+\)))*\)|[^\s`!()\[\]{};:'".,<>?«»“”‘’]))/gi
	canonicalise = (url) ->
		url = escapeHTML url
		if url.match(/^[a-z][\w-]+:/i)
			url
		else
			'http://' + url

	escape = (str) ->
		escapeHTML(str).replace(/\S{40,}/,'<span class="longword">$&</span>')
	res = ''
	textIndex = 0
	while m = rurl.exec text
		res += escape(text.substr(textIndex, m.index - textIndex))
		res += '<a target="_blank" href="'+canonicalise(m[0])+'">'+escape(m[0])+'</a>'
		textIndex = m.index + m[0].length
	res += escape(text.substr(textIndex))
	return res


class IRC5
	constructor: ->
		@$main = $('#main')
		@default_nick = undefined
		# TODO: don't let the user do anything until we load settings
		chrome.storage.sync.get 'nick', (settings) =>
			if settings?.nick
				@default_nick = settings.nick

		@systemWindow = new Window('system')
		@switchToWindow @systemWindow
		@winList = [@systemWindow]

		@systemWindow.message '', "Welcome to irciii, a v2 Chrome app."
		@systemWindow.message '', "Type /connect <server> [port] to connect, then /nick <my_nick> and /join <#channel>."
		@systemWindow.message '', "Alt+[0-9] switches windows."

		@status 'hi!'

		@connections = {}
		# { 'freenode': { irc: irc.IRC, windows: {Window} } }

	quit: ->
		for name,conn of @connections
			conn.irc.socket.end()

	connect: (server, port = 6667) ->
		name = server # TODO: 'irc.freenode.net' -> 'freenode'
		tries = 0
		while @connections[name]
			name = server + ++tries
		c = new irc.IRC server, port, {nick: @default_nick}

		conn = @connections[name] = {irc:c, name, windows:{}}
		c.on 'connect', => @onConnected conn
		c.on 'disconnect', => @onDisconnected conn
		c.on 'message', (target, type, args...) =>
			@onMessage conn, target, type, args...
		c.on 'joined', (chan) => @onJoined conn, chan
		c.on 'parted', (chan) => @onJoined conn, chan
		c.connect()
		@systemWindow.conn = conn

	onConnected: (conn) ->
		@systemWindow.message '', "Connected to #{conn.name}"
		for chan, win of conn.windows
			win.message '', '(connected)', type:'system'

	onDisconnected: (conn) ->
		@systemWindow.message '', "Disconnected from #{conn.name}"
		for chan, win of conn.windows
			win.message '', '(disconnected)', type:'system'

	onJoined: (conn, chan) ->
		unless win = conn.windows[chan]
			win = @makeWin conn, chan
		win.message '', '(You joined the channel.)', type:'system'
	onParted: (conn, chan) ->
		if win = conn.windows[chan]
			win.message '', '(You left the channel.)', type:'system'

	onMessage: (conn, target, type, args...) =>
		if target?
			win = conn.windows[target]
			if win
				handlers[type].apply win, args
				@status()
			else
				@systemWindow.message conn.name, "unknown message: #{target}(#{type}): #{JSON.stringify args}"
				console.warn "unknown message to "+conn.name,target,type,args
		else
			system_handlers[type].apply @systemWindow, [conn].concat(args)

	onStatus: (status) ->
		null

	handlers =
		join: (nick) ->
			@message '', "#{nick} joined the channel.", type:'join'
		part: (nick) ->
			@message '', "#{nick} left the channel.", type:'part'
		nick: (from, to) ->
			@message '', "#{from} is now known as #{to}.", type:'nick'
		quit: (nick, reason) ->
			@message '', "#{nick} has quit: #{reason}.", type:'quit'
		privmsg: (from, msg) ->
			if m = /^\u0001ACTION (.*)\u0001/.exec msg
				@message '', "#{from} #{m[1]}", type:'privmsg action'
			else
				@message from, msg, type:'privmsg'

	system_handlers =
		welcome: (conn, msg) ->
			@message conn.name, msg, type: 'welcome'
		unknown: (conn, cmd) ->
			@message conn.name, cmd.command + ' ' + cmd.params.join(' ')
		nickinuse: (conn, oldnick, newnick, msg) ->
			@message conn.name, "Nickname #{oldnick} already in use: #{msg}"

	makeWin: (conn, chan) ->
		throw new Error("we already have a window for that") if conn.windows[chan]
		win = conn.windows[chan] = new Window(chan)
		win.conn = conn
		win.target = chan
		@winList.push(win)
		win

	status: (status) ->
		if !status
			status = "[#{@currentWindow.conn?.irc.nick}] #{@currentWindow.target}"
		@onStatus(status)

	switchToWindow: (win) ->
		if @currentWindow
			@currentWindow.scroll = @currentWindow.$container.scrollTop()
			@currentWindow.wasScrolledDown = @currentWindow.isScrolledDown()
			@currentWindow.$container.detach()
		@$main.append win.$container
		if win.wasScrolledDown
			win.scroll = win.$container[0].scrollHeight
		win.$container.scrollTop(win.scroll)
		@currentWindow = win
		@status()

	commands = {
		join: (chan) ->
			@currentWindow.conn.irc.send 'JOIN', chan
			win = @makeWin @currentWindow.conn, chan
			@switchToWindow win
		win: (num) ->
			num = parseInt(num)
			@switchToWindow @winList[num] if num < @winList.length
		say: (text...) ->
			if (target = @currentWindow.target) and (conn = @currentWindow.conn)
				msg = text.join(' ')
				@onMessage conn, target, 'privmsg', conn.irc.nick, msg
				conn.irc.send 'PRIVMSG', target, msg
		me: (text...) ->
			commands.say.call this, '\u0001ACTION '+text.join(' ')+'\u0001'
		nick: (newNick) ->
			if conn = @currentWindow.conn
				# TODO: HRHRMRHM
				chrome.storage.sync.set({nick: newNick})
				conn.irc.send 'NICK', newNick
		connect: (server, port) ->
			@connect server, if port then parseInt port
		quit: ->
			@quit()
		dc: ->
			if conn = @currentWindow.conn
				conn.irc.socket.end()
		names: ->
			if (conn = @currentWindow.conn) and (target = @currentWindow.target) and (names = conn.irc.channels[target]?.names)
				names = (v for k,v of names).sort()
				@currentWindow.message '', JSON.stringify names
		help: ->
			@currentWindow.message '', "Available commands: " + Object.keys(commands).join(' ')
	}

	command: (text) ->
		if text[0] == '/'
			cmd = text[1..].split(/\s+/)
			if func = commands[cmd[0].toLowerCase()]
				func.apply(this, cmd[1..])
			else
				console.log "no such command"
		else
			commands.say.call(this, text)


class Window
	constructor: (@name) ->
		@$container = $ "<div id='chat-container'>"
		@$messages = $ "<div id='chat'>"
		@$container.append @$messages

	isScrolledDown: ->
		scrollBottom = @$container.scrollTop() + @$container.height()
		scrollBottom == @$container[0].scrollHeight

	message: (from, msg, opts={}) ->
		scroll = @isScrolledDown
		e = escapeHTML
		extra_classes = [opts.type]
		msg = display msg
		@$messages.append $("""
		<div class='message #{extra_classes.join(' ')}'>
			<div class='source'>#{e from}</div>
			<div class='text'>#{msg}</div>
		</div>
		""")
		if scroll
			@$container.scrollTop(@$container[0].scrollHeight)

irc5 = new IRC5
irc5.onStatus = (status) ->
  $('#status').text(status)
  window.document.title = status

$cmd = $('#cmd')
$cmd.focus()
$(window).keydown (e) ->
	unless e.metaKey or e.ctrlKey
		e.currentTarget = $('#cmd')[0]
		$cmd.focus()
	if e.altKey and 48 <= e.which <= 57
		irc5.command("/win " + (e.which - 48))
		e.preventDefault()
$cmd.keydown (e) ->
	if e.which == 13
		cmd = $cmd.val()
		if cmd.length > 0
			$cmd.val('')
			irc5.command cmd

window.onbeforeunload = ->
	if Object.keys(irc5.connections).length > 0
		"You have IRC connections open."

window.onunload = ->
	irc5.quit()
