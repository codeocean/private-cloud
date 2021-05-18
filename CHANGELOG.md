CHANGELOG
=========

## 0.13.2 (2021-05-18)

- Add support for RStudio 1.4 cloud workstation

## 0.13.1 (2021-05-03)

- Fixed an issue with dedicated machines root volume encryption
- Fixed an issue with github integration

## 0.13.0 (2021-04-21)

- Ability to connect and work directly with customer’s EFS volumes for computation
- Dedicated Machines: Support for g3 family of GPU dedicated machines
- Dedicate Machines: Fix to allow working large size external datasets
- Increased Git repo size limit to 2GB to align with Github 
- Continuous computational - Allow users to halt computation in Cloud Workstation, while preserving state to allow users to go back and continue from where they left off 
- Improved Package Suggestions - Package suggestion for apt-get has been improved to allow Cloud Workstation changes to be reflected in Code Ocean’s IDE 
- Admin Dashboard updates 
- UI redesign
- Simplified ability to create and manage base images 
- New authentication screen for admin SSO and Google auth setup
- Capsule Dashboard redesign
- Look and feel redesign 
- Increased filtering and searching functionality added to capsule dashboard 
- Package Management: Based on customer feedback, we have enabled ability for users to manage multiple packages at the same time
- File Browser context menu (right click).
- Bulk delete of files and folders in File Browser
- Upgrade S3FS in an effort to address memory issues.
- Upgrade to use latest (1.16) Go version
- New FE analytics pipeline

## 0.12.0 (2021-03-15)

- Ability to see and utilize unique Code-Ocean built Example capsules available to all users in their dashboard 
- Added support for Mathworks acccount configuration & Matlab Online
- New in-house pipeline for analytics data
- Management console for administrators updated with added functionality to support cloud formation move
- Management console UI new look and feel 
- Dedicated machines - Spot instance selection functionality added
- Dedicated machines - Machine costs added for dedicated machines
- Most recent results now show in the Results section in the IDE
- Bug fixes and performance improvements

## 0.11.0 (2021-03-02)

- Improved share functionality of capsules for security and simplicity with user permission management
- Assets Management: Ability to create a dataset directly from Cloud Workstation
- Assets Management: Provide users with ability to see enhanced  information about the dataset when attaching a dataset to a capsule
- Assets Management: Ability to rename the mounting point (folder) name under which the a dataset appears in the capsule
- UI fixes to address GPU based dedicated machines
- Updated documentation and in product help
- Ability to sort capsules by creation date for ease of discoverability
- Monitoring and alerting for cases where Git repo size is increased past Git limitation
- In place expansion for large text fields
- Bug fixes and performance improvements

## 0.10.0 (2021-01-12)

- Ability to select unique EC2 machines for computations including GPU support
- Unification of Datasets and Results UI
- Bug fixes and performance improvements

## 0.9.3 (2020-12-30)

- Fix AWS region configuration when using aws-sdk for Node.js

## 0.9.2 (2020-12-24)

- Fix Google OAuth2 issue in adding new dataset from Google Cloud bucket

## 0.9.1 (2020-12-19)

- Fix deployment error when running migration

## 0.9.0 (2020-12-08)

- Improved share functionality of data assets for security and simplicity with user
  permission management
- Ability to create datasets in Code Ocean, where data is kept on remote AWS storage
- Minor updates to the Secret Management UI based on customer feedback
- Support for AWS managed Redis and ElasticSearch
- Fixes to Package Management allowing bulk version reset functionality
- Ability to run GPU computations - in preview
- Various security hardenings

## 0.8.2 (2020-11-18)

- Fix CloudWatch logs filter for worker internal error metric

## 0.8.1 (2020-11-11)

- Fix CloudWatch alarm for workers scale in

## 0.8.0 (2020-11-11)

- New feature: Secret Management
- Ability to delete data assets (by the owner and when not in use)
- Interface tab name change to "App Panel",
- App Panel is no longer in "Beta" - label removed
- New viewers added to support XLS/ XLSM file formats
- Option to use managed AWS Elasticache for Redis instead of system's built-in Redis server
- Fixed issue with EFS volume mounting on system initialization
- Improve CloudWatch alarm for system 5xx errors

## 0.7.0 (2020-10-01)

- Interface tab: support for file upload as part of the interface tab run
- Published capsules can now be run directly from the explore page without a need to
  duplicate them first
- Introduced an easy way to discover capsules you run directly from the explore page,
  with the addition of a new section in the capsule page called: "Run by me"
- Fix for downloading files from non- `us-east-1` AWS regions
- Fixed issue with long filenames in datasets/ capture results detail pages:
  - Increased the size of the table in Dataset and Results to account for long file names
  - Added a tool tip for long file names
- Allow to scale down or up worker machine size within the `r5d` family of memory
  optimized EC2 instances
- Fixed a race condition in CloudWatch log groups creation after initial deployment
  that caused the system to fail to start
- Add option to configure SAML SSO identity provider using metadata fields: Entity ID,
  SSO URL, and X.509 certificate
- Other bug fixes and performance improvements

## 0.6.0 (2020-09-06)

- Mandatory tags are now required when creating datasets and capturing results
- It is now possible to capture results from the Code Ocean IDE in addition to
capturing from Cloud Workstation
- Importing a dataset from S3 or Google Cloud Bucket doesn't require the UI to be kept open
- Allow site admin to generate password reset links for users
- Add support for scaling in workers to 0 when idle
- Add automated daily EBS data volume backups
- Various bug fixes and performance improvements

## 0.5.2 (2020-08-09)

- Bug fix in data reported to analytics pipeline

## 0.5.1 (2020-07-30)

- Update capsule sample code

## 0.5.0 (2020-07-28)

- External Git
- Capsule interface
- Capsule cache
- Allow to restrict access to specific ingress CIDR blocks
- Add support for specifying VPC CIDR block
- Migrate to Pulumi 2
- Improved CloudWatch alerting on data volume disk utilization
- CloudWatch dashboard for data EBS volume metrics

## 0.4.2 (2020-07-20)

- Change cloudWatch alarms

## 0.4.1 (2020-06-30)

- Bug fixes

## 0.4.0 (2020-06-24)

- Asset Management: dynamic mount of datasets
- Asset Management: capture results from inside cloud workstation
- Centralized logging with CloudWatch Logs
- Use EC2 launch template for workers auto scaling group

## 0.3.0 (2020-06-10)

- Asset Management: support for datasets
- Capsule publishing
- CloudWatch alarms for monitoring
- Add X-Small compute resource class
- Improved workers scale out policies to avoid excess machines
- Support for analytics reporting via Segment
- Consistent resource tagging
- Linting with ESLint

## 0.2.1 (2020-04-05)

- Enable Advanced Compute Resources selection

## 0.2.0 (2020-03-15)

- Add support for cloud workstation idle timeout
- Add 2xsmall resource class

## 0.1.0 (2020-03-01)

Initial version
