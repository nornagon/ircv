// Generated by CoffeeScript 1.4.0
(function() {
  var InputStack, exports;

  exports = window;

  /*
   * A traversable stack of all input entered by the user.
  */


  InputStack = (function() {

    function InputStack() {
      this._previousInputs = [''];
      this._previousInputIndex = 0;
    }

    /*
       * Keeps track of the unentered input that was present when the user
       * began traversing the stack.
       * @param {string} text
    */


    InputStack.prototype.setCurrentText = function(text) {
      if (this._previousInputIndex === 0) {
        return this._previousInputs[0] = text;
      }
    };

    InputStack.prototype.showPreviousInput = function() {
      if (!(this._previousInputIndex >= this._previousInputs.length - 1)) {
        this._previousInputIndex++;
        return this._previousInputs[this._previousInputIndex];
      }
      return void 0;
    };

    InputStack.prototype.showNextInput = function() {
      if (!(this._previousInputIndex <= 0)) {
        this._previousInputIndex--;
        return this._previousInputs[this._previousInputIndex];
      }
      return void 0;
    };

    /*
       * Restarts the traversal position. Should be called when the user begins
       * typing a new command.
    */


    InputStack.prototype.reset = function() {
      return this._previousInputIndex = 0;
    };

    /*
       * Add input to the stack.
       * @param {string} input
    */


    InputStack.prototype.addInput = function(input) {
      return this._previousInputs.splice(1, 0, input);
    };

    return InputStack;

  })();

  exports.InputStack = InputStack;

}).call(this);
