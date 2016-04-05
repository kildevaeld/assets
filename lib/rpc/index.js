/// <reference path="./messages/file.d.ts" />
"use strict";

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var __awaiter = undefined && undefined.__awaiter || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) {
            try {
                step(generator.next(value));
            } catch (e) {
                reject(e);
            }
        }
        function rejected(value) {
            try {
                step(generator.throw(value));
            } catch (e) {
                reject(e);
            }
        }
        function step(result) {
            result.done ? resolve(result.value) : new P(function (resolve) {
                resolve(result.value);
            }).then(fulfilled, rejected);
        }
        step((generator = generator.apply(thisArg, _arguments)).next());
    });
};
var Path = require('path');
var PROTO_PATH = Path.join(__dirname, 'messages', 'file.proto');
var grpc = require('grpc');
function bindAll(obj, attr) {
    for (var i = 0, ii = attr.length; i < ii; i++) {
        obj[attr[i]] = obj[attr[i]].bind(obj);
    }
}

var FileServiceImpl = function () {
    function FileServiceImpl(assets) {
        _classCallCheck(this, FileServiceImpl);

        this.assets = assets;
        bindAll(this, ['list', 'createRequest', 'create', 'get', 'remove', 'stream']);
    }

    _createClass(FileServiceImpl, [{
        key: 'list',
        value: function list(call) {
            this.assets.list(call.request).then(function (list) {
                for (var i = 0, ii = list.length; i < ii; i++) {
                    var a = list[i];
                    call.write({
                        filename: a.filename,
                        path: a.path,
                        mime: a.mime,
                        size: a.size,
                        id: a.id
                    });
                }
                call.end();
            });
        }
    }, {
        key: 'createRequest',
        value: function createRequest(call, cb) {}
    }, {
        key: 'create',
        value: function create(call, cb) {}
    }, {
        key: 'get',
        value: function get(call, cb) {}
    }, {
        key: 'remove',
        value: function remove(call, cb) {}
    }, {
        key: 'stream',
        value: function stream(call, cb) {}
    }]);

    return FileServiceImpl;
}();

var RpcServer = function () {
    function RpcServer(_assets) {
        _classCallCheck(this, RpcServer);

        this._assets = _assets;
        var server = new grpc.Server();
        this.server = server;
    }

    _createClass(RpcServer, [{
        key: 'initialize',
        value: function initialize() {
            return __awaiter(this, void 0, Promise, function* () {
                var proto = grpc.load(PROTO_PATH).messages;
                //
                this.server.addProtoService(proto.FileService.service, new FileServiceImpl(this._assets));
                console.log('init service');
            });
        }
    }, {
        key: 'listen',
        value: function listen() {
            var addr = "0.0.0.0",
                port = '5000';
            var cred = grpc.ServerCredentials.createInsecure();
            this.server.bind(addr + ':' + port, cred);
            this.server.start();
        }
    }, {
        key: 'stop',
        value: function stop() {
            this.server.stop();
        }
    }]);

    return RpcServer;
}();

exports.RpcServer = RpcServer;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbInJwYy9pbmRleC5qcyIsInJwYy9pbmRleC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiO0FBQ0E7Ozs7OztBQUNBLElBQUksWUFBWSxTQUFDLElBQVEsVUFBSyxTQUFMLElBQW1CLFVBQVUsT0FBVixFQUFtQixVQUFuQixFQUErQixDQUEvQixFQUFrQyxTQUFsQyxFQUE2QztBQUNyRixXQUFPLEtBQUssTUFBTSxJQUFJLE9BQUosQ0FBTixDQUFMLENBQXlCLFVBQVUsT0FBVixFQUFtQixNQUFuQixFQUEyQjtBQUN2RCxpQkFBUyxTQUFULENBQW1CLEtBQW5CLEVBQTBCO0FBQUUsZ0JBQUk7QUFBRSxxQkFBSyxVQUFVLElBQVYsQ0FBZSxLQUFmLENBQUwsRUFBRjthQUFKLENBQXFDLE9BQU8sQ0FBUCxFQUFVO0FBQUUsdUJBQU8sQ0FBUCxFQUFGO2FBQVY7U0FBakU7QUFDQSxpQkFBUyxRQUFULENBQWtCLEtBQWxCLEVBQXlCO0FBQUUsZ0JBQUk7QUFBRSxxQkFBSyxVQUFVLEtBQVYsQ0FBZ0IsS0FBaEIsQ0FBTCxFQUFGO2FBQUosQ0FBc0MsT0FBTyxDQUFQLEVBQVU7QUFBRSx1QkFBTyxDQUFQLEVBQUY7YUFBVjtTQUFqRTtBQUNBLGlCQUFTLElBQVQsQ0FBYyxNQUFkLEVBQXNCO0FBQUUsbUJBQU8sSUFBUCxHQUFjLFFBQVEsT0FBTyxLQUFQLENBQXRCLEdBQXNDLElBQUksQ0FBSixDQUFNLFVBQVUsT0FBVixFQUFtQjtBQUFFLHdCQUFRLE9BQU8sS0FBUCxDQUFSLENBQUY7YUFBbkIsQ0FBTixDQUFxRCxJQUFyRCxDQUEwRCxTQUExRCxFQUFxRSxRQUFyRSxDQUF0QyxDQUFGO1NBQXRCO0FBQ0EsYUFBSyxDQUFDLFlBQVksVUFBVSxLQUFWLENBQWdCLE9BQWhCLEVBQXlCLFVBQXpCLENBQVosQ0FBRCxDQUFtRCxJQUFuRCxFQUFMLEVBSnVEO0tBQTNCLENBQWhDLENBRHFGO0NBQTdDO0FDQTVDLElBQVksT0FBSSxRQUFNLE1BQU4sQ0FBSjtBQUdaLElBQU0sYUFBYSxLQUFLLElBQUwsQ0FBVSxTQUFWLEVBQXFCLFVBQXJCLEVBQWlDLFlBQWpDLENBQWI7QUFFTixJQUFNLE9BQU8sUUFBUSxNQUFSLENBQVA7QUFFTixTQUFBLE9BQUEsQ0FBa0IsR0FBbEIsRUFBMkIsSUFBM0IsRUFBeUM7QUFDckMsU0FBSyxJQUFJLElBQUksQ0FBSixFQUFPLEtBQUssS0FBSyxNQUFMLEVBQWEsSUFBRSxFQUFGLEVBQUssR0FBdkMsRUFBNEM7QUFDeEMsWUFBSSxLQUFLLENBQUwsQ0FBSixJQUFlLElBQUksS0FBSyxDQUFMLENBQUosRUFBYSxJQUFiLENBQWtCLEdBQWxCLENBQWYsQ0FEd0M7S0FBNUM7Q0FESjs7SUFNQTtBQUNJLGFBREosZUFDSSxDQUFxQixNQUFyQixFQUFrQzs4QkFEdEMsaUJBQ3NDOztBQUFiLGFBQUEsTUFBQSxHQUFBLE1BQUEsQ0FBYTtBQUM5QixnQkFBUSxJQUFSLEVBQWMsQ0FBQyxNQUFELEVBQVMsZUFBVCxFQUEwQixRQUExQixFQUFvQyxLQUFwQyxFQUEyQyxRQUEzQyxFQUFxRCxRQUFyRCxDQUFkLEVBRDhCO0tBQWxDOztpQkFESjs7NkJBS1MsTUFBSTtBQUVMLGlCQUFLLE1BQUwsQ0FBWSxJQUFaLENBQWlCLEtBQUssT0FBTCxDQUFqQixDQUNDLElBREQsQ0FDTyxnQkFBSTtBQUVQLHFCQUFLLElBQUksSUFBSSxDQUFKLEVBQU8sS0FBSyxLQUFLLE1BQUwsRUFBYSxJQUFJLEVBQUosRUFBUSxHQUExQyxFQUErQztBQUMzQyx3QkFBSSxJQUFJLEtBQUssQ0FBTCxDQUFKLENBRHVDO0FBRTNDLHlCQUFLLEtBQUwsQ0FBVztBQUNQLGtDQUFVLEVBQUUsUUFBRjtBQUNWLDhCQUFNLEVBQUUsSUFBRjtBQUNOLDhCQUFNLEVBQUUsSUFBRjtBQUNOLDhCQUFNLEVBQUUsSUFBRjtBQUNOLDRCQUFJLEVBQUUsRUFBRjtxQkFMUixFQUYyQztpQkFBL0M7QUFXQSxxQkFBSyxHQUFMLEdBYk87YUFBSixDQURQLENBRks7Ozs7c0NBcUJLLE1BQU0sSUFBRTs7OytCQUlmLE1BQU0sSUFBRTs7OzRCQUlYLE1BQU0sSUFBRTs7OytCQUlKLE1BQU0sSUFBRTs7OytCQUlSLE1BQU0sSUFBRTs7O1dBMUNwQjs7O0lBZ0RBO0FBRUksYUFGSixTQUVJLENBQXFCLE9BQXJCLEVBQW1DOzhCQUZ2QyxXQUV1Qzs7QUFBZCxhQUFBLE9BQUEsR0FBQSxPQUFBLENBQWM7QUFFL0IsWUFBSSxTQUFTLElBQUksS0FBSyxNQUFMLEVBQWIsQ0FGMkI7QUFHL0IsYUFBSyxNQUFMLEdBQWMsTUFBZCxDQUgrQjtLQUFuQzs7aUJBRko7O3FDQVNvQjtBRGZaLG1CQUFPLFVBQVUsSUFBVixFQUFnQixLQUFLLENBQUwsRUFBUSxPQUF4QixFQUFpQyxhQUFhO0FDZ0JyRCxvQkFBSSxRQUFRLEtBQUssSUFBTCxDQUFVLFVBQVYsRUFBc0IsUUFBdEI7O0FEaEJ5QyxvQkNrQnJELENBQUssTUFBTCxDQUFZLGVBQVosQ0FBNEIsTUFBTSxXQUFOLENBQWtCLE9BQWxCLEVBQTJCLElBQUksZUFBSixDQUFvQixLQUFLLE9BQUwsQ0FBM0UsRURsQnFEO0FDbUJyRCx3QkFBUSxHQUFSLENBQVksY0FBWixFRG5CcUQ7YUFBYixDQUF4QyxDQ2VZOzs7O2lDQU9WO0FBQ0YsZ0JBQUksT0FBTyxTQUFQO2dCQUFrQixPQUFPLE1BQVAsQ0FEcEI7QUFFRixnQkFBSSxPQUFPLEtBQUssaUJBQUwsQ0FBdUIsY0FBdkIsRUFBUCxDQUZGO0FBR0YsaUJBQUssTUFBTCxDQUFZLElBQVosQ0FBb0IsYUFBUSxJQUE1QixFQUFvQyxJQUFwQyxFQUhFO0FBSUYsaUJBQUssTUFBTCxDQUFZLEtBQVosR0FKRTs7OzsrQkFPRjtBQUNBLGlCQUFLLE1BQUwsQ0FBWSxJQUFaLEdBREE7Ozs7V0F2QlI7OztBQUFhLFFBQUEsU0FBQSxHQUFTLFNBQVQiLCJmaWxlIjoicnBjL2luZGV4LmpzIiwic291cmNlc0NvbnRlbnQiOlsiLy8vIDxyZWZlcmVuY2UgcGF0aD1cIi4vbWVzc2FnZXMvZmlsZS5kLnRzXCIgLz5cblwidXNlIHN0cmljdFwiO1xudmFyIF9fYXdhaXRlciA9ICh0aGlzICYmIHRoaXMuX19hd2FpdGVyKSB8fCBmdW5jdGlvbiAodGhpc0FyZywgX2FyZ3VtZW50cywgUCwgZ2VuZXJhdG9yKSB7XG4gICAgcmV0dXJuIG5ldyAoUCB8fCAoUCA9IFByb21pc2UpKShmdW5jdGlvbiAocmVzb2x2ZSwgcmVqZWN0KSB7XG4gICAgICAgIGZ1bmN0aW9uIGZ1bGZpbGxlZCh2YWx1ZSkgeyB0cnkgeyBzdGVwKGdlbmVyYXRvci5uZXh0KHZhbHVlKSk7IH0gY2F0Y2ggKGUpIHsgcmVqZWN0KGUpOyB9IH1cbiAgICAgICAgZnVuY3Rpb24gcmVqZWN0ZWQodmFsdWUpIHsgdHJ5IHsgc3RlcChnZW5lcmF0b3IudGhyb3codmFsdWUpKTsgfSBjYXRjaCAoZSkgeyByZWplY3QoZSk7IH0gfVxuICAgICAgICBmdW5jdGlvbiBzdGVwKHJlc3VsdCkgeyByZXN1bHQuZG9uZSA/IHJlc29sdmUocmVzdWx0LnZhbHVlKSA6IG5ldyBQKGZ1bmN0aW9uIChyZXNvbHZlKSB7IHJlc29sdmUocmVzdWx0LnZhbHVlKTsgfSkudGhlbihmdWxmaWxsZWQsIHJlamVjdGVkKTsgfVxuICAgICAgICBzdGVwKChnZW5lcmF0b3IgPSBnZW5lcmF0b3IuYXBwbHkodGhpc0FyZywgX2FyZ3VtZW50cykpLm5leHQoKSk7XG4gICAgfSk7XG59O1xuY29uc3QgUGF0aCA9IHJlcXVpcmUoJ3BhdGgnKTtcbmNvbnN0IFBST1RPX1BBVEggPSBQYXRoLmpvaW4oX19kaXJuYW1lLCAnbWVzc2FnZXMnLCAnZmlsZS5wcm90bycpO1xuY29uc3QgZ3JwYyA9IHJlcXVpcmUoJ2dycGMnKTtcbmZ1bmN0aW9uIGJpbmRBbGwob2JqLCBhdHRyKSB7XG4gICAgZm9yIChsZXQgaSA9IDAsIGlpID0gYXR0ci5sZW5ndGg7IGkgPCBpaTsgaSsrKSB7XG4gICAgICAgIG9ialthdHRyW2ldXSA9IG9ialthdHRyW2ldXS5iaW5kKG9iaik7XG4gICAgfVxufVxuY2xhc3MgRmlsZVNlcnZpY2VJbXBsIHtcbiAgICBjb25zdHJ1Y3Rvcihhc3NldHMpIHtcbiAgICAgICAgdGhpcy5hc3NldHMgPSBhc3NldHM7XG4gICAgICAgIGJpbmRBbGwodGhpcywgWydsaXN0JywgJ2NyZWF0ZVJlcXVlc3QnLCAnY3JlYXRlJywgJ2dldCcsICdyZW1vdmUnLCAnc3RyZWFtJ10pO1xuICAgIH1cbiAgICBsaXN0KGNhbGwpIHtcbiAgICAgICAgdGhpcy5hc3NldHMubGlzdChjYWxsLnJlcXVlc3QpXG4gICAgICAgICAgICAudGhlbihsaXN0ID0+IHtcbiAgICAgICAgICAgIGZvciAobGV0IGkgPSAwLCBpaSA9IGxpc3QubGVuZ3RoOyBpIDwgaWk7IGkrKykge1xuICAgICAgICAgICAgICAgIGxldCBhID0gbGlzdFtpXTtcbiAgICAgICAgICAgICAgICBjYWxsLndyaXRlKHtcbiAgICAgICAgICAgICAgICAgICAgZmlsZW5hbWU6IGEuZmlsZW5hbWUsXG4gICAgICAgICAgICAgICAgICAgIHBhdGg6IGEucGF0aCxcbiAgICAgICAgICAgICAgICAgICAgbWltZTogYS5taW1lLFxuICAgICAgICAgICAgICAgICAgICBzaXplOiBhLnNpemUsXG4gICAgICAgICAgICAgICAgICAgIGlkOiBhLmlkXG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBjYWxsLmVuZCgpO1xuICAgICAgICB9KTtcbiAgICB9XG4gICAgY3JlYXRlUmVxdWVzdChjYWxsLCBjYikge1xuICAgIH1cbiAgICBjcmVhdGUoY2FsbCwgY2IpIHtcbiAgICB9XG4gICAgZ2V0KGNhbGwsIGNiKSB7XG4gICAgfVxuICAgIHJlbW92ZShjYWxsLCBjYikge1xuICAgIH1cbiAgICBzdHJlYW0oY2FsbCwgY2IpIHtcbiAgICB9XG59XG5jbGFzcyBScGNTZXJ2ZXIge1xuICAgIGNvbnN0cnVjdG9yKF9hc3NldHMpIHtcbiAgICAgICAgdGhpcy5fYXNzZXRzID0gX2Fzc2V0cztcbiAgICAgICAgdmFyIHNlcnZlciA9IG5ldyBncnBjLlNlcnZlcigpO1xuICAgICAgICB0aGlzLnNlcnZlciA9IHNlcnZlcjtcbiAgICB9XG4gICAgaW5pdGlhbGl6ZSgpIHtcbiAgICAgICAgcmV0dXJuIF9fYXdhaXRlcih0aGlzLCB2b2lkIDAsIFByb21pc2UsIGZ1bmN0aW9uKiAoKSB7XG4gICAgICAgICAgICBsZXQgcHJvdG8gPSBncnBjLmxvYWQoUFJPVE9fUEFUSCkubWVzc2FnZXM7XG4gICAgICAgICAgICAvLyBcbiAgICAgICAgICAgIHRoaXMuc2VydmVyLmFkZFByb3RvU2VydmljZShwcm90by5GaWxlU2VydmljZS5zZXJ2aWNlLCBuZXcgRmlsZVNlcnZpY2VJbXBsKHRoaXMuX2Fzc2V0cykpO1xuICAgICAgICAgICAgY29uc29sZS5sb2coJ2luaXQgc2VydmljZScpO1xuICAgICAgICB9KTtcbiAgICB9XG4gICAgbGlzdGVuKCkge1xuICAgICAgICBsZXQgYWRkciA9IFwiMC4wLjAuMFwiLCBwb3J0ID0gJzUwMDAnO1xuICAgICAgICBsZXQgY3JlZCA9IGdycGMuU2VydmVyQ3JlZGVudGlhbHMuY3JlYXRlSW5zZWN1cmUoKTtcbiAgICAgICAgdGhpcy5zZXJ2ZXIuYmluZChgJHthZGRyfToke3BvcnR9YCwgY3JlZCk7XG4gICAgICAgIHRoaXMuc2VydmVyLnN0YXJ0KCk7XG4gICAgfVxuICAgIHN0b3AoKSB7XG4gICAgICAgIHRoaXMuc2VydmVyLnN0b3AoKTtcbiAgICB9XG59XG5leHBvcnRzLlJwY1NlcnZlciA9IFJwY1NlcnZlcjtcbiIsIi8vLyA8cmVmZXJlbmNlIHBhdGg9XCIuL21lc3NhZ2VzL2ZpbGUuZC50c1wiIC8+XG5cbmltcG9ydCAqIGFzIFBhdGggZnJvbSAncGF0aCc7XG5pbXBvcnQge0Fzc2V0c30gZnJvbSAnLi4vaW5kZXgnO1xuXG5jb25zdCBQUk9UT19QQVRIID0gUGF0aC5qb2luKF9fZGlybmFtZSwgJ21lc3NhZ2VzJywgJ2ZpbGUucHJvdG8nKTtcblxuY29uc3QgZ3JwYyA9IHJlcXVpcmUoJ2dycGMnKTtcblxuZnVuY3Rpb24gYmluZEFsbCAob2JqOmFueSwgYXR0cjogc3RyaW5nW10pIHtcbiAgICBmb3IgKGxldCBpID0gMCwgaWkgPSBhdHRyLmxlbmd0aDsgaTxpaTtpKyspIHtcbiAgICAgICAgb2JqW2F0dHJbaV1dID0gb2JqW2F0dHJbaV1dLmJpbmQob2JqKTtcbiAgICB9XG59IFxuXG5jbGFzcyBGaWxlU2VydmljZUltcGwge1xuICAgIGNvbnN0cnVjdG9yIChwcml2YXRlIGFzc2V0czpBc3NldHMpIHtcbiAgICAgICAgYmluZEFsbCh0aGlzLCBbJ2xpc3QnLCAnY3JlYXRlUmVxdWVzdCcsICdjcmVhdGUnLCAnZ2V0JywgJ3JlbW92ZScsICdzdHJlYW0nXSk7XG4gICAgfVxuIFxuICAgIGxpc3QoY2FsbCkge1xuICAgICAgICBcbiAgICAgICAgdGhpcy5hc3NldHMubGlzdChjYWxsLnJlcXVlc3QpXG4gICAgICAgIC50aGVuKCBsaXN0ID0+IHtcbiAgICAgICAgICAgIFxuICAgICAgICAgICAgZm9yIChsZXQgaSA9IDAsIGlpID0gbGlzdC5sZW5ndGg7IGkgPCBpaTsgaSsrKSB7XG4gICAgICAgICAgICAgICAgbGV0IGEgPSBsaXN0W2ldO1xuICAgICAgICAgICAgICAgIGNhbGwud3JpdGUoe1xuICAgICAgICAgICAgICAgICAgICBmaWxlbmFtZTogYS5maWxlbmFtZSxcbiAgICAgICAgICAgICAgICAgICAgcGF0aDogYS5wYXRoLFxuICAgICAgICAgICAgICAgICAgICBtaW1lOiBhLm1pbWUsXG4gICAgICAgICAgICAgICAgICAgIHNpemU6IGEuc2l6ZSxcbiAgICAgICAgICAgICAgICAgICAgaWQ6IGEuaWRcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIFxuICAgICAgICAgICAgY2FsbC5lbmQoKTsgICAgXG4gICAgICAgIH0pO1xuICAgICAgICBcbiAgICB9XG4gICAgXG4gICAgY3JlYXRlUmVxdWVzdChjYWxsLCBjYikge1xuICAgICAgICBcbiAgICB9XG4gICAgXG4gICAgY3JlYXRlKGNhbGwsIGNiKSB7XG4gICAgICAgIFxuICAgIH1cbiAgICBcbiAgICBnZXQoY2FsbCwgY2IpIHtcbiAgICAgICAgXG4gICAgfVxuICAgIFxuICAgIHJlbW92ZSAoY2FsbCwgY2IpIHtcbiAgICAgICAgXG4gICAgfVxuICAgIFxuICAgIHN0cmVhbSAoY2FsbCwgY2IpIHtcbiAgICAgICAgXG4gICAgfVxuICAgIFxufVxuXG5leHBvcnQgY2xhc3MgUnBjU2VydmVyIHtcbiAgICBzZXJ2ZXI6IGFueTtcbiAgICBjb25zdHJ1Y3RvciAocHJpdmF0ZSBfYXNzZXRzOkFzc2V0cykge1xuICAgICAgICBcbiAgICAgICAgdmFyIHNlcnZlciA9IG5ldyBncnBjLlNlcnZlcigpO1xuICAgICAgICB0aGlzLnNlcnZlciA9IHNlcnZlcjtcbiAgICAgICAgXG4gICAgfVxuICAgIFxuICAgIGFzeW5jIGluaXRpYWxpemUgKCk6IFByb21pc2U8dm9pZD4ge1xuICAgICAgICBsZXQgcHJvdG8gPSBncnBjLmxvYWQoUFJPVE9fUEFUSCkubWVzc2FnZXM7XG4gICAgICAgIC8vIFxuICAgICAgICB0aGlzLnNlcnZlci5hZGRQcm90b1NlcnZpY2UocHJvdG8uRmlsZVNlcnZpY2Uuc2VydmljZSwgbmV3IEZpbGVTZXJ2aWNlSW1wbCh0aGlzLl9hc3NldHMpKTtcbiAgICAgICAgY29uc29sZS5sb2coJ2luaXQgc2VydmljZScpXG4gICAgfVxuICAgIFxuICAgIGxpc3RlbiAoKSB7XG4gICAgICAgIGxldCBhZGRyID0gXCIwLjAuMC4wXCIsIHBvcnQgPSAnNTAwMCc7XG4gICAgICAgIGxldCBjcmVkID0gZ3JwYy5TZXJ2ZXJDcmVkZW50aWFscy5jcmVhdGVJbnNlY3VyZSgpO1xuICAgICAgICB0aGlzLnNlcnZlci5iaW5kKGAke2FkZHJ9OiR7cG9ydH1gLCBjcmVkKTtcbiAgICAgICAgdGhpcy5zZXJ2ZXIuc3RhcnQoKTsgICAgXG4gICAgfVxuICAgIFxuICAgIHN0b3AgKCkge1xuICAgICAgICB0aGlzLnNlcnZlci5zdG9wKCk7XG4gICAgfVxufSJdLCJzb3VyY2VSb290IjoiL3NvdXJjZS8ifQ==
