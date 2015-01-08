ng-s3upload - Upload to S3 using AngularJS
===========

An AngularJS directive that allows you to simply upload files directly to AWS S3.

## Setup
1. Create AWS S3 bucket

2. Grant "put/delete" permissions to everyone
In AWS web interface, select S3 and select the destination bucket, then
expand the "Permissions" sections and click on the "Add more permissions" button. Select "Everyone" and "Upload/Delete" and save.

3. Add CORS configuration to your bucket

  In AWS web interface, select S3 and select the wanted bucket.
  Expand the "Permissions" section and click on the "Add CORS configuration" button. Paste the wanted CORS configuration, for example:
  ```XML
  <?xml version="1.0" encoding="UTF-8"?>
  <CORSConfiguration xmlns="http://s3.amazonaws.com/doc/2006-03-01/">
      <CORSRule>
          <AllowedOrigin>*</AllowedOrigin>
          <AllowedMethod>GET</AllowedMethod>
          <AllowedMethod>POST</AllowedMethod>
          <AllowedMethod>PUT</AllowedMethod>
          <AllowedHeader>*</AllowedHeader>
      </CORSRule>
  </CORSConfiguration>
    ```

  In addition, create the following crossdomain.xml file and upload it to the root of your bucket.

  ```XML
  <?xml version="1.0"?>
  <!DOCTYPE cross-domain-policy SYSTEM
  "http://www.macromedia.com/xml/dtds/cross-domain-policy.dtd">
  <cross-domain-policy>
    <allow-access-from domain="*" secure="false" />
  </cross-domain-policy>
  ```

  Once the CORS permissions are updated, your bucket is ready for client side uploads.

4. Create a server side service that will return the needed details for uploading files to S3.
your service shall return a json in the following format:

  ```json
  {
   "policy": "XXXX",
   "signature": "YYY",
   "key": "ZZZ"
  }
  ```
XXX - A policy json that is required by AWS, base64 encoded.
YYY - HMAC and sha of your private key
ZZZ - Your public key
Here's a rails example, even if you're not a rails developer, read the code, it's very straight forward.

  For a php example, please refer to [this guide](https://github.com/asafdav/ng-s3upload/wiki/PHP-Creating-the-S3-Policy).
  ```ruby
      def s3_access_token
        render json: {
          policy:    s3_upload_policy,
          signature: s3_upload_signature,
          key:       GLOBAL[:aws_key]
        }
      end

      protected

        def s3_upload_policy
          @policy ||= create_s3_upload_policy
        end

        def create_s3_upload_policy
          Base64.encode64(
            {
              "expiration" => 1.hour.from_now.utc.xmlschema,
              "conditions" => [
                { "bucket" =>  GLOBAL[:aws_bucket] },
                [ "starts-with", "$key", "" ],
                { "acl" => "public-read" },
                [ "starts-with", "$Content-Type", "" ],
                [ "content-length-range", 0, 10 * 1024 * 1024 ]
              ]
            }.to_json).gsub(/\n/,'')
        end

        def s3_upload_signature
          Base64.encode64(OpenSSL::HMAC.digest(OpenSSL::Digest::Digest.new('sha1'), GLOBAL[:aws_secret], s3_upload_policy)).gsub("\n","")
        end
  ```

  The following code generates an upload policy that will be used by S3, in this example the maximum file size is limited to 10MB (10 * 1024 * 1024), update it to match your requirments. for a full list of S3's policy options, please refer to [AWS documentation](http://docs.aws.amazon.com/AmazonS3/latest/dev/HTTPPOSTExamples.html#HTTPPOSTExamplesTextAreaPolicy).


## How to get it ?

#### Manual Download
Download the from [here](https://github.com/asafdav/ng-s3upload/releases)

#### Bower
```
bower install ng-s3upload
```

#### Npm
```
npm install ng-s3upload
```


## Usage
1. Add ng-s3upload.min.js to your main file (index.html)

2. If you have not already done so, include [ngSanitize]( http://ajax.googleapis.com/ajax/libs/angularjs/1.0.3/angular-sanitize.js) in your application.

3. Set `ngS3upload` as a dependency in your module
  ```javascript
  var myapp = angular.module('myapp', ['ngS3upload'])
  ```

4. Add s3-upload directive to the wanted element, example:
  ```html
  <div s3-upload bucket="s3Bucket" ng-model="product.remote_product_file_url"
     s3-upload-options="{getOptionsUri: s3OptionsUri, folder: 'images/'}">
  ```

attributes:
* bucket - Specify the wanted bucket
* s3-upload-options - Provide additional options:
  * getOptionsUri - The uri of the server service that is needed to sign the request (mentioned in section Setup#4) - Required if second option is empty.
  * getManualOptions - if for some reason you need to have your own mechanism of getting a policy, you can simply assign your scope variable to this option. Note it should be resolved on the moment of directive load.
  * folder - optional, specifies a folder inside the bucket the save the file to
  * enableValidation - optional, set to "false" in order to disable the field validation.
  * targetFilename - An optional attribute for the target filename. if provided the file will be renamed to the provided value instead of having the file original filename.

## Themes
ng-s3upload allows to customize the directive template using themes. Currently the available themes are: bootstrap2, bootstrap3

#### How to?

```javascript
app.config(function(ngS3Config) {
  ngS3Config.theme = 'bootstrap3';
});
```

[![Bitdeli Badge](https://d2weczhvl823v0.cloudfront.net/asafdav/ng-s3upload/trend.png)](https://bitdeli.com/free "Bitdeli Badge")

