angular.module('ngS3upload.directives').
  directive('s3Upload', ['$parse', 'S3Uploader', 'ngS3Config', 'ngS3UploadConfig', function ($parse, S3Uploader, ngS3Config, ngS3UploadConfig) {
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

        $scope.isUploadSuccessful = function(){
          return $scope.attempt && !$scope.uploading && $scope.success;
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
              getManualOptions: null,
              acl: 'public-read',
              uploadingKey: 'uploading',
              folder: '',
              enableValidation: true,
              targetFilename: null
            }, ngS3UploadConfig, opts);
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

              if(angular.isObject(opts.getManualOptions)) {
                _upload(opts.getManualOptions);
              } else {
                S3Uploader.getUploadOptions(opts.getOptionsUri).then(function (s3Options) {
                  _upload(s3Options);
                }, function (error) {
                  throw Error("Can't receive the needed options for S3 " + error);
                });
              }

              function _upload(s3Options){
                if (opts.enableValidation) {
                  ngModel.$setValidity('uploading', false);
                }

                var s3Uri = 'https://' + bucket + '.s3.amazonaws.com/';
                var randomStringLength = opts.randomLength || 16;
                var key = opts.targetFilename ? scope.$eval(opts.targetFilename) : opts.folder + (new Date()).getTime() + '-' + S3Uploader.randomString(randomStringLength) + "." + ext;
                if(opts.targetFilename) {
                  key = key.replace('%file.name%', filename);
                  key = key.replace('%file.ext%', ext);
                  key = key.replace('%uploader.folder%', opts.folder || '');
                  key = key.replace('%uploader.date%', (new Date()).getTime());
                  key = key.replace('%uploader.date_ms%', (new Date()).getTime());
                  key = key.replace('%uploader.date_sec%', Math.floor((new Date()).getTime()/1000);
                }
                S3Uploader.upload(scope,
                    s3Uri,
                    key,
                    opts.acl,
                    selectedFile.type,
                    s3Options.key,
                    s3Options.policy,
                    s3Options.signature,
                    selectedFile
                  ).then(function () {
                    ngModel.$setViewValue(s3Uri + key);
                    scope.filename = ngModel.$viewValue;

                    if (opts.enableValidation) {
                      ngModel.$setValidity('uploading', true);
                      ngModel.$setValidity('succeeded', true);
                    }
                  }, function () {
                    scope.filename = ngModel.$viewValue;

                    if (opts.enableValidation) {
                      ngModel.$setValidity('uploading', true);
                      ngModel.$setValidity('succeeded', false);
                    }
                  });
              }
            };

            element.bind('change', function (nVal) {
              if (opts.submitOnChange) {
                scope.$apply(function () {
                  uploadFile();
                });
              }
            });

            if (angular.isDefined(attrs.doUpload)) {
              scope.$watch(attrs.doUpload, function(value) {
                if (value) uploadFile();
              });
            }
          }
        };
      },
      templateUrl: function(elm, attrs) {
        var theme = attrs.theme || ngS3Config.theme;

        if(theme.indexOf('/') === -1){
          return 'theme/' + theme + '.html';
        } else {
          return theme;
        }
      }
    };
  }]);
