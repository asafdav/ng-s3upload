angular.module('ngS3upload.directives', []).
  directive('s3Upload', ['$parse', 'S3Uploader', function ($parse, S3Uploader) {
    return {
      restrict: 'AC',
      require: '?ngModel',
      replace: true,
      transclude: false,
      scope: true,
      controller: ['$scope', '$element', '$attrs', '$transclude', function ($scope, $element, $attrs, $transclude) {
        $scope.attempt = false;
        $scope.success = false;
        $scope.uploading = false;

        $scope.barClass = function () {
          return {
            "bar-success": $scope.attempt && !$scope.uploading && $scope.success
          };
        };
      }],
      compile: function (element, attr, linker) {
        return {
          pre: function ($scope, $element, $attr) {
            if (angular.isUndefined($attr.bucket)) {
              throw Error('bucket is a mandatory attribute');
            }
          },
          post: function (scope, element, attrs, ngModel) {
            // Build the opts array
            var opts = angular.extend({}, scope.$eval(attrs.s3UploadOptions || attrs.options));
            opts = angular.extend({
              submitOnChange: true,
              getOptionsUri: '/getS3Options',
              acl: 'public-read',
              uploadingKey: 'uploading',
              folder: ''
            }, opts);
            var bucket = scope.$eval(attrs.bucket);

            // Bind the button click event
            var button = angular.element(element.children()[0]),
              file = angular.element(element.find("input")[0]);
            button.bind('click', function (e) {
              file[0].click();
            });

            // Update the scope with the view value
            ngModel.$render = function () {
              scope.filename = ngModel.$viewValue;
            };


            var uploadFile = function () {
              var selectedFile = file[0].files[0];
              var filename = selectedFile.name;
              var ext = filename.split('.').pop();

              scope.$apply(function () {
                S3Uploader.getUploadOptions(opts.getOptionsUri).then(function (s3Options) {
                  ngModel.$setValidity('uploading', false);
                  var s3Uri = 'http://' + bucket + '.s3.amazonaws.com/';
                  var key = opts.folder + (new Date()).getTime() + '-' + S3Uploader.randomString(16) + "." + ext;
                  S3Uploader.upload(scope,
                      s3Uri,
                      key,
                      opts.acl,
                      selectedFile.type,
                      s3Options.AWSAccessKeyId,
                      s3Options.policy,
                      s3Options.signature,
                      selectedFile,
                      opts.extraHeaders
                    ).then(function () {
                      ngModel.$setViewValue(s3Uri + key);
                      scope.filename = ngModel.$viewValue;
                      opts.uploadDoneCallback(scope.filename, key);
                      ngModel.$setValidity('uploading', true);
                      ngModel.$setValidity('succeeded', true);
                    }, function () {
                      scope.filename = ngModel.$viewValue;
                      opts.uploadErrorCallback();
                      ngModel.$setValidity('uploading', true);
                      ngModel.$setValidity('succeeded', false);
                    });

                }, function (error) {
                  throw Error("Can't receive the needed options for S3 " + error);
                });
              });
            };

            element.bind('change', function (nVal) {
              if (opts.submitOnChange) {
                uploadFile();
              }
            });
          }
        };
      },
      template: '<div class="upload-wrap">' +
        '<button class="btn btn-primary" type="button" ng-show="!filename"><span ng-if="!filename">Choose file</span></button>' +
        '<div class="progress" ng-show="attempt">' +
        '<div class="progress-bar" role="progressbar" aria-valuenow="{{ progress }}" aria-valuemin="0" aria-valuemax="100" style="width: {{ progress }}%;">' +
        '<span class="sr-only">{{ progress }}%</span>' +
        '</div>' +
        '</div>' +
        '<input type="file" style="display: none"/>' +
        '</div>'
    };
  }]);
