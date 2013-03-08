// Generated by CoffeeScript 1.4.0
(function() {
  var __slice = [].slice;

  describe('A custom command parser', function() {
    var parse, parser, result;
    parser = result = void 0;
    beforeEach(function() {
      return parser = chat.customCommandParser;
    });
    parse = function(text) {
      return result = parser.parse.apply(parser, ['#bash'].concat(__slice.call(text.split(' '))));
    };
    it('parses user input and returns an IRC command', function() {
      parse('nick sugarman');
      return expect(result).toEqual(['NICK', 'sugarman']);
    });
    it("includes the channel if the 2nd arg is '-c'", function() {
      parse('kick -c sugarman "for spamming /dance"');
      return expect(result).toEqual(['KICK', '#bash', 'sugarman', 'for spamming /dance']);
    });
    return describe('merging quoted words', function() {
      var merge;
      merge = function(text) {
        return result = parser._mergeQuotedWords(text.split(' '));
      };
      it("doesn't change unquoted phrases", function() {
        merge('hello world');
        return expect(result).toEqual('hello world'.split(' '));
      });
      it("unquotes a single quoted argument", function() {
        merge('"hi"');
        return expect(result).toEqual(['hi']);
      });
      it("does nothing on an unmatched quote", function() {
        merge('sugarman "for spamming /dance');
        return expect(result).toEqual('sugarman "for spamming /dance'.split(' '));
      });
      it('can merge arguments that are quoted', function() {
        merge('sugarman "for spamming /dance"');
        expect(result).toEqual(['sugarman', 'for spamming /dance']);
        merge('"for spamming /dance" more args');
        expect(result).toEqual(['for spamming /dance', 'more', 'args']);
        merge('sugarman "for spamming /dance" more args');
        return expect(result).toEqual(['sugarman', 'for spamming /dance', 'more', 'args']);
      });
      return it('can merge multiple sets of quoted arguments', function() {
        merge('sugarman "for spamming /dance" more args "this is one arg" last args');
        return expect(result).toEqual(['sugarman', 'for spamming /dance', 'more', 'args', 'this is one arg', 'last', 'args']);
      });
    });
  });

}).call(this);
