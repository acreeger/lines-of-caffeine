function CustomValidationError(message) {
  this.message = message;
};

CustomValidationError.prototype.__proto__ = Error.prototype;

exports.CustomValidationError = CustomValidationError;