// Generated by CoffeeScript 1.4.0
(function() {

  describe("A chat window", function() {
    beforeEach(function() {
      return mocks.dom.setUp();
    });
    afterEach(function() {
      return mocks.dom.tearDown();
    });
    it("doens't display the 'nicks' title when not in any channel", function() {
      var win;
      win = new chat.Window('name');
      win.attach();
      return expect($('#rooms-and-nicks')).toHaveClass('no-nicks');
    });
    return it("clears all messages when the clear command is issued", function() {
      var win;
      win = new chat.Window('name');
      win.attach();
      win.rawHTML('<p>Some text</p>');
      win.clear();
      return expect(win.$messages.html()).toBe('');
    });
  });

}).call(this);
