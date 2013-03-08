// Generated by CoffeeScript 1.4.0
(function() {

  describe("Util provides the following functions:", function() {
    describe("truncateIfTooLarge", function() {
      it("does nothing if the length of the text is less then the given max size", function() {
        expect(truncateIfTooLarge('puppy', 5)).toBe('puppy');
        return expect(truncateIfTooLarge('', 100)).toBe('');
      });
      it("truncates the text and appends a suffix if the length text of the text        is greater then the max size", function() {
        expect(truncateIfTooLarge('puppy', 4)).toBe('p...');
        return expect(truncateIfTooLarge('sally had a little lamb', 10)).toBe('sally h...');
      });
      return it("can have the suffix changed", function() {
        return expect(truncateIfTooLarge('puppy', 4, '!')).toBe('pup!');
      });
    });
    describe("stripColorCodes", function() {
      it("removes color codes that specify a foreground color", function() {
        var coloredText;
        coloredText = "\u000315hey guy\u0003, how's it going?";
        expect(html.stripColorCodes(coloredText)).toBe("hey guy\u0003, how's it going?");
        coloredText = "\u00033hey guy\u000388, how's it going?";
        return expect(html.stripColorCodes(coloredText)).toBe("hey guy, how's it going?");
      });
      it("removes color codes even when they come before a number", function() {
        var coloredText;
        coloredText = "hi\u0003055";
        return expect(html.stripColorCodes(coloredText)).toBe("hi5");
      });
      return it("removes color codes that specify a forground and background color", function() {
        var coloredText;
        coloredText = "so \u00038,77how are you?";
        return expect(html.stripColorCodes(coloredText)).toBe("so how are you?");
      });
    });
    describe("pluralize", function() {
      it("does nothing if there is one of something", function() {
        expect(pluralize('dog', 1)).toBe('dog');
        return expect(pluralize('stress', 1)).toBe('stress');
      });
      it("adds an 's' when there is 0 or > 1 of something", function() {
        expect(pluralize('cat', 2)).toBe('cats');
        return expect(pluralize('cat', 0)).toBe('cats');
      });
      return it("adds an 'es' when there is 0 or > 1 of something and the word ends in 's'", function() {
        return expect(pluralize('stress', 2)).toBe('stresses');
      });
    });
    describe("getLogger", function() {
      var TestClass1, TestClass2;
      TestClass1 = (function() {

        function TestClass1() {}

        return TestClass1;

      })();
      TestClass2 = (function() {

        function TestClass2() {}

        return TestClass2;

      })();
      return it("logs debug info", function() {
        var a, b, logA, logB;
        spyOn(window.console, 'log');
        spyOn(window.console, 'error');
        spyOn(window.console, 'warn');
        a = new TestClass1;
        b = new TestClass2;
        logA = getLogger(a);
        logB = getLogger(b);
        logA('this is my message!');
        logB('w', 'warning', 5, 'is a great number');
        logA('e', 'error!', 'error msg');
        expect(console.log).toHaveBeenCalledWith('TestClass1:', 'this is my message!');
        expect(console.warn).toHaveBeenCalledWith('TestClass2:', 'warning', 5, 'is a great number');
        return expect(console.error).toHaveBeenCalledWith('TestClass1:', 'error!', 'error msg');
      });
    });
    describe("capitalizeString", function() {
      return it("capitalizes the first letter of words", function() {
        expect(capitalizeString('bob')).toBe('Bob');
        expect(capitalizeString('BILL')).toBe('BILL');
        return expect(capitalizeString('')).toBe('');
      });
    });
    return describe("getReadableList", function() {
      it("returns the single element when the list has a length of 1", function() {
        return expect(getReadableList([5])).toBe('5');
      });
      it("returns the two elements with an 'and' in between when the list has a length of 2", function() {
        return expect(getReadableList(['sally', 'joe'])).toBe('sally and joe');
      });
      return it("returns a comma seperated list with the last element and'd onto the end when the list has a length > 3", function() {
        return expect(getReadableList([1, 2, 3])).toBe('1, 2 and 3');
      });
    });
  });

}).call(this);
