CHANGELOG
=========

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
