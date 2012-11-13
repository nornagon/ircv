exports = window.chat ?= {}

##
# A notification used when the user's nick is mentioned.
# Provides functions for determining if a nick was mentioned.
##
class NickMentionedNotification extends window.chat.Notification
  constructor: (channel, from, msg) ->
    msg = msg[..72] + '...' if msg.length > 75
    super "#{channel} - #{from}", msg

  @shouldNotify: (nick, msg) ->
    return false if not nick?
    nick = nick.replace /_+$/, '' # remove trailing underscores
    msgToTest = @_prepMessageForRegex msg, nick
    ///
      \#nick\#     # the nickname
      _*           # any number of underscores
      ([!?.]* |    # any number of ! ? .
      [-:;~\*]?)   # or one ending punctuation
      (?!\S)       # can't be followed by a letter
    ///i.test msgToTest

  @_prepMessageForRegex: (msg, nick) ->
    msg = msg.replace(/,/g, ' ') # treat commas as whitespace
    msg = msg.replace(/\#nick\#/gi, 'a')
    msg = msg.replace(new RegExp("@\?#{nick}", "ig"), '#nick#') # optional preceding @
    # simulate a negative lookbehind to make sure only whitespace precedes the nick
    return msg.replace(/\S\#nick\#/i, 'a')

exports.NickMentionedNotification = NickMentionedNotification