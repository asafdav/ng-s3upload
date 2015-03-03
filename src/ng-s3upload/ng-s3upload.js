// Create all modules and define dependencies to make sure they exist
// and are loaded in the correct order to satisfy dependency injection
// before all nested files are concatenated by Grunt

// Modules
angular.module('ngS3upload.config', []);
angular.module('ngS3upload.directives', []);
angular.module('ngS3upload.services', []);
angular.module('ngS3upload',
    [
        'ngS3upload.config',
        'ngS3upload.directives',
        'ngS3upload.services',
        'ngSanitize'
    ]);
