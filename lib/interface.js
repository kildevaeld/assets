"use strict";

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var AssetsError = function (_Error) {
    _inherits(AssetsError, _Error);

    function AssetsError(message) {
        _classCallCheck(this, AssetsError);

        var _this = _possibleConstructorReturn(this, Object.getPrototypeOf(AssetsError).call(this, message));

        _this.message = message;
        return _this;
    }

    return AssetsError;
}(Error);

exports.AssetsError = AssetsError;

var ThumbnailError = function (_AssetsError) {
    _inherits(ThumbnailError, _AssetsError);

    function ThumbnailError() {
        _classCallCheck(this, ThumbnailError);

        return _possibleConstructorReturn(this, Object.getPrototypeOf(ThumbnailError).apply(this, arguments));
    }

    return ThumbnailError;
}(AssetsError);

exports.ThumbnailError = ThumbnailError;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImludGVyZmFjZS5qcyIsImludGVyZmFjZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7Ozs7Ozs7SUNtREE7OztBQUNJLGFBREosV0FDSSxDQUFvQixPQUFwQixFQUFrQzs4QkFEdEMsYUFDc0M7OzJFQUR0Qyx3QkFFYyxVQUR3Qjs7QUFBZCxjQUFBLE9BQUEsR0FBQSxPQUFBLENBQWM7O0tBQWxDOztXQURKO0VBQWlDOztBQUFwQixRQUFBLFdBQUEsR0FBVyxXQUFYOztJQU1iOzs7Ozs7Ozs7O0VBQW9DOztBQUF2QixRQUFBLGNBQUEsR0FBYyxjQUFkIiwiZmlsZSI6ImludGVyZmFjZS5qcyIsInNvdXJjZXNDb250ZW50IjpbIlwidXNlIHN0cmljdFwiO1xuY2xhc3MgQXNzZXRzRXJyb3IgZXh0ZW5kcyBFcnJvciB7XG4gICAgY29uc3RydWN0b3IobWVzc2FnZSkge1xuICAgICAgICBzdXBlcihtZXNzYWdlKTtcbiAgICAgICAgdGhpcy5tZXNzYWdlID0gbWVzc2FnZTtcbiAgICB9XG59XG5leHBvcnRzLkFzc2V0c0Vycm9yID0gQXNzZXRzRXJyb3I7XG5jbGFzcyBUaHVtYm5haWxFcnJvciBleHRlbmRzIEFzc2V0c0Vycm9yIHtcbn1cbmV4cG9ydHMuVGh1bWJuYWlsRXJyb3IgPSBUaHVtYm5haWxFcnJvcjtcbiIsIlxuaW1wb3J0IHtSZWFkYWJsZSwgV3JpdGFibGV9IGZyb20gJ3N0cmVhbSc7XG5cblxuZXhwb3J0IGludGVyZmFjZSBJRmlsZSB7XG4gICAgLyoqIEZpbGUgaWQgKi9cbiAgICBpZDogc3RyaW5nO1xuICAgIG5hbWU/OiBzdHJpbmc7XG4gICAgZmlsZW5hbWU6IHN0cmluZztcbiAgICBwYXRoOiBzdHJpbmc7XG4gICAgbWltZTogc3RyaW5nO1xuICAgIHNpemU6IG51bWJlcjtcbiAgICBtZXRhOiB7W2tleTogc3RyaW5nXTogYW55fTtcbiAgICBjdGltZTogRGF0ZTtcbiAgICBtdGltZTogRGF0ZTtcbiAgICBoaWRkZW46IGJvb2xlYW47XG59XG5leHBvcnQgaW50ZXJmYWNlIElMaXN0T3B0aW9ucyB7XG4gICAgb2Zmc2V0PzogbnVtYmVyO1xuICAgIGxpbWl0PzogbnVtYmVyO1xuICAgIGhpZGRlbj86IGJvb2xlYW47XG59XG5cbmV4cG9ydCBpbnRlcmZhY2UgSUNyZWF0ZU9wdGlvbnMge1xuICAgIG92ZXJ3cml0ZT86IGJvb2xlYW47XG59XG5cbmV4cG9ydCBpbnRlcmZhY2UgSUZpbmRPcHRpb25zIGV4dGVuZHMgSUxpc3RPcHRpb25zIHtcbiAgICBwYXRoOiBzdHJpbmc7XG59XG5cbmV4cG9ydCBpbnRlcmZhY2UgSU1ldGFTdG9yZSB7XG4gICAgaW5pdGlhbGl6ZSgpOiBQcm9taXNlPHZvaWQ+XG4gICAgY3JlYXRlKGFzc2V0OiBJRmlsZSwgb3B0aW9ucz86IElDcmVhdGVPcHRpb25zKTogUHJvbWlzZTxJRmlsZT47XG4gICAgcmVtb3ZlKGFzc2V0OiBJRmlsZSwgb3B0aW9ucz86IGFueSk6IFByb21pc2U8SUZpbGU+O1xuICAgIGxpc3Qob3B0aW9ucz86IElMaXN0T3B0aW9ucyk6IFByb21pc2U8SUZpbGVbXT47XG4gICAgZmluZChvcHRpb25zPzogSUZpbmRPcHRpb25zKTogUHJvbWlzZTxJRmlsZVtdPjtcbiAgICBnZXQoaWQ6IHN0cmluZywgb3B0aW9ucz86YW55KTogUHJvbWlzZTxJRmlsZT47XG4gICAgZ2V0QnlQYXRoKHBhdGg6IHN0cmluZywgb3B0aW9ucz86YW55KTogUHJvbWlzZTxJRmlsZT47XG4gICAgcmVtb3ZlQWxsKCk6IFByb21pc2U8dm9pZD47XG4gICAgY291bnQgKG9wdGlvbnM/OklGaW5kT3B0aW9ucyk6IFByb21pc2U8bnVtYmVyPjtcbn1cblxuZXhwb3J0IGludGVyZmFjZSBJRmlsZVN0b3JlIHtcbiAgICBpbml0aWFsaXplKCk6IFByb21pc2U8dm9pZD5cbiAgICBjcmVhdGUoYXNzZXQ6IElGaWxlLCBzdHJlYW06IFJlYWRhYmxlLCBvcHRpb25zPzphbnkpOiBQcm9taXNlPElGaWxlPjtcbiAgICByZW1vdmUoYXNzZXQ6IElGaWxlKTogUHJvbWlzZTxJRmlsZT47XG4gICAgc3RyZWFtKGFzc2V0OiBJRmlsZSwgb3B0aW9ucz86YW55KTogUHJvbWlzZTxSZWFkYWJsZT47XG4gICAgLy9oYXMoYXNzZXQ6IElGaWxlKTogUHJvbWlzZTxib29sZWFuPjtcbn1cblxuZXhwb3J0IGNsYXNzIEFzc2V0c0Vycm9yIGV4dGVuZHMgRXJyb3Ige1xuICAgIGNvbnN0cnVjdG9yIChwdWJsaWMgbWVzc2FnZTpzdHJpbmcpIHtcbiAgICAgICAgc3VwZXIobWVzc2FnZSk7XG4gICAgfVxufVxuXG5leHBvcnQgY2xhc3MgVGh1bWJuYWlsRXJyb3IgZXh0ZW5kcyBBc3NldHNFcnJvciB7fSAiXSwic291cmNlUm9vdCI6Ii9zb3VyY2UvIn0=
