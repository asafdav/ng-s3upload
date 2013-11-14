ng-s3upload - Upload to S3 using AngularJS
===========

An AngularJS directive that allows you to simply upload files directly to AWS S3.

## Setup 
1. Create AWS S3 bucket

2. Add CORS configuration to your bucket
In AWS web interface, select S3 and select the wanted bucket. 
Expand the "Permissions" section and click on the "Add CORS configuration" button. Paste the wanted CORS configuration, for example: 
  ```XML
  <?xml version="1.0" encoding="UTF-8"?>
  <CORSConfiguration xmlns="http://s3.amazonaws.com/doc/2006-03-01/">
      <CORSRule>
          <AllowedOrigin>*</AllowedOrigin>
          <AllowedMethod>GET</AllowedMethod>
          <MaxAgeSeconds>3000</MaxAgeSeconds>
          <AllowedHeader>Authorization</AllowedHeader>
      </CORSRule>
      <CORSRule>
          <AllowedOrigin>*</AllowedOrigin>
          <AllowedMethod>PUT</AllowedMethod>
          <MaxAgeSeconds>3000</MaxAgeSeconds>
          <AllowedHeader>Content-Type</AllowedHeader>
          <AllowedHeader>x-amz-acl</AllowedHeader>
          <AllowedHeader>origin</AllowedHeader>
      </CORSRule>
  </CORSConfiguration>
  ```
Once the CORS permissions are updated, your bucket is ready for client side uploads.

3. Create a server side service that will return the needed details for uploading files to S3.
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
    end
  ```
4. Download ng-s3upload.min.js and add it to your project or use bower (bower install ng-s3upload --save).

## Usage
1. Add ng-s3upload.min.js to your main file (index.html)

2. Set `ngS3upload` as a dependency in your module
  ```javascript
  var myapp = angular.module('myapp', ['ngS3upload'])
  ```

3. Add s3-upload directive to the wanted element, example:
  ```html
  <div s3-upload bucket="s3Bucket" ng-model="product.remote_product_file_url"
     s3-upload-options="{getOptionsUri: s3OptionsUri}" >
  ```

attributes: 
* bucket - Speificy the wanted bucket
* s3-upload-options - Provide additional options:
  * getOptionsUri - The uri of the server service that is needed to sign the request (mentioned in section Setup#3) - Required. 
  
