angular.module('ngS3upload.services', []).
  service('S3Uploader', ['$http', '$q', '$window', function ($http, $q, $window) {
    this.uploads = 0;
    var self = this;

    this.getUploadOptions = function (uri) {
      var deferred = $q.defer();
      $http.get(uri).
        success(function (response, status) {
          deferred.resolve(response);
        }).error(function (error, status) {
          deferred.reject(error);
        });

      return deferred.promise;
    };

    this.randomString = function (length) {
      var chars = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
      var result = '';
      for (var i = length; i > 0; --i) result += chars[Math.round(Math.random() * (chars.length - 1))];

      return result;
    };


    this.upload = function (scope, uri, key, acl, type, accessKey, policy, signature, file, extraHeaders) {
      var deferred = $q.defer();
      scope.attempt = true;

      var fd = new FormData();

      for (var headerKey in extraHeaders)
      {
          var headerVal = extraHeaders[headerKey];
          fd.append(headerVal.name, headerVal.value);
      }

      fd.append('key', key);
      fd.append('acl', acl);
      fd.append('Content-Type', file.type);
      fd.append('AWSAccessKeyId', accessKey);
      fd.append('policy', policy);
      fd.append('signature', signature);
      fd.append("file", file);

      var xhr = new XMLHttpRequest();
      xhr.upload.addEventListener("progress", uploadProgress, false);
      xhr.addEventListener("load", uploadComplete, false);
      xhr.addEventListener("error", uploadFailed, false);
      xhr.addEventListener("abort", uploadCanceled, false);

      // Define event handlers
      function uploadProgress(e) {
        scope.$apply(function () {
          if (e.lengthComputable) {
            scope.progress = Math.round(e.loaded * 100 / e.total);
          } else {
            scope.progress = 'unable to compute';
          }
          if (typeof deferred.notify === 'function') {
            deferred.notify({type: 'progress', value: scope.progress});
          }
        });
      }
      function uploadComplete(e) {
        scope.$apply(function () {
          self.uploads--;
          scope.uploading = false;
          scope.success = true;
          deferred.resolve();
        });
      }
      function uploadFailed(e) {
        scope.$apply(function () {
          self.uploads--;
          scope.uploading = false;
          scope.success = false;
          deferred.reject();
        });
      }
      function uploadCanceled(e) {
        scope.$apply(function () {
          self.uploads--;
          scope.uploading = false;
          scope.success = false;
          deferred.reject();
        });
      }

      // Send the file
      scope.uploading = true;
      this.uploads++;
      
      xhr.open('POST', uri, true);
      xhr.setRequestHeader("Accept", "application/json");
      xhr.send(fd);

      return deferred.promise;
    };

    this.isUploading = function () {
      return this.uploads > 0;
    };
  }]);
