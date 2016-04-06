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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImludGVyZmFjZS5qcyIsImludGVyZmFjZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7Ozs7Ozs7SUNtREE7OztBQUNJLGFBREosV0FDSSxDQUFvQixPQUFwQixFQUFrQzs4QkFEdEMsYUFDc0M7OzJFQUR0Qyx3QkFFYyxVQUR3Qjs7QUFBZCxjQUFBLE9BQUEsR0FBQSxPQUFBLENBQWM7O0tBQWxDOztXQURKO0VBQWlDOztBQUFwQixRQUFBLFdBQUEsR0FBVyxXQUFYOztJQU1iOzs7Ozs7Ozs7O0VBQW9DOztBQUF2QixRQUFBLGNBQUEsR0FBYyxjQUFkIiwiZmlsZSI6ImludGVyZmFjZS5qcyIsInNvdXJjZXNDb250ZW50IjpbIlwidXNlIHN0cmljdFwiO1xuY2xhc3MgQXNzZXRzRXJyb3IgZXh0ZW5kcyBFcnJvciB7XG4gICAgY29uc3RydWN0b3IobWVzc2FnZSkge1xuICAgICAgICBzdXBlcihtZXNzYWdlKTtcbiAgICAgICAgdGhpcy5tZXNzYWdlID0gbWVzc2FnZTtcbiAgICB9XG59XG5leHBvcnRzLkFzc2V0c0Vycm9yID0gQXNzZXRzRXJyb3I7XG5jbGFzcyBUaHVtYm5haWxFcnJvciBleHRlbmRzIEFzc2V0c0Vycm9yIHtcbn1cbmV4cG9ydHMuVGh1bWJuYWlsRXJyb3IgPSBUaHVtYm5haWxFcnJvcjtcbiIsIlxuaW1wb3J0IHtSZWFkYWJsZSwgV3JpdGFibGV9IGZyb20gJ3N0cmVhbSc7XG5cblxuZXhwb3J0IGludGVyZmFjZSBJRmlsZSB7XG4gICAgLyoqIEZpbGUgaWQgKi9cbiAgICBpZDogc3RyaW5nO1xuICAgIG5hbWU/OiBzdHJpbmc7XG4gICAgZmlsZW5hbWU6IHN0cmluZztcbiAgICBwYXRoOiBzdHJpbmc7XG4gICAgbWltZTogc3RyaW5nO1xuICAgIHNpemU6IG51bWJlcjtcbiAgICBtZXRhOiB7W2tleTogc3RyaW5nXTogYW55fTtcbiAgICBjdGltZTogbnVtYmVyO1xuICAgIG10aW1lOiBudW1iZXI7XG4gICAgaGlkZGVuOiBib29sZWFuO1xufVxuZXhwb3J0IGludGVyZmFjZSBJTGlzdE9wdGlvbnMge1xuICAgIG9mZnNldD86IG51bWJlcjtcbiAgICBsaW1pdD86IG51bWJlcjtcbiAgICBoaWRkZW4/OiBib29sZWFuO1xufVxuXG5leHBvcnQgaW50ZXJmYWNlIElDcmVhdGVPcHRpb25zIHtcbiAgICBvdmVyd3JpdGU/OiBib29sZWFuO1xufVxuXG5leHBvcnQgaW50ZXJmYWNlIElGaW5kT3B0aW9ucyBleHRlbmRzIElMaXN0T3B0aW9ucyB7XG4gICAgcGF0aDogc3RyaW5nO1xufVxuXG5leHBvcnQgaW50ZXJmYWNlIElNZXRhU3RvcmUge1xuICAgIGluaXRpYWxpemUoKTogUHJvbWlzZTx2b2lkPlxuICAgIGNyZWF0ZShhc3NldDogSUZpbGUsIG9wdGlvbnM/OiBJQ3JlYXRlT3B0aW9ucyk6IFByb21pc2U8SUZpbGU+O1xuICAgIHJlbW92ZShhc3NldDogSUZpbGUsIG9wdGlvbnM/OiBhbnkpOiBQcm9taXNlPElGaWxlPjtcbiAgICBsaXN0KG9wdGlvbnM/OiBJTGlzdE9wdGlvbnMpOiBQcm9taXNlPElGaWxlW10+O1xuICAgIGZpbmQob3B0aW9ucz86IElGaW5kT3B0aW9ucyk6IFByb21pc2U8SUZpbGVbXT47XG4gICAgZ2V0KGlkOiBzdHJpbmcsIG9wdGlvbnM/OmFueSk6IFByb21pc2U8SUZpbGU+O1xuICAgIGdldEJ5UGF0aChwYXRoOiBzdHJpbmcsIG9wdGlvbnM/OmFueSk6IFByb21pc2U8SUZpbGU+O1xuICAgIHJlbW92ZUFsbCgpOiBQcm9taXNlPHZvaWQ+O1xuICAgIGNvdW50IChvcHRpb25zPzpJRmluZE9wdGlvbnMpOiBQcm9taXNlPG51bWJlcj47XG59XG5cbmV4cG9ydCBpbnRlcmZhY2UgSUZpbGVTdG9yZSB7XG4gICAgaW5pdGlhbGl6ZSgpOiBQcm9taXNlPHZvaWQ+XG4gICAgY3JlYXRlKGFzc2V0OiBJRmlsZSwgc3RyZWFtOiBSZWFkYWJsZSwgb3B0aW9ucz86YW55KTogUHJvbWlzZTxJRmlsZT47XG4gICAgcmVtb3ZlKGFzc2V0OiBJRmlsZSk6IFByb21pc2U8SUZpbGU+O1xuICAgIHN0cmVhbShhc3NldDogSUZpbGUsIG9wdGlvbnM/OmFueSk6IFByb21pc2U8UmVhZGFibGU+O1xuICAgIC8vaGFzKGFzc2V0OiBJRmlsZSk6IFByb21pc2U8Ym9vbGVhbj47XG59XG5cbmV4cG9ydCBjbGFzcyBBc3NldHNFcnJvciBleHRlbmRzIEVycm9yIHtcbiAgICBjb25zdHJ1Y3RvciAocHVibGljIG1lc3NhZ2U6c3RyaW5nKSB7XG4gICAgICAgIHN1cGVyKG1lc3NhZ2UpO1xuICAgIH1cbn1cblxuZXhwb3J0IGNsYXNzIFRodW1ibmFpbEVycm9yIGV4dGVuZHMgQXNzZXRzRXJyb3Ige30gIl0sInNvdXJjZVJvb3QiOiIvc291cmNlLyJ9
