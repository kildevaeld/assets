"use strict";

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
var generators = require('./generators');
var thumbnailer_1 = require('../thumbnailer');
function initialize() {
    return __awaiter(this, void 0, Promise, function* () {
        thumbnailer_1.Thumbnailer.setGenerator(['image/png', 'image/jpeg', 'image/gif'], generators.ImageTypeGeneraror);
    });
}
exports.initialize = initialize;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImdlbmVyYXRvcnMvaW5kZXguanMiLCJnZW5lcmF0b3JzL2luZGV4LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOztBQUNBLElBQUksWUFBWSxTQUFDLElBQVEsVUFBSyxTQUFMLElBQW1CLFVBQVUsT0FBVixFQUFtQixVQUFuQixFQUErQixDQUEvQixFQUFrQyxTQUFsQyxFQUE2QztBQUNyRixXQUFPLEtBQUssTUFBTSxJQUFJLE9BQUosQ0FBTixDQUFMLENBQXlCLFVBQVUsT0FBVixFQUFtQixNQUFuQixFQUEyQjtBQUN2RCxpQkFBUyxTQUFULENBQW1CLEtBQW5CLEVBQTBCO0FBQUUsZ0JBQUk7QUFBRSxxQkFBSyxVQUFVLElBQVYsQ0FBZSxLQUFmLENBQUwsRUFBRjthQUFKLENBQXFDLE9BQU8sQ0FBUCxFQUFVO0FBQUUsdUJBQU8sQ0FBUCxFQUFGO2FBQVY7U0FBakU7QUFDQSxpQkFBUyxRQUFULENBQWtCLEtBQWxCLEVBQXlCO0FBQUUsZ0JBQUk7QUFBRSxxQkFBSyxVQUFVLEtBQVYsQ0FBZ0IsS0FBaEIsQ0FBTCxFQUFGO2FBQUosQ0FBc0MsT0FBTyxDQUFQLEVBQVU7QUFBRSx1QkFBTyxDQUFQLEVBQUY7YUFBVjtTQUFqRTtBQUNBLGlCQUFTLElBQVQsQ0FBYyxNQUFkLEVBQXNCO0FBQUUsbUJBQU8sSUFBUCxHQUFjLFFBQVEsT0FBTyxLQUFQLENBQXRCLEdBQXNDLElBQUksQ0FBSixDQUFNLFVBQVUsT0FBVixFQUFtQjtBQUFFLHdCQUFRLE9BQU8sS0FBUCxDQUFSLENBQUY7YUFBbkIsQ0FBTixDQUFxRCxJQUFyRCxDQUEwRCxTQUExRCxFQUFxRSxRQUFyRSxDQUF0QyxDQUFGO1NBQXRCO0FBQ0EsYUFBSyxDQUFDLFlBQVksVUFBVSxLQUFWLENBQWdCLE9BQWhCLEVBQXlCLFVBQXpCLENBQVosQ0FBRCxDQUFtRCxJQUFuRCxFQUFMLEVBSnVEO0tBQTNCLENBQWhDLENBRHFGO0NBQTdDO0FDQTVDLElBQVksYUFBVSxRQUFNLGNBQU4sQ0FBVjtBQUNaLElBQUEsZ0JBQUEsUUFBMEIsZ0JBQTFCLENBQUE7QUFFQSxTQUFBLFVBQUEsR0FBQTtBRFFJLFdBQU8sVUFBVSxJQUFWLEVBQWdCLEtBQUssQ0FBTCxFQUFRLE9BQXhCLEVBQWlDLGFBQWE7QUNOckQsc0JBQUEsV0FBQSxDQUFZLFlBQVosQ0FBeUIsQ0FBQyxXQUFELEVBQWMsWUFBZCxFQUE0QixXQUE1QixDQUF6QixFQUFtRSxXQUFXLGtCQUFYLENBQW5FLENETXFEO0tBQWIsQ0FBeEMsQ0NSSjtDQUFBO0FBQXNCLFFBQUEsVUFBQSxHQUFVLFVBQVYiLCJmaWxlIjoiZ2VuZXJhdG9ycy9pbmRleC5qcyIsInNvdXJjZXNDb250ZW50IjpbIlwidXNlIHN0cmljdFwiO1xudmFyIF9fYXdhaXRlciA9ICh0aGlzICYmIHRoaXMuX19hd2FpdGVyKSB8fCBmdW5jdGlvbiAodGhpc0FyZywgX2FyZ3VtZW50cywgUCwgZ2VuZXJhdG9yKSB7XG4gICAgcmV0dXJuIG5ldyAoUCB8fCAoUCA9IFByb21pc2UpKShmdW5jdGlvbiAocmVzb2x2ZSwgcmVqZWN0KSB7XG4gICAgICAgIGZ1bmN0aW9uIGZ1bGZpbGxlZCh2YWx1ZSkgeyB0cnkgeyBzdGVwKGdlbmVyYXRvci5uZXh0KHZhbHVlKSk7IH0gY2F0Y2ggKGUpIHsgcmVqZWN0KGUpOyB9IH1cbiAgICAgICAgZnVuY3Rpb24gcmVqZWN0ZWQodmFsdWUpIHsgdHJ5IHsgc3RlcChnZW5lcmF0b3IudGhyb3codmFsdWUpKTsgfSBjYXRjaCAoZSkgeyByZWplY3QoZSk7IH0gfVxuICAgICAgICBmdW5jdGlvbiBzdGVwKHJlc3VsdCkgeyByZXN1bHQuZG9uZSA/IHJlc29sdmUocmVzdWx0LnZhbHVlKSA6IG5ldyBQKGZ1bmN0aW9uIChyZXNvbHZlKSB7IHJlc29sdmUocmVzdWx0LnZhbHVlKTsgfSkudGhlbihmdWxmaWxsZWQsIHJlamVjdGVkKTsgfVxuICAgICAgICBzdGVwKChnZW5lcmF0b3IgPSBnZW5lcmF0b3IuYXBwbHkodGhpc0FyZywgX2FyZ3VtZW50cykpLm5leHQoKSk7XG4gICAgfSk7XG59O1xuY29uc3QgZ2VuZXJhdG9ycyA9IHJlcXVpcmUoJy4vZ2VuZXJhdG9ycycpO1xuY29uc3QgdGh1bWJuYWlsZXJfMSA9IHJlcXVpcmUoJy4uL3RodW1ibmFpbGVyJyk7XG5mdW5jdGlvbiBpbml0aWFsaXplKCkge1xuICAgIHJldHVybiBfX2F3YWl0ZXIodGhpcywgdm9pZCAwLCBQcm9taXNlLCBmdW5jdGlvbiogKCkge1xuICAgICAgICB0aHVtYm5haWxlcl8xLlRodW1ibmFpbGVyLnNldEdlbmVyYXRvcihbJ2ltYWdlL3BuZycsICdpbWFnZS9qcGVnJywgJ2ltYWdlL2dpZiddLCBnZW5lcmF0b3JzLkltYWdlVHlwZUdlbmVyYXJvcik7XG4gICAgfSk7XG59XG5leHBvcnRzLmluaXRpYWxpemUgPSBpbml0aWFsaXplO1xuIiwiXG5pbXBvcnQgKiBhcyBnZW5lcmF0b3JzIGZyb20gJy4vZ2VuZXJhdG9ycyc7XG5pbXBvcnQge1RodW1ibmFpbGVyfSBmcm9tICcuLi90aHVtYm5haWxlcic7XG5cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBpbml0aWFsaXplICgpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICBcbiAgICBUaHVtYm5haWxlci5zZXRHZW5lcmF0b3IoWydpbWFnZS9wbmcnLCAnaW1hZ2UvanBlZycsICdpbWFnZS9naWYnXSwgZ2VuZXJhdG9ycy5JbWFnZVR5cGVHZW5lcmFyb3IpO1xuICAgICAgICBcbn0iXSwic291cmNlUm9vdCI6Ii9zb3VyY2UvIn0=
